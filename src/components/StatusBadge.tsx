import { STATUS_LABEL, StockStatus } from "@/lib/types";

const styles: Record<StockStatus, { bg: string; dot: string; text: string }> = {
  normal: { bg: "bg-ok-soft", dot: "bg-ok", text: "text-ok" },
  baixo: { bg: "bg-warn-soft", dot: "bg-warn", text: "text-warn" },
  esgotado: { bg: "bg-critical-soft", dot: "bg-critical", text: "text-critical" },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
