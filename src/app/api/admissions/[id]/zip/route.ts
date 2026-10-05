import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { readAttachment } from "@/lib/attachmentStorage";
import { buildZip } from "@/lib/zip";

const clean = (name: string) =>
  name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "documento";

/**
 * Baixa os documentos do onboarding num .zip: uma pasta com o nome da pessoa e
 * os arquivos com o nome do documento — pronto para arrastar para o Drive.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({
    where: { id },
    include: { documents: { orderBy: { sortOrder: "asc" }, include: { files: { orderBy: { createdAt: "asc" } } } } },
  });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });

  const date = (admission.startDate ?? admission.createdAt).toISOString().slice(0, 10);
  const folder = clean(`${admission.candidateName ?? "Candidato"} – ${date}`);
  const entries: { name: string; data: Buffer }[] = [];
  for (const doc of admission.documents) {
    for (const [index, file] of doc.files.entries()) {
      const data = await readAttachment(file.storedName, "admissoes");
      if (!data) continue;
      const suffix = doc.files.length > 1 ? ` (${index + 1})` : "";
      entries.push({ name: `${folder}/${clean(doc.name + suffix)}${path.extname(file.storedName)}`, data });
    }
  }
  if (entries.length === 0) {
    return NextResponse.json({ error: "Este onboarding ainda não tem documentos enviados." }, { status: 404 });
  }

  const zip = buildZip(entries);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.length),
      "Content-Disposition": `attachment; filename="onboarding.zip"; filename*=UTF-8''${encodeURIComponent(folder)}.zip`,
      "Cache-Control": "private, no-store",
    },
  });
}
