"use client";

import { IconArrowDownTray, IconPlus } from "./icons";
import { Button } from "./Button";

interface HeaderProps {
  onNewMaterial: () => void;
  onNewWithdrawal: () => void;
}

export function Header({ onNewMaterial, onNewWithdrawal }: HeaderProps) {
  return (
    <header
      className="relative overflow-hidden rounded-b-[28px]"
      style={{
        background:
          "linear-gradient(135deg, #171a3a 0%, #12122b 45%, #08080f 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-80 w-80 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(124,92,240,0.55) 0%, rgba(124,92,240,0) 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-[-5%] h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(183,166,251,0.35) 0%, rgba(183,166,251,0) 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "140px 140px, 90px 90px",
          backgroundPosition: "0 0, 45px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] shadow-[0_8px_20px_rgba(124,92,240,0.5)]"
            style={{
              background: "linear-gradient(135deg, #9b7bfb 0%, #6d4bde 100%)",
            }}
          >
            <span className="font-serif text-lg font-semibold text-white">C</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Estoque CFFGROUP</h1>
            <p className="text-sm text-muted">Controle de materiais de escritório</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
