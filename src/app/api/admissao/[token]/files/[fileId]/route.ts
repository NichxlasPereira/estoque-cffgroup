import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionByToken } from "@/lib/admissionServer";
import { removeAttachmentFiles } from "@/lib/attachmentStorage";

/** O candidato remove um arquivo que enviou errado (antes da aprovação). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> }
) {
  const { token, fileId } = await params;
  const admission = await admissionByToken(token);
  if (!admission) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });

  const document = admission.documents.find((d) => d.files.some((f) => f.id === fileId));
  const file = document?.files.find((f) => f.id === fileId);
  if (!document || !file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  if (document.status === "aprovado") {
    return NextResponse.json({ error: "Este documento já foi aprovado pelo RH." }, { status: 409 });
  }

  const remaining = document.files.length - 1;
  await prisma.$transaction([
    prisma.admissionFile.delete({ where: { id: fileId } }),
    prisma.admissionDocument.update({
      where: { id: document.id },
      // Sem arquivos, volta a "não enviado" (a recusa anterior continua valendo se houver).
      data: remaining === 0 ? { status: document.status === "recusado" ? "recusado" : "pendente" } : {},
    }),
  ]);
  await removeAttachmentFiles([file.storedName], "admissoes");
  return NextResponse.json({ ok: true });
}
