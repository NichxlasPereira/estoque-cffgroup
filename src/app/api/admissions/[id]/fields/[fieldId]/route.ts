import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";

async function findField(admissionId: string, fieldId: string) {
  const field = await prisma.admissionField.findUnique({ where: { id: fieldId } });
  return field && field.admissionId === admissionId ? field : null;
}

/** Torna o dado obrigatório ou opcional: { required }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id, fieldId } = await params;

  const field = await findField(id, fieldId);
  if (!field) return NextResponse.json({ error: "Dado não encontrado." }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (typeof body?.required !== "boolean") return NextResponse.json({ error: "Nada para alterar." }, { status: 400 });
  if (field.key === "nome" && !body.required) {
    return NextResponse.json({ error: "O nome é sempre obrigatório." }, { status: 409 });
  }

  const updated = await prisma.admissionField.update({ where: { id: fieldId }, data: { required: body.required } });
  return NextResponse.json(updated);
}

/** Para de pedir este dado (o que já foi preenchido some junto). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id, fieldId } = await params;

  const field = await findField(id, fieldId);
  if (!field) return NextResponse.json({ error: "Dado não encontrado." }, { status: 404 });
  if (field.key === "nome") {
    return NextResponse.json({ error: "O nome não pode ser retirado — ele vira o cadastro do colaborador." }, { status: 409 });
  }
  await prisma.admissionField.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
