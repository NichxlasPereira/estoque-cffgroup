import { Material, Withdrawal } from "./types";

export const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export interface CountBucket {
  label: string;
  count: number;
  quantity: number;
}

export interface MaterialRanking {
  materialId: string | null;
  name: string;
  quantity: number;
  cost: number;
}

export interface ReportData {
  byWeekday: CountBucket[];
  byMonth: CountBucket[];
  mostWithdrawn: MaterialRanking | null;
  leastWithdrawn: MaterialRanking | null;
  highestCost: MaterialRanking | null;
  totalWithdrawals: number;
  totalQuantity: number;
  totalCost: number;
}

function monthLabel(year: number, month: number): string {
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[month]}/${year}`;
}

export function buildReport(materials: Material[], withdrawals: Withdrawal[]): ReportData {
  const priceByMaterialId = new Map(materials.map((m) => [m.id, m.price]));

  const weekdayBuckets: CountBucket[] = WEEKDAY_LABELS.map((label) => ({ label, count: 0, quantity: 0 }));
  const monthMap = new Map<string, CountBucket & { sortKey: number }>();
  const byMaterial = new Map<string, MaterialRanking>();

  let totalQuantity = 0;
  let totalCost = 0;

  for (const w of withdrawals) {
    const date = new Date(w.date);
    const weekday = date.getUTCDay();
    weekdayBuckets[weekday].count += 1;
    weekdayBuckets[weekday].quantity += w.quantity;

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const existingMonth = monthMap.get(monthKey);
    if (existingMonth) {
      existingMonth.count += 1;
      existingMonth.quantity += w.quantity;
    } else {
      monthMap.set(monthKey, {
        label: monthLabel(year, month),
        count: 1,
        quantity: w.quantity,
        sortKey: year * 12 + month,
      });
    }

    const price = w.materialId ? priceByMaterialId.get(w.materialId) ?? null : null;
    const cost = price !== null ? price * w.quantity : 0;
    totalQuantity += w.quantity;
    totalCost += cost;

    const key = w.materialId ?? `__deleted__:${w.materialName}`;
    const existingMaterial = byMaterial.get(key);
    if (existingMaterial) {
      existingMaterial.quantity += w.quantity;
      existingMaterial.cost += cost;
    } else {
      byMaterial.set(key, {
        materialId: w.materialId,
        name: w.materialName,
        quantity: w.quantity,
        cost,
      });
    }
  }

  const rankings = Array.from(byMaterial.values());
  const byMonth = Array.from(monthMap.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, count, quantity }) => ({ label, count, quantity }));

  const mostWithdrawn =
    rankings.length > 0 ? rankings.reduce((a, b) => (b.quantity > a.quantity ? b : a)) : null;
  const leastWithdrawn =
    rankings.length > 0 ? rankings.reduce((a, b) => (b.quantity < a.quantity ? b : a)) : null;
  const highestCost = rankings.length > 0 ? rankings.reduce((a, b) => (b.cost > a.cost ? b : a)) : null;

  return {
    byWeekday: weekdayBuckets,
    byMonth,
    mostWithdrawn,
    leastWithdrawn,
    highestCost,
    totalWithdrawals: withdrawals.length,
    totalQuantity,
    totalCost,
  };
}
