"use client";

import { OCCURRENCE_LABEL, OCCURRENCE_TYPES, OccurrenceType, monthKeyLabel } from "@/lib/attendance";
import { IconSearch } from "../icons";

export type AttendanceTabKey = "ocorrencias" | "colaboradores" | "relatorios" | "admissoes" | "acessos";

export const ALL_MONTHS = "todos";

interface AttendanceFiltersProps {
  tab: AttendanceTabKey;
  months: string[];
  month: string;
  onMonthChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  type: OccurrenceType | "";
  onTypeChange: (value: OccurrenceType | "") => void;
  departments: string[];
  department: string;
  onDepartmentChange: (value: string) => void;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  onExport: () => void;
  exportDisabled: boolean;
}

const selectClass =
  "w-full rounded-[10px] border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none";

export function AttendanceFilters(props: AttendanceFiltersProps) {
  const { tab } = props;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[14px] border border-border bg-surface p-4 lg:w-64">
      <h2 className="font-display text-base font-semibold text-ink">Filtrar</h2>

      <Field label="Mês">
        <select value={props.month} onChange={(e) => props.onMonthChange(e.target.value)} className={selectClass}>
          {tab !== "relatorios" && <option value={ALL_MONTHS}>Todo o período</option>}
          {props.months.map((m) => (
            <option key={m} value={m}>
              {monthKeyLabel(m)}
            </option>
          ))}
        </select>
      </Field>

      {tab !== "relatorios" && (
        <Field label="Buscar">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={props.search}
              onChange={(e) => props.onSearchChange(e.target.value)}
              placeholder={tab === "ocorrencias" ? "Colaborador ou observação" : "Nome ou cargo"}
              className="w-full rounded-[10px] border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </Field>
      )}

      {tab === "ocorrencias" && (
        <Field label="Tipo">
          <select
            value={props.type}
            onChange={(e) => props.onTypeChange(e.target.value as OccurrenceType | "")}
            className={selectClass}
          >
            <option value="">Todos os tipos</option>
            {OCCURRENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {OCCURRENCE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Setor">
        <select
          value={props.department}
          onChange={(e) => props.onDepartmentChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os setores</option>
          {props.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      {tab === "colaboradores" && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={props.showInactive}
            onChange={(e) => props.onShowInactiveChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Mostrar inativos
        </label>
      )}

      {tab === "ocorrencias" && (
        <button
          type="button"
          onClick={props.onExport}
          disabled={props.exportDisabled}
          className="rounded-full border border-border-strong px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          Exportar CSV
        </button>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
