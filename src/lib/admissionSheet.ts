import { prisma } from "./prisma";
import { DriveError } from "./googleDrive";
import { columnLetter } from "./googleSheets";
import { openSheetTarget } from "./googleTargets";

type AdmissionForSheet = NonNullable<Awaited<ReturnType<typeof loadAdmission>>>;

function loadAdmission(id: string) {
  return prisma.admission.findUnique({ where: { id }, include: { fields: { orderBy: { sortOrder: "asc" } } } });
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const dateBR = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const STATUS_LABEL: Record<string, string> = { em_andamento: "Em análise", concluida: "Concluído", cancelada: "Cancelado" };

interface Column {
  id: string;
  header: string; // título usado quando a aba está vazia
  aliases: string[]; // títulos reconhecidos (sem acento, minúsculas)
  value: (a: AdmissionForSheet, field: (key: string) => string) => string;
  onlyOnCreate?: boolean;
}

const NAME_ALIASES = ["nome completo", "nome", "colaborador", "candidato", "funcionario"];

// Ordem importa: as mais específicas primeiro ("data de nascimento" antes de "data").
const COLUMNS: Column[] = [
  { id: "nascimento", header: "Data de nascimento", aliases: ["data de nascimento", "nascimento", "dt nascimento"], value: (_a, f) => dateBR(f("nascimento")) },
  { id: "inicio", header: "Início previsto", aliases: ["inicio previsto", "data de inicio", "inicio", "data de admissao", "admissao"], value: (a) => dateBR(a.startDate) },
  { id: "data", header: "Data do envio", aliases: ["data do envio", "data de envio", "enviado em", "data"], value: () => dateBR(new Date()), onlyOnCreate: true },
  { id: "nome", header: "Nome", aliases: NAME_ALIASES, value: (a, f) => f("nome") || a.candidateName || "" },
  { id: "cpf", header: "CPF", aliases: ["cpf"], value: (_a, f) => f("cpf") },
  { id: "email", header: "E-mail", aliases: ["e mail", "email"], value: (a, f) => f("email") || a.email || "" },
  { id: "telefone", header: "Telefone", aliases: ["telefone whatsapp", "telefone", "whatsapp", "celular", "contato"], value: (a, f) => f("telefone") || a.phone || "" },
  { id: "endereco", header: "Endereço", aliases: ["endereco completo", "endereco"], value: (_a, f) => f("endereco") },
  { id: "pix", header: "Chave Pix", aliases: ["chave pix", "pix"], value: (_a, f) => f("pix") },
  { id: "cargo", header: "Cargo", aliases: ["cargo", "funcao"], value: (a) => a.role ?? "" },
  { id: "setor", header: "Setor", aliases: ["setor", "departamento", "area"], value: (a) => a.department ?? "" },
  { id: "situacao", header: "Situação", aliases: ["situacao", "status"], value: (a) => STATUS_LABEL[a.status] ?? a.status },
  { id: "drive", header: "Pasta no Drive", aliases: ["pasta no drive", "pasta", "drive", "documentos", "link"], value: (a) => a.driveFolderUrl ?? "" },
];

/** Ordem das colunas quando o sistema cria os títulos numa aba vazia. */
const DEFAULT_ORDER = ["data", "nome", "cpf", "nascimento", "email", "telefone", "endereco", "pix", "cargo", "setor", "inicio", "situacao", "drive"];

/** Qual coluna (do sistema) cada título da planilha representa. */
function mapHeaders(headers: string[], a: AdmissionForSheet): (((field: (key: string) => string) => string) | null)[] {
  const used = new Set<string>();
  return headers.map((raw) => {
    const h = norm(raw);
    if (!h) return null;
    // Campos extras pedidos pelo RH casam pelo próprio nome.
    const extra = a.fields.find((f) => f.key.startsWith("extra-") && norm(f.label) === h);
    if (extra) return () => extra.value ?? "";
    const col =
      COLUMNS.find((c) => !used.has(c.id) && c.aliases.includes(h)) ??
      COLUMNS.find((c) => !used.has(c.id) && c.aliases.some((al) => al.length > 3 && h.includes(al)));
    if (!col) return null;
    used.add(col.id);
    return Object.assign((field: (key: string) => string) => col.value(a, field), { onlyOnCreate: col.onlyOnCreate });
  });
}

/**
 * Cria ou atualiza a linha do candidato na planilha. Acha a linha pelo CPF
 * (ou pelo nome, se não houver coluna de CPF), então funciona mesmo que o RH
 * reordene a planilha. Nunca lança: o resultado fica gravado na admissão.
 */
export async function syncAdmissionToSheet(admissionId: string): Promise<void> {
  const admission = await loadAdmission(admissionId);
  if (!admission || !admission.candidateName) return; // nada a registrar antes do candidato preencher

  const save = (data: { sheetStatus: string; sheetError: string | null; sheetSyncedAt?: Date }) =>
    prisma.admission.update({ where: { id: admissionId }, data });

  try {
    const sheet = await openSheetTarget();
    if (!sheet) {
      await save({ sheetStatus: "nao_configurado", sheetError: null });
      return;
    }
    // Uma leitura só da aba inteira: títulos e linhas (menos idas ao Google).
    const grid = await sheet.loadGrid();
    let headers = (grid[0] ?? []).map((h) => String(h ?? ""));
    if (headers.every((h) => !h?.trim())) {
      headers = DEFAULT_ORDER.map((id) => COLUMNS.find((c) => c.id === id)!.header);
      await sheet.writeCells(headers.map((h, i) => ({ a1: `${columnLetter(i)}1`, value: h })));
    }

    const byKey = new Map(admission.fields.map((f) => [f.key, f.value ?? ""]));
    const field = (key: string) => byKey.get(key) ?? "";
    const mapping = mapHeaders(headers, admission);

    // Procura a linha existente pelo CPF; sem coluna de CPF, pelo nome.
    const cpfDigits = field("cpf").replace(/\D/g, "");
    const keyIndex = headers.findIndex((h) => norm(h) === "cpf");
    const nameIndex = headers.findIndex((h) => NAME_ALIASES.includes(norm(h)));
    let rowNumber: number | null = null;
    const lookupIndex = keyIndex >= 0 && cpfDigits ? keyIndex : nameIndex;
    if (lookupIndex >= 0) {
      const target = lookupIndex === keyIndex ? cpfDigits : norm(admission.candidateName);
      const found = grid.slice(1).findIndex((row) => {
        const v = String(row?.[lookupIndex] ?? "");
        return lookupIndex === keyIndex ? v.replace(/\D/g, "") === target : norm(v) === target;
      });
      if (found >= 0) rowNumber = found + 2;
    }

    if (rowNumber) {
      await sheet.writeCells(
        mapping.flatMap((m, i) =>
          m && !(m as { onlyOnCreate?: boolean }).onlyOnCreate ? [{ a1: `${columnLetter(i)}${rowNumber}`, value: m(field) }] : []
        )
      );
    } else {
      await sheet.append(mapping.map((m) => (m ? m(field) : "")));
    }
    await save({ sheetStatus: "ok", sheetError: null, sheetSyncedAt: new Date() });
  } catch (err) {
    await save({
      sheetStatus: "erro",
      sheetError: (err instanceof DriveError ? err.message : `Falha inesperada na planilha: ${String(err)}`).slice(0, 500),
    });
  }
}
