import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionByToken } from "@/lib/admissionServer";
import { removeAttachmentFiles, saveAttachment } from "@/lib/attachmentStorage";

const MAX_FILES_PER_DOCUMENT = 6;

/** O candidato envia um arquivo para um documento da lista. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; docId: string }> }
) {
  const { token, docId } = await params;
  const admission = await admissionByToken(token);
  if (!admission) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });

  const document = admission.documents.find((d) => d.id === docId);
  if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (document.status === "aprovado") {
    return NextResponse.json({ error: "Este documento já foi aprovado pelo RH." }, { status: 409 });
  }
  if (document.files.length >= MAX_FILES_PER_DOCUMENT) {
    return NextResponse.json({ error: `Limite de ${MAX_FILES_PER_DOCUMENT} arquivos por documento.` }, { status: 409 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });

  const saved = await saveAttachment(file, "admissoes");
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.admissionFile.create({
        data: {
          documentId: docId,
          fileName: file.name.slice(0, 200) || "documento",
          mimeType: saved.mimeType,
          size: saved.size,
          storedName: saved.storedName,
        },
      }),
      // Envio novo volta para a fila de análise do RH.
      prisma.admissionDocument.update({ where: { id: docId }, data: { status: "enviado", reviewNote: null } }),
    ]);
  } catch (err) {
    await removeAttachmentFiles([saved.storedName], "admissoes");
    throw err;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
