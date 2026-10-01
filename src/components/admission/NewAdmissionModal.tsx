"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { IconPlus, IconX } from "../icons";
import { Field, inputClass } from "../attendance/formControls";
import { ChecklistItem, DEFAULT_CHECKLIST } from "@/lib/admission";

export interface NewAdmissionValues {
  candidateName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  startDate: string;
  notes: string;
  documents: ChecklistItem[];
}

interface NewAdmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: NewAdmissionValues) => Promise<void>;
  departments: string[];
}

interface ChecklistRow extends ChecklistItem {
  included: boolean;
}

const initialChecklist = (): ChecklistRow[] => DEFAULT_CHECKLIST.map((item) => ({ ...item, included: true }));

export function NewAdmissionModal({ open, onClose, onSubmit, departments }: NewAdmissionModalProps) {
  const [values, setValues] = useState({ candidateName: "", email: "", phone: "", role: "", department: "", startDate: "", notes: "" });
  const [checklist, setChecklist] = useState<ChecklistRow[]>(initialChecklist);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ candidateName: "", email: "", phone: "", role: "", department: "", startDate: "", notes: "" });
    setChecklist(initialChecklist());
    setCustom("");
    setError(undefined);
  }, [open]);

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setError(undefined);
  }

  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    setChecklist((list) => [...list, { name, required: true, included: true }]);
    setCustom("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.candidateName.trim()) {
      setError("Informe o nome do candidato.");
      return;
    }
    const documents = checklist.filter((c) => c.included).map(({ name, description, required }) => ({ name, description, required }));
    if (documents.length === 0) {
      setError("Inclua pelo menos um documento.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ ...values, documents });
    } finally {
      setSubmitting(false);
    }
  }

  const included = checklist.filter((c) => c.included).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova admissão"
      maxWidthClassName="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="new-admission-form" disabled={submitting}>
            {submitting ? "Criando..." : "Criar e gerar link"}
          </Button>
        </>
      }
    >
      <form id="new-admission-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do candidato" className="sm:col-span-2">
            <input
              value={values.candidateName}
              onChange={(e) => set("candidateName", e.target.value)}
              className={inputClass(!!error && !values.candidateName.trim())}
              placeholder="Nome completo"
              autoFocus
            />
          </Field>
          <Field label="E-mail (opcional)">
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} className={inputClass(false)} />
          </Field>
          <Field label="Telefone / WhatsApp (opcional)">
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass(false)}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="Cargo (opcional)">
            <input value={values.role} onChange={(e) => set("role", e.target.value)} className={inputClass(false)} />
          </Field>
          <Field label="Setor (opcional)">
            <input
              value={values.department}
              onChange={(e) => set("department", e.target.value)}
              className={inputClass(false)}
              list="admission-departments"
            />
            <datalist id="admission-departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Início previsto (opcional)">
            <input
              type="date"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className={inputClass(false) + " font-mono"}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-ink">Documentos pedidos</span>
            <span className="text-xs text-muted">{included} selecionados</span>
          </div>
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-[10px] border border-border bg-surface-2 p-2">
            {checklist.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm hover:bg-surface">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={(e) =>
                    setChecklist((list) => list.map((c, j) => (j === i ? { ...c, included: e.target.checked } : c)))
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                  aria-label={`Pedir ${item.name}`}
                />
                <span className={`min-w-0 flex-1 truncate ${item.included ? "text-ink" : "text-muted line-through"}`}>
                  {item.name}
                </span>
                <button
                  type="button"
                  disabled={!item.included}
                  onClick={() => setChecklist((list) => list.map((c, j) => (j === i ? { ...c, required: !c.required } : c)))}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-40 ${
                    item.required ? "bg-accent-soft text-accent-strong" : "border border-border-strong text-muted"
                  }`}
                  title="Alternar obrigatório/opcional"
                >
                  {item.required ? "obrigatório" : "opcional"}
                </button>
                {i >= DEFAULT_CHECKLIST.length && (
                  <button
                    type="button"
                    onClick={() => setChecklist((list) => list.filter((_, j) => j !== i))}
                    aria-label={`Remover ${item.name}`}
                    className="shrink-0 rounded-full p-1 text-muted hover:text-critical"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Outro documento (ex.: Registro no conselho profissional)"
              className={inputClass(false)}
            />
            <Button type="button" variant="ghost" onClick={addCustom} className="!px-3 shrink-0">
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Field label="Observações internas (opcional)" hint="Só o RH vê.">
          <textarea
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className={inputClass(false) + " resize-y"}
          />
        </Field>

        {error && <span className="text-xs text-critical">{error}</span>}
      </form>
    </Modal>
  );
}
