import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMaterialInput } from "@/lib/validation";

export async function GET() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateMaterialInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const material = await prisma.material.create({ data: result.data });
  return NextResponse.json(material, { status: 201 });
}
