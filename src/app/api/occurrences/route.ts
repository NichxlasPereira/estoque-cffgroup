import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { validateOccurrenceInput } from "@/lib/attendanceValidation";
import { checkFolgaBalance } from "@/lib/folgaBalance";

export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const occurrences = await prisma.attendanceOccurrence.findMany({
    // Atrasos foram retirados do sistema; os antigos ficam no banco, fora da lista.
    where: { type: { not: "atraso" } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      attachments: {
        select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json(occurrences);
}

export async function POST(request: NextRequest) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const result = validateOccurrenceInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: result.data.employeeId } });
  if (!employee) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const input = result.data;
  const outcome = await prisma.$transaction(async (tx) => {
    const balanceError = await checkFolgaBalance(tx, input, employee.folgaAllowance);
    if (balanceError) return { error: balanceError };
    const occurrence = await tx.attendanceOccurrence.create({
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
  return NextResponse.json(outcome.occurrence, { status: 201 });
}
