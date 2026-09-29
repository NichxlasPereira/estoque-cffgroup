import { NextRequest, NextResponse } from "next/server";
import {
  FREQ_COOKIE,
  FREQ_SESSION_SECONDS,
  createSessionToken,
  frequenciaPassword,
  safeEqual,
} from "@/lib/frequenciaAuth";

export async function POST(request: NextRequest) {
  const password = frequenciaPassword();
  if (!password) {
    return NextResponse.json(
      { error: "A senha da frequência ainda não foi configurada no servidor (FREQUENCIA_PASSWORD)." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const attempt = typeof body?.password === "string" ? body.password : "";

  if (!safeEqual(attempt, password)) {
    // Atraso fixo: torna tentativa e erro em massa bem mais lenta.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(FREQ_COOKIE, createSessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FREQ_SESSION_SECONDS,
  });
  return response;
}
