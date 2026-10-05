import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionByToken } from "@/lib/admissionServer";
import { FieldType, normalizeFieldValue } from "@/lib/admission";

/** O candidato salva os dados pedidos: { values: { [fieldId]: texto } }. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admission = await admissionByToken(token);
  if (!admission) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const values = body?.values;
  if (typeof values !== "object" || values === null) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const errors: Record<string, string> = {};
  const updates: { id: string; key: string; value: string | null }[] = [];
  for (const field of admission.fields) {
    if (!(field.id in values)) continue;
    const raw = typeof values[field.id] === "string" ? values[field.id] : "";
    const result = normalizeFieldValue(field.type as FieldType, raw);
    if ("error" in result) errors[field.id] = result.error;
    else updates.push({ id: field.id, key: field.key, value: result.value });
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Confira os campos destacados.", fields: errors }, { status: 400 });
  }

  // Nome, e-mail e telefone também alimentam o cadastro do onboarding.
  const byKey = Object.fromEntries(updates.map((u) => [u.key, u.value]));
  await prisma.$transaction([
    ...updates.map((u) => prisma.admissionField.update({ where: { id: u.id }, data: { value: u.value } })),
    prisma.admission.update({
      where: { id: admission.id },
      data: {
        ...("nome" in byKey ? { candidateName: byKey.nome } : {}),
        ...("email" in byKey ? { email: byKey.email } : {}),
        ...("telefone" in byKey ? { phone: byKey.telefone } : {}),
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
