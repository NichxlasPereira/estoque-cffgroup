"use client";

export type TabKey = "estoque" | "historico" | "relatorios";

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "estoque", label: "estoque" },
  { key: "historico", label: "histórico" },
  { key: "relatorios", label: "relatórios" },
];

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex gap-6 border-b border-border sm:gap-8">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`-mb-px border-b-2 pb-3 text-sm transition ${
            active === tab.key
              ? "border-ink font-bold text-ink"
              : "border-transparent font-medium text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
