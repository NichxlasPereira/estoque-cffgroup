"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Material } from "@/lib/types";
import { formatQuantity, todayInputValue } from "@/lib/format";

export interface WithdrawalFormValues {
  materialId: string;
  quantity: string;
  date: string;
  withdrawnBy: string;
}

interface WithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: WithdrawalFormValues) => Promise<string | void>;
  materials: Material[];
  preselectedMaterial: Material | null;
}

type FormErrors = Partial<Record<keyof WithdrawalFormValues, string>>;

export function WithdrawalModal({
  open,
  onClose,
  onSubmit,
  materials,
  preselectedMaterial,
}: WithdrawalModalProps) {
  const [materialId, setMaterialId] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [withdrawnBy, setWithdrawnBy] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuantity("");
    setDate(todayInputValue());
    setWithdrawnBy("");
    setErrors({});
    setDropdownOpen(false);
    if (preselectedMaterial) {
      setMaterialId(preselectedMaterial.id);
      setSearch(preselectedMaterial.name);
    } else {
      setMaterialId("");
      setSearch("");
    }
  }, [open, preselectedMaterial]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId) ?? null,
    [materials, materialId]
  );

  const filteredMaterials = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = !term ? materials : materials.filter((m) => m.name.toLowerCase().includes(term));
    return list.slice(0, 50);
  }, [materials, search]);

  function selectMaterial(material: Material) {
    setMaterialId(material.id);
    setSearch(material.name);
    setDropdownOpen(false);
    setErrors((e) => ({ ...e, materialId: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!materialId) errs.materialId = "Selecione um material.";

    const qty = Number(quantity);
    if (quantity.trim() === "" || Number.isNaN(qty) || qty <= 0) {
      errs.quantity = "A quantidade deve ser maior que zero.";
    } else if (selectedMaterial && qty > selectedMaterial.quantity) {
      errs.quantity = `Estoque insuficiente. Disponível: ${formatQuantity(selectedMaterial.quantity)} ${selectedMaterial.unit}.`;
    }

    if (!date) errs.date = "Informe a data da retirada.";
    if (!withdrawnBy.trim()) errs.withdrawnBy = "Informe o nome de quem retirou.";

    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const serverError = await onSubmit({ materialId, quantity, date, withdrawnBy });
      if (serverError) {
        setErrors((prev) => ({ ...prev, quantity: serverError }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar retirada"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="withdrawal-form" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar retirada"}
          </Button>
        </>
      }
    >
      <form id="withdrawal-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm" ref={comboRef}>
          <span className="font-medium text-ink">Material</span>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setMaterialId("");
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Buscar material..."
              className={`w-full rounded-[10px] border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none ${
                errors.materialId ? "border-critical focus:border-critical" : "border-border focus:border-accent"
              }`}
            />
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-border bg-surface-2 shadow-lg">
                {filteredMaterials.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted">Nenhum material encontrado.</p>
                ) : (
                  filteredMaterials.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMaterial(m)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                    >
                      <span>{m.name}</span>
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {formatQuantity(m.quantity)} {m.unit}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.materialId && <span className="text-xs text-critical">{errors.materialId}</span>}
          {selectedMaterial && (
            <p className="text-xs text-muted">
              Estoque atual:{" "}
              <span className="font-mono tabular-nums text-ink">
                {formatQuantity(selectedMaterial.quantity)} {selectedMaterial.unit}
              </span>
              {selectedMaterial.location && <> · Local: {selectedMaterial.location}</>}
            </p>
          )}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Quantidade retirada</span>
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`w-full rounded-[10px] border bg-surface-2 px-3 py-2 text-sm text-ink font-mono tabular-nums focus:outline-none ${
              errors.quantity ? "border-critical focus:border-critical" : "border-border focus:border-accent"
            }`}
            placeholder="0"
          />
          {errors.quantity && <span className="text-xs text-critical">{errors.quantity}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full rounded-[10px] border bg-surface-2 px-3 py-2 text-sm text-ink font-mono focus:outline-none ${
              errors.date ? "border-critical focus:border-critical" : "border-border focus:border-accent"
            }`}
          />
          {errors.date && <span className="text-xs text-critical">{errors.date}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Retirado por</span>
          <input
            value={withdrawnBy}
            onChange={(e) => setWithdrawnBy(e.target.value)}
            className={`w-full rounded-[10px] border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none ${
              errors.withdrawnBy ? "border-critical focus:border-critical" : "border-border focus:border-accent"
            }`}
            placeholder="Nome de quem retirou"
          />
          {errors.withdrawnBy && <span className="text-xs text-critical">{errors.withdrawnBy}</span>}
        </label>
      </form>
    </Modal>
  );
}
