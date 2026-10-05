import { NextRequest, NextResponse } from "next/server";
import { isValidExportToken, onboardingCsv } from "@/lib/sheetExport";

/** Lido pela planilha do RH via =IMPORTDATA. Sem login: o token do link é a chave. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await isValidExportToken(token))) {
    return new NextResponse("Link inválido ou desativado. Gere um novo link no RHGroup, aba onboarding.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(await onboardingCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
