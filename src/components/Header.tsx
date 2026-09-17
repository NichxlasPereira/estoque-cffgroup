"use client";

import { IconArrowDownTray, IconPlus } from "./icons";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { DoodleScribble } from "./DoodleScribble";

interface HeaderProps {
  onNewMaterial: () => void;
  onNewWithdrawal: () => void;
}

export function Header({ onNewMaterial, onNewWithdrawal }: HeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-surface">
      <DoodleScribble className="pointer-events-none absolute -left-2 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-border-strong sm:block" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:pl-16">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] shadow-[0_8px_20px_rgba(124,92,240,0.35)]"
            style={{
              background: "linear-gradient(135deg, #9b7bfb 0%, #6d4bde 100%)",
            }}
          >
            <span className="font-display text-lg font-bold text-white">C</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Estoque CFFGROUP
            </h1>
            <p className="text-sm text-muted">Controle de materiais de escritório</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={onNewMaterial}>
            <IconPlus className="h-4 w-4" />
            Novo material
          </Button>
          <Button variant="primary" onClick={onNewWithdrawal}>
            <IconArrowDownTray className="h-4 w-4" />
            Registrar retirada
          </Button>
        </div>
      </div>
    </header>
  );
}
