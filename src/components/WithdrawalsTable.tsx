"use client";

import { useMemo } from "react";
import { Withdrawal } from "@/lib/types";
import { formatDateBR, formatQuantity } from "@/lib/format";
import { CategoryTag } from "./CategoryTag";
import { IconArrowDownTray } from "./icons";

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
  search: string;
}

export function WithdrawalsTable({ withdrawals, search }: WithdrawalsTableProps) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = !term
      ? withdrawals
      : withdrawals.filter(
          (w) =>
            w.materialName.toLowerCase().includes(term) || w.withdrawnBy.toLowerCase().includes(term)
        );
    return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [withdrawals, search]);

  return (
    <div className="rounded-[14px] border border-border bg-surface">
      {filtered.length === 0 ? (
        <EmptyState hasWithdrawals={withdrawals.length > 0} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Retirado por</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatDateBR(w.date)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{w.materialName}</td>
                  <td className="px-4 py-3">
                    <CategoryTag category={w.category} />
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">
                    {formatQuantity(w.quantity)} {w.unit}
                  </td>
                  <td className="px-4 py-3 text-muted">{w.withdrawnBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasWithdrawals }: { hasWithdrawals: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <IconArrowDownTray className="h-6 w-6" />
      </div>
      <p className="font-medium text-ink">
        {hasWithdrawals ? "Nenhuma retirada encontrada" : "Nenhuma retirada registrada"}
      </p>
      <p className="max-w-sm text-sm text-muted">
        {hasWithdrawals
          ? "Ajuste a busca para encontrar o que procura."
          : "As retiradas registradas aparecerão aqui."}
      </p>
    </div>
  );
}
