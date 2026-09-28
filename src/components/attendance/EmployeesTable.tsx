"use client";

import { Employee, EmployeeSummary, formatMinutes } from "@/lib/attendance";
import { IconCalendarPlus, IconEdit, IconTrash, IconUsers } from "../icons";
import { ActionButton, EmptyState } from "./formControls";

interface EmployeesTableProps {
  employees: Employee[];
  hasAny: boolean;
  summaries: Map<string, EmployeeSummary>;
  periodLabel: string;
  onRegister: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeesTable({
  employees,
  hasAny,
  summaries,
  periodLabel,
  onRegister,
  onEdit,
  onDelete,
}: EmployeesTableProps) {
  return (
    <div className="rounded-[14px] border border-border bg-surface">
      {employees.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-6 w-6" />}
          title={hasAny ? "Nenhum colaborador encontrado" : "Nenhum colaborador cadastrado"}
          text={
            hasAny
              ? "Ajuste a busca ou o filtro de setor."
              : "Clique em “Novo colaborador” para montar a lista da equipe."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Colaborador</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Atrasos</th>
                <th className="px-4 py-3 font-medium">Faltas</th>
                <th className="px-4 py-3 font-medium">Atestados</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const s = summaries.get(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className={`border-b border-border last:border-0 hover:bg-surface-2/40 ${emp.active ? "" : "opacity-60"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">
                        {emp.name}
                        {!emp.active && (
                          <span className="ml-2 rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium text-muted">
                            inativo
                          </span>
                        )}
                      </p>
                      {emp.role && <p className="text-xs text-muted">{emp.role}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{emp.department || "—"}</td>
                    <td className="px-4 py-3">
                      <Count value={s?.atrasos ?? 0} tone="warn" />
                      {s && s.minutesLate > 0 && (
                        <span className="block text-xs text-muted">{formatMinutes(s.minutesLate)} no total</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Count value={s?.faltas ?? 0} tone="critical" />
                      {s && s.faltasInjustificadas > 0 && (
                        <span className="block text-xs text-muted">
                          {s.faltasInjustificadas} não {s.faltasInjustificadas === 1 ? "justificada" : "justificadas"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Count value={s?.atestados ?? 0} tone="accent" />
                      {s && s.diasAtestado > 0 && (
                        <span className="block text-xs text-muted">
                          {s.diasAtestado} {s.diasAtestado === 1 ? "dia" : "dias"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {emp.active && (
                          <ActionButton label="Registrar ocorrência" onClick={() => onRegister(emp)}>
                            <IconCalendarPlus className="h-4 w-4" />
                          </ActionButton>
                        )}
                        <ActionButton label="Editar" onClick={() => onEdit(emp)}>
                          <IconEdit className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton label="Excluir" onClick={() => onDelete(emp)} danger>
                          <IconTrash className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-2.5 text-xs text-muted">Contagens referentes a {periodLabel}.</p>
        </div>
      )}
    </div>
  );
}

function Count({ value, tone }: { value: number; tone: "warn" | "critical" | "accent" }) {
  const color = value === 0 ? "text-muted" : tone === "warn" ? "text-warn" : tone === "critical" ? "text-critical" : "text-accent-strong";
  return <span className={`font-mono text-base font-semibold tabular-nums ${color}`}>{value}</span>;
}
