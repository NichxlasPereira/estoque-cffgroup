"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  function selectMode(next: ThemeMode) {
    setMode(next);
    setOpen(false);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — a preferência só vale para esta sessão
    }
  }

  const current = OPTIONS.find((o) => o.mode === mode) ?? OPTIONS[2];
  const CurrentIcon = current.icon;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Tema"
        aria-label="Escolher tema"
        aria-expanded={open}
        onClick={toggleOpen}
        className={`rounded-[10px] border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10 ${
          open ? "bg-white/15" : ""
        }`}
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: position.top, right: position.right }}
            className={`fixed z-50 flex origin-top-right flex-col gap-0.5 rounded-[10px] border border-white/15 bg-[#14152a] p-0.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-150 ease-out ${
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            }`}
          >
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
          </div>,
          document.body
        )}
    </>
  );
}
