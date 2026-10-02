import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { ADMISSION_INCLUDE, publicAdmission } from "@/lib/admissionServer";
import { exportAdmissionToDrive } from "@/lib/admissionDrive";

/** Tenta de novo o envio ao Google Drive (só envia o que faltou). */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });
  if (admission.status !== "concluida") {
    return NextResponse.json({ error: "Só onboardings concluídos vão para o Drive." }, { status: 409 });
  }

  await exportAdmissionToDrive(id);
  const updated = await prisma.admission.findUnique({ where: { id }, include: ADMISSION_INCLUDE });
  return NextResponse.json(publicAdmission(updated!));
}
