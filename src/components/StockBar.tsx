import { StockStatus } from "@/lib/types";

const barColor: Record<StockStatus, string> = {
  normal: "bg-ok",
  baixo: "bg-warn",
  esgotado: "bg-critical",
};

export function StockBar({
  quantity,
  minQuantity,
  status,
}: {
  quantity: number;
  minQuantity: number;
  status: StockStatus;
}) {
  const reference = minQuantity > 0 ? minQuantity * 2 : Math.max(quantity, 1);
  const pct = Math.max(0, Math.min(100, (quantity / reference) * 100));

  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
      <div
        className={`h-full rounded-full transition-all ${barColor[status]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
