import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { ADMISSION_INCLUDE, admissionLink, newAdmissionToken, publicAdmission } from "@/lib/admissionServer";
import { parseAdmissionFields, parseChecklist } from "@/lib/admissionValidation";

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

  const body = await request.json().catch(() => null);
  const fields = parseAdmissionFields(body);
  if ("error" in fields) return NextResponse.json({ error: fields.error }, { status: 400 });
  const checklist = parseChecklist(body?.documents);
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
    },
    include: ADMISSION_INCLUDE,
  });

  return NextResponse.json(
    { admission: publicAdmission(admission), link: admissionLink(request, token) },
    { status: 201 }
  );
}
