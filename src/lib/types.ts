export type StockStatus = "normal" | "baixo" | "esgotado";

export const CATEGORIAS_SUGERIDAS = [
  "Papelaria",
  "Limpeza",
  "Copa e Cozinha",
  "Eletrônicos",
  "Mobiliário",
  "TI e Periféricos",
  "Insumos",
  "Outros",
] as const;

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  location: string | null;
  supplier: string | null;
  price: number | null;
  purchaseLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  materialId: string | null;
  materialName: string;
  category: string;
  unit: string;
  quantity: number;
  date: string;
  withdrawnBy: string;
  timestamp: string;
}

export function getStockStatus(quantity: number, minQuantity: number): StockStatus {
  if (quantity <= 0) return "esgotado";
  if (minQuantity > 0 && quantity <= minQuantity) return "baixo";
  return "normal";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  normal: "Normal",
  baixo: "Estoque baixo",
  esgotado: "Esgotado",
};
