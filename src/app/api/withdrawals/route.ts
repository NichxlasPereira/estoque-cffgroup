import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: [{ timestamp: "desc" }],
  });
  return NextResponse.json(withdrawals);
}

class InsufficientStockError extends Error {
  available: number;
  constructor(available: number) {
    super("Estoque insuficiente.");
    this.available = available;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const materialId = typeof b.materialId === "string" ? b.materialId : "";
  if (!materialId) {
    return NextResponse.json({ error: "Selecione um material." }, { status: 400 });
  }

  const quantity = Number(b.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "A quantidade retirada deve ser maior que zero." },
      { status: 400 }
    );
  }

  const withdrawnBy = typeof b.withdrawnBy === "string" ? b.withdrawnBy.trim() : "";
  if (!withdrawnBy) {
    return NextResponse.json({ error: "Informe o nome de quem retirou." }, { status: 400 });
  }

  const dateRaw = typeof b.date === "string" && b.date ? b.date : null;
  if (!dateRaw) {
    return NextResponse.json({ error: "Informe a data da retirada." }, { status: 400 });
  }
  const date = new Date(`${dateRaw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  try {
    const withdrawal = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (!material) {
        throw new Error("MATERIAL_NOT_FOUND");
      }

      const updateResult = await tx.material.updateMany({
        where: { id: materialId, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });

      if (updateResult.count === 0) {
        const fresh = await tx.material.findUnique({ where: { id: materialId } });
        throw new InsufficientStockError(fresh?.quantity ?? 0);
      }

      return tx.withdrawal.create({
        data: {
          materialId: material.id,
          materialName: material.name,
          category: material.category,
          unit: material.unit,
          quantity,
          date,
          withdrawnBy,
        },
      });
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: `Estoque insuficiente. Disponível: ${err.available}.`,
          available: err.available,
        },
        { status: 409 }
      );
    }
    if (err instanceof Error && err.message === "MATERIAL_NOT_FOUND") {
      return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Não foi possível registrar a retirada." }, { status: 500 });
    }
    throw err;
  }
}
