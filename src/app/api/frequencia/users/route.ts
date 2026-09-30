import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_SELECT, hashPassword, normalizeEmail, requireFrequenciaUser, validateNewPassword } from "@/lib/frequenciaAccess";

export async function GET() {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;

  const users = await prisma.frequenciaUser.findMany({ select: USER_SELECT, orderBy: { name: "asc" } });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body?.email);
  const role = body?.role === "admin" ? "admin" : "member";
  if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  const passwordError = validateNewPassword(body?.password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  if (await prisma.frequenciaUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Já existe um acesso com este e-mail." }, { status: 409 });
  }

  const user = await prisma.frequenciaUser.create({
    data: { name, email, role, passwordHash: await hashPassword(body.password) },
    select: USER_SELECT,
  });
  return NextResponse.json(user, { status: 201 });
}
