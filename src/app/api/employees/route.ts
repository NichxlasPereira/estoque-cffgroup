import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmployeeInput } from "@/lib/attendanceValidation";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: [{ name: "asc" }],
  });
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateEmployeeInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const employee = await prisma.employee.create({ data: result.data });
  return NextResponse.json(employee, { status: 201 });
}
