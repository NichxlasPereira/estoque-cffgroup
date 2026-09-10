import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMaterialInput } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = validateMaterialInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }

  const material = await prisma.material.update({
    where: { id },
    data: result.data,
  });
  return NextResponse.json(material);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }

  await prisma.material.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
