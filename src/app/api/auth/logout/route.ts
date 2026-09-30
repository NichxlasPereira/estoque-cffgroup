import { NextRequest, NextResponse } from "next/server";
import { MODULES, isModuleKey } from "@/lib/moduleAuth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const moduleKey = body?.module;
  if (!isModuleKey(moduleKey)) {
    return NextResponse.json({ error: "Módulo inválido." }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MODULES[moduleKey].cookie);
  return response;
}
