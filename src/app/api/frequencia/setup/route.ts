import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  normalizeEmail,
  safeEqualStrings,
  setupKey,
  startSession,
  validateNewPassword,
} from "@/lib/frequenciaAccess";

/**
 * Primeiro acesso: cria o primeiro administrador. Só funciona enquanto não
 * existe nenhuma conta, e exige a chave FREQUENCIA_PASSWORD do servidor.
 */
export async function POST(request: NextRequest) {
  const key = setupKey();
  if (!key) {
    return NextResponse.json(
      { error: "A chave de primeiro acesso (FREQUENCIA_PASSWORD) não está configurada no servidor." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const attempt = typeof body?.setupKey === "string" ? body.setupKey : "";
  if (!safeEqualStrings(attempt, key)) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Chave de primeiro acesso incorreta." }, { status: 401 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body?.email);
  if (!name) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  const passwordError = validateNewPassword(body?.password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
  const passwordHash = await hashPassword(body.password);

  // Dentro da transação, para duas pessoas não virarem "primeiro admin" ao mesmo tempo.
  const created = await prisma.$transaction(async (tx) => {
    if ((await tx.frequenciaUser.count()) > 0) return null;
    return tx.frequenciaUser.create({ data: { name, email, passwordHash, role: "admin" } });
  });
  if (!created) {
    return NextResponse.json({ error: "O primeiro acesso já foi feito. Entre com seu e-mail e senha." }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });
  await startSession(created.id, response);
  return response;
}
