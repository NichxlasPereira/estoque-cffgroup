import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOccurrenceInput } from "@/lib/attendanceValidation";

export async function GET() {
  const occurrences = await prisma.attendanceOccurrence.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(occurrences);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateOccurrenceInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: result.data.employeeId } });
  if (!employee) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const occurrence = await prisma.attendanceOccurrence.create({
    data: {
      ...result.data,
      employeeName: employee.name,
      employeeDepartment: employee.department,
    },
  });
  return NextResponse.json(occurrence, { status: 201 });
}
