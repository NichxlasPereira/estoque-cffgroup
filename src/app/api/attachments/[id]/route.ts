import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readAttachment, removeAttachmentFiles } from "@/lib/attachmentStorage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await prisma.attendanceAttachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  const data = await readAttachment(attachment.storedName);
  if (!data) {
    return NextResponse.json({ error: "O arquivo deste anexo não foi encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      // Documento de saúde: não deixa cópias em caches intermediários.
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await prisma.attendanceAttachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  await prisma.attendanceAttachment.delete({ where: { id } });
  await removeAttachmentFiles([attachment.storedName]);
  return NextResponse.json({ ok: true });
}
