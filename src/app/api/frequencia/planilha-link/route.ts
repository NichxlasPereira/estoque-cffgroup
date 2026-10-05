import { NextRequest, NextResponse } from "next/server";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { exportLinkInfo, exportUrl, revokeExportToken, rotateExportToken } from "@/lib/sheetExport";

function publicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Situação do link (sem revelar o link: o banco só guarda o hash). */
export async function GET() {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;
  return NextResponse.json(await exportLinkInfo());
}

/** Gera um link novo — o anterior para de funcionar. Só administradores. */
export async function POST(request: NextRequest) {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;
  const token = await rotateExportToken();
  const url = exportUrl(publicOrigin(request), token);
  return NextResponse.json({ url, formula: `=IMPORTDATA("${url}")` });
}

/** Desativa o link: a planilha para de receber dados. */
export async function DELETE() {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;
  await revokeExportToken();
  return NextResponse.json({ ok: true });
}
