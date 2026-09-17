"use client";

import { useMemo } from "react";
import { Material } from "@/lib/types";
import { getStockStatus } from "@/lib/types";
import { formatBRL, formatQuantity } from "@/lib/format";
import { CategoryTag } from "./CategoryTag";
import { StatusBadge } from "./StatusBadge";
import { StockBar } from "./StockBar";
import { MaterialSortKey } from "./SearchPanel";
import { IconArrowDownTray, IconCart, IconEdit, IconTrash, IconBox } from "./icons";

interface MaterialsTableProps {
  materials: Material[];
  search: string;
  category: string;
  sort: MaterialSortKey;
  onWithdraw: (material: Material) => void;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

export function MaterialsTable({
  materials,
  search,
  category,
  sort,
  onWithdraw,
  onEdit,
  onDelete,
}: MaterialsTableProps) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = materials.filter((m) => {
      const matchesTerm =
        !term ||
        m.name.toLowerCase().includes(term) ||
        (m.supplier ?? "").toLowerCase().includes(term) ||
        (m.location ?? "").toLowerCase().includes(term);
      const matchesCategory = !category || m.category === category;
      return matchesTerm && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      if (sort === "nome") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "estoque-asc") return a.quantity - b.quantity;
      return b.quantity - a.quantity;
    });

    return list;
  }, [materials, search, category, sort]);

  return (
    <div className="rounded-[14px] border border-border bg-surface">
      {filtered.length === 0 ? (
        <EmptyState hasMaterials={materials.length > 0} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium">Preço unitário</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((material) => {
                const status = getStockStatus(material.quantity, material.minQuantity);
                return (
                  <tr key={material.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{material.name}</p>
                      {material.location && <p className="text-xs text-muted">{material.location}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryTag category={material.category} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-sm tabular-nums text-ink">
                          {formatQuantity(material.quantity)} {material.unit}
                        </span>
                        <StockBar quantity={material.quantity} minQuantity={material.minQuantity} status={status} />
                        <StatusBadge status={status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-ink">{formatBRL(material.price)}</td>
                    <td className="px-4 py-3 text-muted">{material.supplier || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton label="Registrar retirada" onClick={() => onWithdraw(material)}>
                          <IconArrowDownTray className="h-4 w-4" />
                        </ActionButton>
                        {material.purchaseLink && (
                          <a
                            href={material.purchaseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Comprar novamente"
                            className="rounded-[8px] p-2 text-muted transition hover:bg-surface-2 hover:text-accent-strong"
                          >
                            <IconCart className="h-4 w-4" />
                          </a>
                        )}
                        <ActionButton label="Editar" onClick={() => onEdit(material)}>
                          <IconEdit className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton label="Excluir" onClick={() => onDelete(material)} danger>
                          <IconTrash className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-[8px] p-2 text-muted transition hover:bg-surface-2 ${
        danger ? "hover:text-critical" : "hover:text-accent-strong"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasMaterials }: { hasMaterials: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <IconBox className="h-6 w-6" />
      </div>
      <p className="font-medium text-ink">
        {hasMaterials ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
      </p>
      <p className="max-w-sm text-sm text-muted">
        {hasMaterials
          ? "Ajuste a busca ou o filtro de categoria para encontrar o que procura."
          : "Clique em “Novo material” para começar a cadastrar o estoque."}
      </p>
    </div>
  );
}
