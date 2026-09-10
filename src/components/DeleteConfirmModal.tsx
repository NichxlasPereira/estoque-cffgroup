"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Material } from "@/lib/types";
import { IconAlertTriangle } from "./icons";

interface DeleteConfirmModalProps {
  material: Material | null;
  onClose: () => void;
  onConfirm: (material: Material) => Promise<void>;
}

export function DeleteConfirmModal({ material, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!material) return;
    setSubmitting(true);
    try {
      await onConfirm(material);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!material}
      onClose={onClose}
      title="Excluir material"
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="danger" type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Excluindo..." : "Excluir material"}
          </Button>
        </>
      }
    >
      {material && (
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical">
            <IconAlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-sm text-ink">
            <p>
              Tem certeza que deseja excluir <strong>{material.name}</strong>?
            </p>
            <p className="mt-2 text-muted">
              O histórico de retiradas já registrado para este material será preservado, apenas o
              cadastro do material será removido.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
