import path from "node:path";
import { prisma } from "./prisma";
import { readAttachment } from "./attachmentStorage";
import { DriveError, DriveSession, driveConfig } from "./googleDrive";

/** Nome seguro para o Drive (sem barras nem caracteres de controle). */
function cleanName(name: string): string {
  return name.replace(/[\\/\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 150) || "documento";
}

function folderName(candidateName: string, startDate: Date | null): string {
  const date = (startDate ?? new Date()).toISOString().slice(0, 10);
  return cleanName(`${candidateName} – ${date}`);
}

/**
 * Copia os documentos aprovados de um onboarding concluído para o Google
 * Drive: uma pasta por pessoa, arquivos com o nome do documento. Pode ser
 * chamada de novo após um erro — só envia o que ainda não foi.
 * Nunca lança: o resultado fica gravado na própria admissão.
 */
export async function exportAdmissionToDrive(admissionId: string): Promise<void> {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      documents: {
        where: { status: "aprovado" },
        orderBy: { sortOrder: "asc" },
        include: { files: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!admission || admission.status !== "concluida") return;

  const fail = (message: string) =>
    prisma.admission.update({ where: { id: admissionId }, data: { driveStatus: "erro", driveError: message.slice(0, 500) } });

  let config;
  try {
    config = driveConfig();
  } catch (err) {
    await fail(err instanceof Error ? err.message : "Configuração do Google Drive inválida.");
    return;
  }
  if (!config) {
    await prisma.admission.update({
      where: { id: admissionId },
      data: { driveStatus: "nao_configurado", driveError: null },
    });
    return;
  }

  try {
    const drive = await DriveSession.open(config);

    let folderId = admission.driveFolderId;
    if (!folderId) {
      const folder = await drive.createFolder(folderName(admission.candidateName ?? "Sem nome", admission.startDate));
      folderId = folder.id;
      // Grava a pasta já: numa nova tentativa, reaproveita em vez de criar outra.
      await prisma.admission.update({
        where: { id: admissionId },
        data: { driveFolderId: folder.id, driveFolderUrl: folder.url },
      });
    }

    for (const doc of admission.documents) {
      for (const [index, file] of doc.files.entries()) {
        if (file.driveFileId) continue;
        const data = await readAttachment(file.storedName, "admissoes");
        if (!data) throw new DriveError(`O arquivo de “${doc.name}” não foi encontrado no servidor.`);
        const ext = path.extname(file.storedName);
        const suffix = doc.files.length > 1 ? ` (${index + 1})` : "";
        const driveFileId = await drive.uploadFile(cleanName(`${doc.name}${suffix}`) + ext, file.mimeType, data, folderId);
        await prisma.admissionFile.update({ where: { id: file.id }, data: { driveFileId } });
      }
    }

    await prisma.admission.update({
      where: { id: admissionId },
      data: { driveStatus: "enviado", driveError: null, driveSyncedAt: new Date() },
    });
  } catch (err) {
    await fail(err instanceof DriveError ? err.message : `Falha inesperada ao enviar para o Drive: ${String(err)}`);
  }
}
