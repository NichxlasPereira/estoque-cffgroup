"use client";

export type TabKey = "estoque" | "historico" | "relatorios";

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "estoque", label: "Estoque" },
  { key: "historico", label: "Histórico de retiradas" },
  { key: "relatorios", label: "Relatórios" },
];

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-[12px] border border-border bg-surface p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-[9px] px-4 py-2 text-sm font-semibold transition ${
            active === tab.key
              ? "bg-accent-soft text-accent-strong"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
