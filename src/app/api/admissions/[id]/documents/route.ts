import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { parseChecklist } from "@/lib/admissionValidation";

/** Acrescenta um documento à lista da admissão. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id }, include: { documents: true } });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = parseChecklist([body]);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const sortOrder = Math.max(-1, ...admission.documents.map((d) => d.sortOrder)) + 1;
  const document = await prisma.admissionDocument.create({
    data: { ...parsed.data[0], admissionId: id, sortOrder },
    include: { files: true },
  });
  return NextResponse.json(document, { status: 201 });
}
