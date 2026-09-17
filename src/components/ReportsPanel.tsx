"use client";

import { useMemo } from "react";
import { Material, Withdrawal } from "@/lib/types";
import { buildReport, CountBucket, MaterialRanking } from "@/lib/reports";
import { formatBRL, formatQuantity } from "@/lib/format";
import { IconArrowDownTray, IconBox, IconInfo } from "./icons";
import { DonutChart } from "./DonutChart";

interface ReportsPanelProps {
  materials: Material[];
  withdrawals: Withdrawal[];
}

export function ReportsPanel({ materials, withdrawals }: ReportsPanelProps) {
  const report = useMemo(() => buildReport(materials, withdrawals), [materials, withdrawals]);

  if (report.totalWithdrawals === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-surface px-6 py-16 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <IconArrowDownTray className="h-6 w-6" />
        </div>
        <p className="font-medium text-ink">Nenhuma retirada registrada ainda</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Assim que houver retiradas, este relatório mostra o que mais saiu do estoque, o que gerou
          mais custo e a distribuição por dia da semana e por mês.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-muted">
        <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
        <p>
          Baseado em {report.totalWithdrawals} retiradas registradas ({formatQuantity(report.totalQuantity)}{" "}
          itens no total). O custo é estimado usando o preço unitário atual de cada material.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HighlightCard
          label="Mais retirado"
          ranking={report.mostWithdrawn}
          accent="ok"
          suffix="unidades"
        />
        <HighlightCard
          label="Menos retirado"
          ranking={report.leastWithdrawn}
          accent="warn"
          suffix="unidades"
        />
        <HighlightCard label="Maior custo gerado" ranking={report.highestCost} accent="critical" isCost />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Retiradas por dia da semana" buckets={report.byWeekday} />
        <BreakdownCard title="Retiradas por mês" buckets={report.byMonth} />
      </div>

      <p className="text-xs text-muted">
        As parcelas mostram a proporção de retiradas (número de registros) em cada categoria — os
        valores exatos estão sempre na legenda ao lado, já que ângulos próximos são difíceis de
        comparar a olho.
      </p>
    </div>
  );
}

function HighlightCard({
  label,
  ranking,
  accent,
  suffix,
  isCost,
}: {
  label: string;
  ranking: MaterialRanking | null;
  accent: "ok" | "warn" | "critical";
  suffix?: string;
  isCost?: boolean;
}) {
  const styles: Record<typeof accent, { bg: string; text: string }> = {
    ok: { bg: "bg-ok-soft", text: "text-ok" },
    warn: { bg: "bg-warn-soft", text: "text-warn" },
    critical: { bg: "bg-critical-soft", text: "text-critical" },
  };
  const { bg: iconBg, text: iconColor } = styles[accent];

  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-border bg-surface p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${iconBg}`}>
        <IconBox className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        {ranking ? (
          <>
            <p className="truncate font-serif text-lg font-semibold text-ink">{ranking.name}</p>
            <p className="font-mono text-sm tabular-nums text-muted">
              {isCost ? formatBRL(ranking.cost) : `${formatQuantity(ranking.quantity)} ${suffix ?? ""}`}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">—</p>
        )}
      </div>
    </div>
  );
}

function BreakdownCard({ title, buckets }: { title: string; buckets: CountBucket[] }) {
  const hasData = buckets.some((b) => b.count > 0);

  return (
    <div className="rounded-[14px] border border-border bg-surface p-5">
      <h3 className="mb-4 font-serif text-lg font-semibold text-ink">{title}</h3>
      {!hasData ? (
        <p className="text-sm text-muted">Sem dados suficientes.</p>
      ) : (
        <DonutChart
          data={buckets.map((b) => ({ label: b.label, value: b.count }))}
          centerCaption="retiradas"
        />
      )}
    </div>
  );
}
