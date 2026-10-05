import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { ADMISSION_INCLUDE, publicAdmission } from "@/lib/admissionServer";
import { syncAdmissionToSheet } from "@/lib/admissionSheet";

/** Grava de novo a linha do candidato na planilha (cria ou atualiza). */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });
  if (!admission.candidateName) {
    return NextResponse.json({ error: "O candidato ainda não enviou os dados." }, { status: 409 });
  }

  await syncAdmissionToSheet(id);
  const updated = await prisma.admission.findUnique({ where: { id }, include: ADMISSION_INCLUDE });
  return NextResponse.json(publicAdmission(updated!));
}
