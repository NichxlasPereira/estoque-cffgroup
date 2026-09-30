import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { validateOccurrenceInput } from "@/lib/attendanceValidation";
import { removeAttachmentFiles } from "@/lib/attachmentStorage";
import { checkFolgaBalance } from "@/lib/folgaBalance";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = validateOccurrenceInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.attendanceOccurrence.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: result.data.employeeId } });
  if (!employee) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const input = result.data;
  const outcome = await prisma.$transaction(async (tx) => {
    const balanceError = await checkFolgaBalance(tx, input, employee.folgaAllowance, id);
    if (balanceError) return { error: balanceError };
    const occurrence = await tx.attendanceOccurrence.update({
      where: { id },
      data: {
        ...input,
        employeeName: employee.name,
        employeeDepartment: employee.department,
      },
    });
    return { occurrence };
  });
  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: 409 });
  }
  return NextResponse.json(outcome.occurrence);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const existing = await prisma.attendanceOccurrence.findUnique({
    where: { id },
    include: { attachments: { select: { storedName: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  // Os registros de anexo saem em cascata; os arquivos em disco, aqui.
  await prisma.attendanceOccurrence.delete({ where: { id } });
  await removeAttachmentFiles(existing.attachments.map((a) => a.storedName));
  return NextResponse.json({ ok: true });
}
