import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dummyPasswordHash, normalizeEmail, startSession, verifyPassword } from "@/lib/frequenciaAccess";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  const user = email ? await prisma.frequenciaUser.findUnique({ where: { email } }) : null;
  // Compara mesmo quando o e-mail não existe, para não revelar quem tem conta.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyPasswordHash()));

  if (!user || !ok || !user.active || user.pending) {
    // Atraso fixo: torna tentativa e erro em massa bem mais lenta.
    await new Promise((r) => setTimeout(r, 800));
    // Só quem acertou a senha fica sabendo da situação do cadastro.
    const error = !user || !ok
      ? "E-mail ou senha incorretos."
      : user.pending
        ? "Seu cadastro ainda está aguardando a aprovação de um administrador."
        : "Seu acesso está bloqueado. Fale com o administrador.";
    return NextResponse.json({ error }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  await startSession(user.id, response);
  return response;
}
