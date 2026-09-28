"use client";

export type TabKey = "estoque" | "historico" | "relatorios";

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (tab: K) => void;
}

export const STOCK_TABS: TabItem<TabKey>[] = [
  { key: "estoque", label: "estoque" },
  { key: "historico", label: "histórico" },
  { key: "relatorios", label: "relatórios" },
];

export function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-border sm:gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`-mb-px shrink-0 border-b-2 pb-3 text-sm transition ${
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
