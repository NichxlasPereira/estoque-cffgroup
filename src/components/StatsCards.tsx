import { IconAlertTriangle, IconArrowDownTray, IconBox } from "./icons";

interface StatsCardsProps {
  total: number;
  lowStock: number;
  outOfStock: number;
  withdrawalsLast7Days: number;
}

export function StatsCards({ total, lowStock, outOfStock, withdrawalsLast7Days }: StatsCardsProps) {
  const cards = [
    {
      label: "Materiais cadastrados",
      value: total,
      icon: IconBox,
      accent: "text-accent-strong",
      iconBg: "bg-accent-soft",
    },
    {
      label: "Estoque baixo",
      value: lowStock,
      icon: IconAlertTriangle,
      accent: "text-warn",
      iconBg: "bg-warn-soft",
    },
    {
      label: "Esgotados",
      value: outOfStock,
      icon: IconAlertTriangle,
      accent: "text-critical",
      iconBg: "bg-critical-soft",
    },
    {
      label: "Retiradas (7 dias)",
      value: withdrawalsLast7Days,
      icon: IconArrowDownTray,
      accent: "text-ok",
      iconBg: "bg-ok-soft",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${card.iconBg}`}>
            <card.icon className={`h-5 w-5 ${card.accent}`} />
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{card.value}</p>
            <p className="text-sm text-muted">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
