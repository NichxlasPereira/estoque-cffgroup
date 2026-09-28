export type OccurrenceType = "atraso" | "falta" | "atestado";

export const OCCURRENCE_TYPES: OccurrenceType[] = ["atraso", "falta", "atestado"];

export const OCCURRENCE_LABEL: Record<OccurrenceType, string> = {
  atraso: "Atraso",
  falta: "Falta",
  atestado: "Atestado",
};

export const DEPARTAMENTOS_SUGERIDOS = [
  "Administrativo",
  "Financeiro",
  "Comercial",
  "Operações",
  "RH",
  "TI",
  "Logística",
] as const;

export interface Employee {
  id: string;
  name: string;
  department: string | null;
  role: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Occurrence {
  id: string;
  employeeId: string | null;
  employeeName: string;
  employeeDepartment: string | null;
  type: OccurrenceType;
  date: string;
  endDate: string;
  minutesLate: number | null;
  justified: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias corridos cobertos pela ocorrência (inclusivo). Atraso e falta contam 1. */
export function occurrenceDays(o: Pick<Occurrence, "date" | "endDate">): number {
  const start = new Date(o.date).getTime();
  const end = new Date(o.endDate).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

/** "YYYY-MM" em UTC — as datas são gravadas como meia-noite UTC. */
export function monthKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function monthKeyLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

/** Dias de `o` que caem dentro do mês `key` — um atestado pode atravessar meses. */
export function daysInMonth(o: Pick<Occurrence, "date" | "endDate">, key: string): number {
  const [year, month] = key.split("-").map(Number);
  const monthStart = Date.UTC(year, month - 1, 1);
  const monthEnd = Date.UTC(year, month, 0);
  const start = Math.max(new Date(o.date).getTime(), monthStart);
  const end = Math.min(new Date(o.endDate).getTime(), monthEnd);
  if (end < start) return 0;
  return Math.round((end - start) / DAY_MS) + 1;
}

export function overlapsMonth(o: Pick<Occurrence, "date" | "endDate">, key: string): boolean {
  return daysInMonth(o, key) > 0;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export interface EmployeeSummary {
  key: string;
  employeeId: string | null;
  name: string;
  department: string | null;
  atrasos: number;
  minutesLate: number;
  faltas: number;
  faltasInjustificadas: number;
  atestados: number;
  diasAtestado: number;
}

/** Totais por colaborador. Com `month`, considera só o que cai naquele mês. */
export function summarizeByEmployee(occurrences: Occurrence[], month?: string): EmployeeSummary[] {
  const map = new Map<string, EmployeeSummary>();

  for (const o of occurrences) {
    if (month && !overlapsMonth(o, month)) continue;
    const key = o.employeeId ?? `__deleted__:${o.employeeName}`;
    let s = map.get(key);
    if (!s) {
      s = {
        key,
        employeeId: o.employeeId,
        name: o.employeeName,
        department: o.employeeDepartment,
        atrasos: 0,
        minutesLate: 0,
        faltas: 0,
        faltasInjustificadas: 0,
        atestados: 0,
        diasAtestado: 0,
      };
      map.set(key, s);
    }
    if (o.type === "atraso") {
      s.atrasos += 1;
      s.minutesLate += o.minutesLate ?? 0;
    } else if (o.type === "falta") {
      s.faltas += 1;
      if (!o.justified) s.faltasInjustificadas += 1;
    } else {
      s.atestados += 1;
      s.diasAtestado += month ? daysInMonth(o, month) : occurrenceDays(o);
    }
  }

  return Array.from(map.values());
}

export interface MonthTotals {
  atrasos: number;
  minutesLate: number;
  faltas: number;
  faltasInjustificadas: number;
  atestados: number;
  diasAtestado: number;
}

export function monthTotals(occurrences: Occurrence[], month: string): MonthTotals {
  const totals: MonthTotals = {
    atrasos: 0,
    minutesLate: 0,
    faltas: 0,
    faltasInjustificadas: 0,
    atestados: 0,
    diasAtestado: 0,
  };
  for (const s of summarizeByEmployee(occurrences, month)) {
    totals.atrasos += s.atrasos;
    totals.minutesLate += s.minutesLate;
    totals.faltas += s.faltas;
    totals.faltasInjustificadas += s.faltasInjustificadas;
    totals.atestados += s.atestados;
    totals.diasAtestado += s.diasAtestado;
  }
  return totals;
}

/** Meses (YYYY-MM) com alguma ocorrência, mais o mês atual, do mais recente ao mais antigo. */
export function availableMonths(occurrences: Occurrence[]): string[] {
  const set = new Set<string>([currentMonthKey()]);
  for (const o of occurrences) {
    const start = new Date(o.date);
    const end = new Date(o.endDate);
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor.getTime() <= end.getTime()) {
      set.add(monthKey(cursor));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  return Array.from(set).sort().reverse();
}
