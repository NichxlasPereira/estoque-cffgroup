import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { admissionLink, newAdmissionToken } from "@/lib/admissionServer";

/** Gera um novo link para o candidato (o anterior deixa de funcionar). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });
  if (admission.status !== "em_andamento") {
    return NextResponse.json({ error: "Só onboardings em andamento têm link ativo." }, { status: 409 });
  }

  const { token, tokenHash, tokenExpiresAt } = newAdmissionToken();
  await prisma.admission.update({ where: { id }, data: { tokenHash, tokenExpiresAt } });
  return NextResponse.json({ link: admissionLink(request, token), tokenExpiresAt });
}
