import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOccurrenceInput } from "@/lib/attendanceValidation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const occurrence = await prisma.attendanceOccurrence.update({
    where: { id },
    data: {
      ...result.data,
      employeeName: employee.name,
      employeeDepartment: employee.department,
    },
  });
  return NextResponse.json(occurrence);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.attendanceOccurrence.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  await prisma.attendanceOccurrence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
