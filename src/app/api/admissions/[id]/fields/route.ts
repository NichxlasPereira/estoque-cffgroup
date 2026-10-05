import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { DEFAULT_FIELDS } from "@/lib/admission";

/**
 * O RH pede mais um dado ao candidato: { key } de um campo padrão que tinha
 * sido retirado, ou { label } para um campo de texto livre.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id }, include: { fields: true } });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const preset = DEFAULT_FIELDS.find((f) => f.key === body?.key);
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 80) : "";
  if (!preset && !label) return NextResponse.json({ error: "Informe o nome do dado." }, { status: 400 });

  const key = preset?.key ?? `extra-${Date.now().toString(36)}`;
  if (admission.fields.some((f) => f.key === key)) {
    return NextResponse.json({ error: "Este dado já está sendo pedido." }, { status: 409 });
  }
  const sortOrder = Math.max(-1, ...admission.fields.map((f) => f.sortOrder)) + 1;
  const field = await prisma.admissionField.create({
    data: preset
      ? { ...preset, admissionId: id, sortOrder }
      : { key, label, type: "text", required: body?.required !== false, admissionId: id, sortOrder },
  });
  return NextResponse.json(field, { status: 201 });
}
