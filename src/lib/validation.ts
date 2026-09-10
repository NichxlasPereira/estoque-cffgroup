export interface MaterialInput {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  location?: string | null;
  supplier?: string | null;
  price?: number | null;
  purchaseLink?: string | null;
}

export function validateMaterialInput(body: unknown): { data: MaterialInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Dados inválidos." };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "O nome do material é obrigatório." };

  const category = typeof b.category === "string" ? b.category.trim() : "";
  if (!category) return { error: "A categoria é obrigatória." };

  const unit = typeof b.unit === "string" ? b.unit.trim() : "";
  if (!unit) return { error: "A unidade é obrigatória." };

  const quantity = Number(b.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { error: "A quantidade deve ser um número maior ou igual a zero." };
  }

  const minQuantity =
    b.minQuantity === undefined || b.minQuantity === null || b.minQuantity === ("" as unknown)
      ? 5
      : Number(b.minQuantity);
  if (!Number.isFinite(minQuantity) || minQuantity < 0) {
    return { error: "O estoque mínimo deve ser um número maior ou igual a zero." };
  }

  const location = typeof b.location === "string" && b.location.trim() ? b.location.trim() : null;
  const supplier = typeof b.supplier === "string" && b.supplier.trim() ? b.supplier.trim() : null;

  let price: number | null = null;
  if (b.price !== undefined && b.price !== null && b.price !== ("" as unknown)) {
    price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) {
      return { error: "O preço deve ser um número maior ou igual a zero." };
    }
  }

  let purchaseLink: string | null = null;
  if (typeof b.purchaseLink === "string" && b.purchaseLink.trim()) {
    purchaseLink = b.purchaseLink.trim();
    if (!/^https?:\/\//i.test(purchaseLink)) {
      return { error: "O link de compra deve começar com http:// ou https://." };
    }
  }

  return {
    data: { name, category, unit, quantity, minQuantity, location, supplier, price, purchaseLink },
  };
}
