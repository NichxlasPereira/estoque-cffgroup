import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizeEmail, validateNewPassword } from "@/lib/frequenciaAccess";

/**
 * Pedido de cadastro feito pela própria pessoa. A conta nasce pendente e sem
 * acesso a nada; um administrador precisa aprovar na aba "acessos".
 */
export async function POST(request: NextRequest) {
  if ((await prisma.frequenciaUser.count({ where: { role: "admin", pending: false } })) === 0) {
    return NextResponse.json({ error: "O primeiro acesso ainda não foi feito." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body?.email);
  if (!name) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ error: "Nome longo demais." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  const passwordError = validateNewPassword(body?.password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  if (await prisma.frequenciaUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Já existe um cadastro com este e-mail." }, { status: 409 });
  }

  await prisma.frequenciaUser.create({
    data: { name, email, role: "member", pending: true, passwordHash: await hashPassword(body.password) },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
