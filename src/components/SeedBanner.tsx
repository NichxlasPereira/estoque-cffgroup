"use client";

import { useEffect, useState } from "react";
import { IconInfo, IconX } from "./icons";

const STORAGE_KEY = "estoque-cffgroup:seed-banner-dismissed";

export function SeedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignora indisponibilidade de localStorage
    }
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-border-strong bg-accent-soft px-4 py-3 text-sm text-accent-strong">
      <IconInfo className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">
        Este ambiente foi populado com materiais e retiradas de <strong>exemplo</strong> para você
        conhecer o sistema. Sinta-se livre para editar ou excluir esses dados.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar aviso"
        className="shrink-0 rounded-full p-1 text-accent-strong/80 transition hover:bg-white/10 hover:text-accent-strong"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}
