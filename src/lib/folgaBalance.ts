import { Prisma } from "@prisma/client";
import { folgaDaysUsed, occurrenceDays, pluralDias } from "./attendance";
import { OccurrenceInput } from "./attendanceValidation";

type Tx = Prisma.TransactionClient;

/**
 * Confere se a folga cabe no saldo do colaborador. Retorna a mensagem de erro,
 * ou null se couber. Roda dentro da transação que grava a ocorrência, para que
 * dois lançamentos simultâneos não estourem o saldo juntos.
 */
export async function checkFolgaBalance(
  tx: Tx,
  input: OccurrenceInput,
  folgaAllowance: number,
  excludeId?: string
): Promise<string | null> {
  if (input.type !== "folga") return null;
  const existing = await tx.attendanceOccurrence.findMany({
    where: { employeeId: input.employeeId, type: "folga" },
    select: { id: true, employeeId: true, type: true, date: true, endDate: true },
  });
  const used = folgaDaysUsed(
    existing.map((o) => ({ ...o, type: "folga" as const, date: o.date.toISOString(), endDate: o.endDate.toISOString() })),
    input.employeeId,
    excludeId
  );
  const remaining = folgaAllowance - used;
  const requested = occurrenceDays({ date: input.date.toISOString(), endDate: input.endDate.toISOString() });
  if (requested > remaining) {
    return remaining <= 0
      ? "O colaborador não tem folgas restantes. Aumente o total de folgas no cadastro dele, se for o caso."
      : `Saldo insuficiente: restam ${pluralDias(remaining)} de folga e o lançamento pede ${pluralDias(requested)}.`;
  }
  return null;
}
