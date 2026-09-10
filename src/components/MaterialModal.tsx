"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Material, CATEGORIAS_SUGERIDAS } from "@/lib/types";

export interface MaterialFormValues {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  minQuantity: string;
  location: string;
  supplier: string;
  price: string;
  purchaseLink: string;
}

const EMPTY_FORM: MaterialFormValues = {
  name: "",
  category: "",
  unit: "",
  quantity: "",
  minQuantity: "5",
  location: "",
  supplier: "",
  price: "",
  purchaseLink: "",
};

const UNIDADES_SUGERIDAS = ["unidade", "resma", "pacote", "frasco", "L", "caixa", "rolo", "kg"];

interface MaterialModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MaterialFormValues) => Promise<void>;
  material: Material | null;
  existingCategories: string[];
}

type FormErrors = Partial<Record<keyof MaterialFormValues, string>>;

export function MaterialModal({ open, onClose, onSubmit, material, existingCategories }: MaterialModalProps) {
  const [values, setValues] = useState<MaterialFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (material) {
      setValues({
        name: material.name,
        category: material.category,
        unit: material.unit,
        quantity: String(material.quantity),
        minQuantity: String(material.minQuantity),
        location: material.location ?? "",
        supplier: material.supplier ?? "",
        price: material.price !== null ? String(material.price) : "",
        purchaseLink: material.purchaseLink ?? "",
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  }, [open, material]);

  function set<K extends keyof MaterialFormValues>(key: K, value: MaterialFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!values.name.trim()) errs.name = "Informe o nome do material.";
    if (!values.category.trim()) errs.category = "Informe ou selecione uma categoria.";
    if (!values.unit.trim()) errs.unit = "Informe a unidade.";

    const quantity = Number(values.quantity);
    if (values.quantity.trim() === "" || Number.isNaN(quantity) || quantity < 0) {
      errs.quantity = "A quantidade deve ser um número maior ou igual a zero.";
    }

    if (values.minQuantity.trim() !== "") {
      const min = Number(values.minQuantity);
      if (Number.isNaN(min) || min < 0) {
        errs.minQuantity = "O estoque mínimo deve ser um número maior ou igual a zero.";
      }
    }

    if (values.price.trim() !== "") {
      const price = Number(values.price);
      if (Number.isNaN(price) || price < 0) {
        errs.price = "O preço deve ser um número maior ou igual a zero.";
      }
    }

    if (values.purchaseLink.trim() !== "" && !/^https?:\/\//i.test(values.purchaseLink.trim())) {
      errs.purchaseLink = "O link deve começar com http:// ou https://.";
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

  const categoryOptions = Array.from(new Set([...CATEGORIAS_SUGERIDAS, ...existingCategories]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={material ? "Editar material" : "Novo material"}
      maxWidthClassName="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="material-form" disabled={submitting}>
            {submitting ? "Salvando..." : material ? "Salvar alterações" : "Cadastrar material"}
          </Button>
        </>
      }
    >
      <form id="material-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome" error={errors.name} className="sm:col-span-2">
          <input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass(!!errors.name)}
            placeholder="Ex.: Papel A4"
          />
        </Field>

        <Field label="Categoria" error={errors.category}>
          <input
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputClass(!!errors.category)}
            placeholder="Selecione ou digite"
            list="categorias-sugeridas"
          />
          <datalist id="categorias-sugeridas">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Unidade" error={errors.unit}>
          <input
            value={values.unit}
            onChange={(e) => set("unit", e.target.value)}
            className={inputClass(!!errors.unit)}
            placeholder="Ex.: unidade, resma"
            list="unidades-sugeridas"
          />
          <datalist id="unidades-sugeridas">
            {UNIDADES_SUGERIDAS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>

        <Field label="Quantidade atual" error={errors.quantity}>
          <input
            type="number"
            min={0}
            step="any"
            value={values.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            className={inputClass(!!errors.quantity) + " font-mono tabular-nums"}
            placeholder="0"
          />
        </Field>

        <Field label="Estoque mínimo" error={errors.minQuantity}>
          <input
            type="number"
            min={0}
            step="any"
            value={values.minQuantity}
            onChange={(e) => set("minQuantity", e.target.value)}
            className={inputClass(!!errors.minQuantity) + " font-mono tabular-nums"}
            placeholder="5"
          />
        </Field>

        <Field label="Local (opcional)">
          <input
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass(false)}
            placeholder="Ex.: Almoxarifado - Prateleira A2"
          />
        </Field>

        <Field label="Fornecedor (opcional)">
          <input
            value={values.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            className={inputClass(false)}
            placeholder="Ex.: Kalunga"
          />
        </Field>

        <Field label="Preço unitário — R$ (opcional)" error={errors.price}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            className={inputClass(!!errors.price) + " font-mono tabular-nums"}
            placeholder="0,00"
          />
        </Field>

        <Field label="Link de compra (opcional)" error={errors.purchaseLink} className="sm:col-span-2">
          <input
            value={values.purchaseLink}
            onChange={(e) => set("purchaseLink", e.target.value)}
            className={inputClass(!!errors.purchaseLink)}
            placeholder="https://..."
          />
        </Field>
      </form>
    </Modal>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-[10px] border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none ${
    hasError ? "border-critical focus:border-critical" : "border-border focus:border-accent"
  }`;
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-ink">{label}</span>
      {children}
      {error && <span className="text-xs text-critical">{error}</span>}
    </label>
  );
}
