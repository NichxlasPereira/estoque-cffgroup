import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_SELECT, hashPassword, requireFrequenciaUser, validateNewPassword } from "@/lib/frequenciaAccess";

/** Sempre sobra pelo menos um administrador ativo. */
async function wouldRemoveLastAdmin(userId: string): Promise<boolean> {
  const others = await prisma.frequenciaUser.count({
    where: { role: "admin", active: true, id: { not: userId } },
  });
  return others === 0;
}

/** Altera perfil, bloqueia/desbloqueia ou redefine a senha de uma pessoa. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const target = await prisma.frequenciaUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Acesso não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const data: { active?: boolean; role?: string; passwordHash?: string } = {};

  if (typeof body?.active === "boolean") data.active = body.active;
  if (body?.role === "admin" || body?.role === "member") data.role = body.role;
  if (body?.password !== undefined) {
    const passwordError = validateNewPassword(body.password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
    data.passwordHash = await hashPassword(body.password);
  }

  const losesAdmin = target.role === "admin" && target.active && (data.active === false || data.role === "member");
  if (losesAdmin && (await wouldRemoveLastAdmin(id))) {
    return NextResponse.json({ error: "É preciso manter pelo menos um administrador ativo." }, { status: 409 });
  }
  if (id === auth.user.id && data.active === false) {
    return NextResponse.json({ error: "Você não pode bloquear o seu próprio acesso." }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.frequenciaUser.update({ where: { id }, data, select: USER_SELECT });
    // Bloqueio ou senha nova: encerra as sessões abertas dessa pessoa.
    if (data.active === false || data.passwordHash) {
      await tx.frequenciaSession.deleteMany({ where: { userId: id } });
    }
    return user;
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser({ admin: true });
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const target = await prisma.frequenciaUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Acesso não encontrado." }, { status: 404 });
  if (id === auth.user.id) {
    return NextResponse.json({ error: "Você não pode remover o seu próprio acesso." }, { status: 409 });
  }
  if (target.role === "admin" && target.active && (await wouldRemoveLastAdmin(id))) {
    return NextResponse.json({ error: "É preciso manter pelo menos um administrador ativo." }, { status: 409 });
  }

  await prisma.frequenciaUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
