import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { readAttachment } from "@/lib/attachmentStorage";

/** RH abre um documento enviado pelo candidato. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const file = await prisma.admissionFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

  const data = await readAttachment(file.storedName, "admissoes");
  if (!data) return NextResponse.json({ error: "O arquivo não foi encontrado no servidor." }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
