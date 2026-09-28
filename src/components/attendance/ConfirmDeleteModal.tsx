"use client";

import { useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { IconAlertTriangle } from "../icons";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  message: React.ReactNode;
  detail: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  open,
  title,
  confirmLabel,
  message,
  detail,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="danger" type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Excluindo..." : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical">
          <IconAlertTriangle className="h-5 w-5" />
        </div>
        <div className="text-sm text-ink">
          <p>{message}</p>
          <p className="mt-2 text-muted">{detail}</p>
        </div>
      </div>
    </Modal>
  );
}
