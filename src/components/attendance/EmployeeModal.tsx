"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { DEPARTAMENTOS_SUGERIDOS, Employee } from "@/lib/attendance";
import { Field, inputClass } from "./formControls";

export interface EmployeeFormValues {
  name: string;
  department: string;
  role: string;
  active: boolean;
}

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  employee: Employee | null;
  existingDepartments: string[];
}

export function EmployeeModal({ open, onClose, onSubmit, employee, existingDepartments }: EmployeeModalProps) {
  const [values, setValues] = useState<EmployeeFormValues>({ name: "", department: "", role: "", active: true });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      employee
        ? {
            name: employee.name,
            department: employee.department ?? "",
            role: employee.role ?? "",
            active: employee.active,
          }
        : { name: "", department: "", role: "", active: true }
    );
    setError(undefined);
  }, [open, employee]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Informe o nome do colaborador.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  const departmentOptions = Array.from(new Set([...DEPARTAMENTOS_SUGERIDOS, ...existingDepartments]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "Editar colaborador" : "Novo colaborador"}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" disabled={submitting}>
            {submitting ? "Salvando..." : employee ? "Salvar alterações" : "Cadastrar colaborador"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome" error={error} className="sm:col-span-2">
          <input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={inputClass(!!error)}
            placeholder="Nome completo"
            autoFocus
          />
        </Field>

        <Field label="Setor (opcional)">
          <input
            value={values.department}
            onChange={(e) => setValues((v) => ({ ...v, department: e.target.value }))}
            className={inputClass(false)}
            placeholder="Selecione ou digite"
            list="departamentos-sugeridos"
          />
          <datalist id="departamentos-sugeridos">
            {departmentOptions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>

        <Field label="Cargo (opcional)">
          <input
            value={values.role}
            onChange={(e) => setValues((v) => ({ ...v, role: e.target.value }))}
            className={inputClass(false)}
            placeholder="Ex.: Analista"
          />
        </Field>

        {employee && (
          <label className="flex items-start gap-3 rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium text-ink">Colaborador ativo</span>
              <span className="block text-xs text-muted">
                Desative quem saiu da empresa: o histórico é mantido, mas o nome deixa de aparecer ao
                registrar novas ocorrências.
              </span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  );
}
