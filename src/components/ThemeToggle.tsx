"use client";

import { useEffect, useState } from "react";
import { IconAuto, IconMoon, IconSun } from "./icons";
import {
  applyResolvedTheme,
  readStoredThemeMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  ThemeMode,
} from "@/lib/theme";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { mode: "light", label: "Modo claro", icon: IconSun },
  { mode: "dark", label: "Modo escuro", icon: IconMoon },
  { mode: "auto", label: "Automático (conforme o horário)", icon: IconAuto },
];

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    setMode(readStoredThemeMode());
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolveTheme(mode));

    if (mode !== "auto") return;

    const interval = setInterval(() => {
      applyResolvedTheme(resolveTheme("auto"));
    }, 60_000);

    return () => clearInterval(interval);
  }, [mode]);

  function selectMode(next: ThemeMode) {
    setMode(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — a preferência só vale para esta sessão
    }
  }

  return (
    <div className="flex gap-0.5 rounded-[10px] border border-white/15 bg-white/5 p-0.5">
      {OPTIONS.map(({ mode: optionMode, label, icon: Icon }) => (
        <button
          key={optionMode}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mode === optionMode}
          onClick={() => selectMode(optionMode)}
          className={`rounded-[8px] p-2 transition ${
            mode === optionMode
              ? "bg-white/15 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
