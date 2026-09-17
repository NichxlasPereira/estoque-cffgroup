"use client";

import Image from "next/image";
import { IconArrowDownTray, IconPlus } from "./icons";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { DoodleScribble } from "./DoodleScribble";
import { Tabs, TabKey } from "./Tabs";

interface HeaderProps {
  tab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onNewMaterial: () => void;
  onNewWithdrawal: () => void;
}

export function Header({ tab, onChangeTab, onNewMaterial, onNewWithdrawal }: HeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-surface">
      <Image
        src="/hero-office.jpg"
        alt="Equipe CFFGROUP em reunião estratégica"
        fill
        sizes="100vw"
        className="object-cover opacity-30"
        priority
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-6 sm:px-10 sm:py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: "linear-gradient(135deg, #9b7bfb 0%, #6d4bde 100%)" }}
            >
              <span className="font-display text-sm font-bold text-white">C</span>
            </div>
            <span className="font-display text-sm font-bold tracking-tight text-ink">
              estoque cffgroup
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={onNewMaterial} className="!px-4 !py-2 text-xs">
              <IconPlus className="h-3.5 w-3.5" />
              Novo material
            </Button>
            <Button variant="dark" onClick={onNewWithdrawal} className="!px-4 !py-2 text-xs">
              <IconArrowDownTray className="h-3.5 w-3.5" />
              registrar retirada
            </Button>
          </div>
        </div>

        <Tabs active={tab} onChange={onChangeTab} />

        <div className="relative flex flex-col gap-6 py-4">
          <DoodleScribble className="pointer-events-none absolute -left-6 -top-10 h-20 w-20 text-accent/50 sm:h-24 sm:w-24" />

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            controle que
            <br />
            não deixa nada
            <br />
            faltar —
          </h1>

          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Cadastre materiais, registre retiradas e acompanhe o estoque da CFFGROUP em um só
            lugar, sempre atualizado para toda a equipe.
          </p>
        </div>
      </div>
    </header>
  );
}
