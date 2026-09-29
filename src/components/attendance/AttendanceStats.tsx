import { MonthTotals, formatMinutes, pluralDias } from "@/lib/attendance";
import { IconCalendarPlus, IconClock, IconMedical, IconUsers, IconUserX } from "../icons";

interface AttendanceStatsProps {
  activeEmployees: number;
  totals: MonthTotals;
  periodLabel: string;
}

export function AttendanceStats({ activeEmployees, totals, periodLabel }: AttendanceStatsProps) {
  const cards = [
    {
      label: "Colaboradores ativos",
      value: String(activeEmployees),
      detail: "no cadastro",
      icon: IconUsers,
      accent: "text-ok",
      iconBg: "bg-ok-soft",
    },
    {
      label: "Atrasos",
      value: String(totals.atrasos),
      detail: totals.minutesLate > 0 ? `${formatMinutes(totals.minutesLate)} no total` : periodLabel,
      icon: IconClock,
      accent: "text-warn",
      iconBg: "bg-warn-soft",
    },
    {
      label: "Faltas",
      value: String(totals.faltas),
      detail:
        totals.faltas > 0
          ? `${totals.faltasInjustificadas} não ${totals.faltasInjustificadas === 1 ? "justificada" : "justificadas"}`
          : periodLabel,
      icon: IconUserX,
      accent: "text-critical",
      iconBg: "bg-critical-soft",
    },
    {
      label: "Atestados",
      value: String(totals.atestados),
      detail:
        totals.diasAtestado > 0
          ? `${totals.diasAtestado} ${totals.diasAtestado === 1 ? "dia" : "dias"} de afastamento`
          : periodLabel,
      icon: IconMedical,
      accent: "text-accent-strong",
      iconBg: "bg-accent-soft",
    },
    {
      label: "Folgas",
      value: String(totals.folgas),
      detail: totals.diasFolga > 0 ? `${pluralDias(totals.diasFolga)} concedidos` : periodLabel,
      icon: IconCalendarPlus,
      accent: "text-ok",
      iconBg: "bg-ok-soft",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-[14px] border border-border bg-surface p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${card.iconBg}`}>
            <card.icon className={`h-5 w-5 ${card.accent}`} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{card.value}</p>
            <p className="text-sm text-ink">{card.label}</p>
            <p className="truncate text-xs text-muted">{card.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
