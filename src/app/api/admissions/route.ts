import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { ADMISSION_INCLUDE, admissionLink, newAdmissionToken, publicAdmission } from "@/lib/admissionServer";
import { parseAdmissionFields, parseChecklist } from "@/lib/admissionValidation";
import { DEFAULT_CHECKLIST, DEFAULT_FIELDS } from "@/lib/admission";

export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;

  const admissions = await prisma.admission.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: ADMISSION_INCLUDE,
  });
  return NextResponse.json(admissions.map(publicAdmission));
}

export async function POST(request: NextRequest) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;

  // Um clique basta: sem corpo, cria com os dados e documentos padrão e o
  // candidato preenche tudo pelo link. O RH ajusta depois, se quiser.
  const body = (await request.json().catch(() => null)) ?? {};
  const fields = parseAdmissionFields(body);
  if ("error" in fields) return NextResponse.json({ error: fields.error }, { status: 400 });
  const checklist = parseChecklist(body.documents ?? DEFAULT_CHECKLIST);
  if ("error" in checklist) return NextResponse.json({ error: checklist.error }, { status: 400 });

  const { token, tokenHash, tokenExpiresAt } = newAdmissionToken();
  const admission = await prisma.admission.create({
    data: {
      ...fields.data,
      tokenHash,
      tokenExpiresAt,
      createdBy: auth.user.name,
      documents: {
        create: checklist.data.map((item, index) => ({ ...item, sortOrder: index })),
      },
      fields: {
        create: DEFAULT_FIELDS.map((f, index) => ({ ...f, sortOrder: index })),
      },
    },
    include: ADMISSION_INCLUDE,
  });

  return NextResponse.json(
    { admission: publicAdmission(admission), link: admissionLink(request, token) },
    { status: 201 }
  );
}
