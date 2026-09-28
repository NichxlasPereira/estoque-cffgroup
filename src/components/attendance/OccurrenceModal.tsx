"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import {
  Employee,
  OCCURRENCE_LABEL,
  OCCURRENCE_TYPES,
  Occurrence,
  OccurrenceType,
  occurrenceDays,
} from "@/lib/attendance";
import { todayInputValue } from "@/lib/format";
import { Field, inputClass } from "./formControls";

export interface OccurrenceFormValues {
  employeeId: string;
  type: OccurrenceType;
  date: string;
  endDate: string;
  minutesLate: string;
  justified: boolean;
  notes: string;
}

interface OccurrenceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: OccurrenceFormValues) => Promise<void>;
  employees: Employee[];
  occurrence: Occurrence | null;
  preselectedEmployee: Employee | null;
}

type FormErrors = Partial<Record<keyof OccurrenceFormValues, string>>;

const TYPE_HINT: Record<OccurrenceType, string> = {
  atraso: "Chegada após o horário. Informe quantos minutos.",
  falta: "Ausência no dia, com ou sem justificativa.",
  atestado: "Afastamento com atestado médico — pode cobrir vários dias.",
};

function toInputDate(iso: string): string {
  return iso.slice(0, 10);
}

export function OccurrenceModal({
  open,
  onClose,
  onSubmit,
  employees,
  occurrence,
  preselectedEmployee,
}: OccurrenceModalProps) {
  const [values, setValues] = useState<OccurrenceFormValues>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (occurrence) {
      setValues({
        employeeId: occurrence.employeeId ?? "",
        type: occurrence.type,
        date: toInputDate(occurrence.date),
        endDate: toInputDate(occurrence.endDate),
        minutesLate: occurrence.minutesLate !== null ? String(occurrence.minutesLate) : "",
        justified: occurrence.justified,
        notes: occurrence.notes ?? "",
      });
    } else {
      setValues({ ...emptyForm(), employeeId: preselectedEmployee?.id ?? "" });
    }
    setErrors({});
  }, [open, occurrence, preselectedEmployee]);

  // Só ativos, mas mantém o colaborador atual da ocorrência mesmo se estiver inativo.
  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.active || e.id === values.employeeId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [employees, values.employeeId]
  );

  function set<K extends keyof OccurrenceFormValues>(key: K, value: OccurrenceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!values.employeeId) errs.employeeId = "Selecione um colaborador.";
    if (!values.date) errs.date = "Informe a data.";
    if (values.type === "atraso") {
      const minutes = Number(values.minutesLate);
      if (!Number.isInteger(minutes) || minutes <= 0) {
        errs.minutesLate = "Informe os minutos de atraso (número inteiro maior que zero).";
      } else if (minutes > 24 * 60) {
        errs.minutesLate = "O atraso não pode passar de 24 horas.";
      }
    }
    if (values.type === "atestado") {
      if (!values.endDate) errs.endDate = "Informe o último dia do atestado.";
      else if (values.date && values.endDate < values.date) {
        errs.endDate = "A data final não pode ser anterior à data inicial.";
      }
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  const atestadoDays =
    values.type === "atestado" && values.date && values.endDate && values.endDate >= values.date
      ? occurrenceDays({ date: values.date, endDate: values.endDate })
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={occurrence ? "Editar ocorrência" : "Registrar ocorrência"}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="occurrence-form" disabled={submitting}>
            {submitting ? "Salvando..." : occurrence ? "Salvar alterações" : "Registrar ocorrência"}
          </Button>
        </>
      }
    >
      <form id="occurrence-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Colaborador" error={errors.employeeId}>
          <select
            value={values.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
            className={inputClass(!!errors.employeeId)}
          >
            <option value="">Selecione...</option>
            {employeeOptions.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
                {emp.department ? ` — ${emp.department}` : ""}
                {!emp.active ? " (inativo)" : ""}
              </option>
            ))}
          </select>
          {employees.length === 0 && (
            <span className="text-xs text-muted">Cadastre um colaborador antes de registrar ocorrências.</span>
          )}
        </Field>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Tipo</span>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {OCCURRENCE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={values.type === t}
                onClick={() => set("type", t)}
                className={`rounded-[10px] border px-3 py-2 text-sm font-semibold transition ${
                  values.type === t
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border bg-surface-2 text-muted hover:text-ink"
                }`}
              >
                {OCCURRENCE_LABEL[t]}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">{TYPE_HINT[values.type]}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={values.type === "atestado" ? "Primeiro dia" : "Data"} error={errors.date}>
            <input
              type="date"
              value={values.date}
              onChange={(e) => {
                const next = e.target.value;
                set("date", next);
                // Mantém o atestado com pelo menos um dia ao mover a data inicial para frente.
                if (next && values.endDate < next) set("endDate", next);
              }}
              className={inputClass(!!errors.date) + " font-mono"}
            />
          </Field>

          {values.type === "atestado" && (
            <Field
              label="Último dia"
              error={errors.endDate}
              hint={atestadoDays ? `${atestadoDays} ${atestadoDays === 1 ? "dia" : "dias"} de afastamento` : undefined}
            >
              <input
                type="date"
                value={values.endDate}
                min={values.date || undefined}
                onChange={(e) => set("endDate", e.target.value)}
                className={inputClass(!!errors.endDate) + " font-mono"}
              />
            </Field>
          )}

          {values.type === "atraso" && (
            <Field label="Minutos de atraso" error={errors.minutesLate}>
              <input
                type="number"
                min={1}
                step={1}
                value={values.minutesLate}
                onChange={(e) => set("minutesLate", e.target.value)}
                className={inputClass(!!errors.minutesLate) + " font-mono tabular-nums"}
                placeholder="Ex.: 15"
              />
            </Field>
          )}
        </div>

        {values.type !== "atestado" && (
          <label className="flex items-start gap-3 rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={values.justified}
              onChange={(e) => set("justified", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium text-ink">
                {values.type === "falta" ? "Falta justificada" : "Atraso justificado"}
              </span>
              <span className="block text-xs text-muted">
                Marque se houve justificativa aceita (ex.: declaração, combinado com o gestor).
              </span>
            </span>
          </label>
        )}

        <Field
          label="Observações (opcional)"
          hint={
            values.type === "atestado"
              ? "Evite registrar diagnóstico ou CID — são dados de saúde sensíveis (LGPD)."
              : undefined
          }
        >
          <textarea
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className={inputClass(false) + " resize-y"}
            placeholder={
              values.type === "atraso"
                ? "Ex.: trânsito, problema no transporte..."
                : values.type === "falta"
                  ? "Ex.: motivo informado pelo colaborador"
                  : "Ex.: atestado entregue ao RH em mãos"
            }
          />
        </Field>
      </form>
    </Modal>
  );
}

function emptyForm(): OccurrenceFormValues {
  const today = todayInputValue();
  return {
    employeeId: "",
    type: "atraso",
    date: today,
    endDate: today,
    minutesLate: "",
    justified: false,
    notes: "",
  };
}
