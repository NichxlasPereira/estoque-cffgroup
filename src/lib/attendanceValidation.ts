import { OCCURRENCE_TYPES, OccurrenceType, isMultiDay } from "./attendance";

export interface EmployeeInput {
  name: string;
  department: string | null;
  role: string | null;
  active: boolean;
  folgaAllowance: number;
}

export function validateEmployeeInput(body: unknown): { data: EmployeeInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Dados inválidos." };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "O nome do colaborador é obrigatório." };

  const department = typeof b.department === "string" && b.department.trim() ? b.department.trim() : null;
  const role = typeof b.role === "string" && b.role.trim() ? b.role.trim() : null;
  const active = b.active === undefined ? true : b.active === true;

  const folgaAllowance =
    b.folgaAllowance === undefined || b.folgaAllowance === null || b.folgaAllowance === ("" as unknown)
      ? 0
      : Number(b.folgaAllowance);
  if (!Number.isInteger(folgaAllowance) || folgaAllowance < 0 || folgaAllowance > 365) {
    return { error: "O total de folgas deve ser um número inteiro entre 0 e 365." };
  }

  return { data: { name, department, role, active, folgaAllowance } };
}

export interface OccurrenceInput {
  employeeId: string;
  type: OccurrenceType;
  date: Date;
  endDate: Date;
  minutesLate: number | null;
  justified: boolean;
  approvedBy: string | null;
  notes: string | null;
}

function parseDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateOccurrenceInput(body: unknown): { data: OccurrenceInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Dados inválidos." };
  }
  const b = body as Record<string, unknown>;

  const employeeId = typeof b.employeeId === "string" ? b.employeeId : "";
  if (!employeeId) return { error: "Selecione um colaborador." };

  const type = b.type as OccurrenceType;
  if (!OCCURRENCE_TYPES.includes(type)) return { error: "Tipo de ocorrência inválido." };

  const date = parseDate(b.date);
  if (!date) return { error: "Informe uma data válida." };

  let endDate = date;
  if (isMultiDay(type)) {
    const parsedEnd = b.endDate ? parseDate(b.endDate) : date;
    if (!parsedEnd) return { error: "Informe uma data final válida." };
    if (parsedEnd.getTime() < date.getTime()) {
      return { error: `A data final ${type === "folga" ? "da folga" : "do atestado"} não pode ser anterior à data inicial.` };
    }
    endDate = parsedEnd;
  }

  let approvedBy: string | null = null;
  if (type === "folga") {
    approvedBy = typeof b.approvedBy === "string" ? b.approvedBy.trim() : "";
    if (!approvedBy) return { error: "Informe o gestor que concedeu a folga." };
  }

  let minutesLate: number | null = null;
  if (type === "atraso") {
    minutesLate = Number(b.minutesLate);
    if (!Number.isInteger(minutesLate) || minutesLate <= 0) {
      return { error: "Informe os minutos de atraso (número inteiro maior que zero)." };
    }
    if (minutesLate > 24 * 60) {
      return { error: "O atraso não pode passar de 24 horas." };
    }
  }

  const justified = isMultiDay(type) ? true : b.justified === true;
  const notes = typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : null;

  return { data: { employeeId, type, date, endDate, minutesLate, justified, approvedBy, notes } };
}
