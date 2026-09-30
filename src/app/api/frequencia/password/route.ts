import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireFrequenciaUser, validateNewPassword, verifyPassword } from "@/lib/frequenciaAccess";

/** A própria pessoa troca a senha (precisa informar a atual). */
export async function POST(request: NextRequest) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const user = await prisma.frequenciaUser.findUnique({ where: { id: auth.user.id } });
  if (!user || !(await verifyPassword(typeof body?.current === "string" ? body.current : "", user.passwordHash))) {
    return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 400 });
  }
  const passwordError = validateNewPassword(body?.next);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  await prisma.frequenciaUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.next) } });
  return NextResponse.json({ ok: true });
}
