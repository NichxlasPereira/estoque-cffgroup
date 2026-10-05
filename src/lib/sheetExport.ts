import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Link de exportação para a planilha do RH: a planilha usa
 * =IMPORTDATA("<link>") e puxa os onboardings sozinha, sem script nem
 * autorização no Google. Quem tem o link vê os dados (CPF, endereço, Pix), então
 * o token é longo e aleatório, o banco guarda só o hash, e trocar o link
 * invalida o anterior na hora.
 */

const SETTING_KEY = "planilha_export_token";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function exportUrl(origin: string, token: string): string {
  return `${origin}/api/planilha/${token}/onboarding.csv`;
}

export async function rotateExportToken(): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: hash(token) },
    update: { value: hash(token) },
  });
  return token;
}

export async function revokeExportToken(): Promise<void> {
  await prisma.appSetting.deleteMany({ where: { key: SETTING_KEY } });
}

export async function exportLinkInfo(): Promise<{ active: boolean; updatedAt: Date | null }> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
  return { active: !!setting, updatedAt: setting?.updatedAt ?? null };
}

export async function isValidExportToken(token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return false;
  const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return false;
  const a = Buffer.from(hash(token));
  const b = Buffer.from(setting.value);
  return a.length === b.length && timingSafeEqual(a, b);
}

const dateBR = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const STATUS_LABEL: Record<string, string> = { em_andamento: "Em análise", concluida: "Concluído", cancelada: "Cancelado" };

/** Uma linha por candidato que já enviou os dados, do envio mais antigo ao mais novo. */
export async function onboardingCsv(): Promise<string> {
  const admissions = await prisma.admission.findMany({
    where: { candidateName: { not: null } },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  // Dados extras pedidos pelo RH viram colunas próprias, pelo nome.
  const extraLabels = [
    ...new Set(admissions.flatMap((a) => a.fields.filter((f) => f.key.startsWith("extra-")).map((f) => f.label))),
  ];
  const header = [
    "Data do envio",
    "Nome",
    "CPF",
    "Data de nascimento",
    "E-mail",
    "Telefone",
    "Endereço",
    "Chave Pix",
    "Cargo",
    "Setor",
    "Início previsto",
    "Situação",
    ...extraLabels,
  ];

  const rows = admissions.map((a) => {
    const f = (key: string) => a.fields.find((x) => x.key === key)?.value ?? "";
    return [
      dateBR(a.submittedAt),
      f("nome") || a.candidateName || "",
      f("cpf"),
      dateBR(f("nascimento")),
      f("email") || a.email || "",
      f("telefone") || a.phone || "",
      f("endereco").replace(/\s*\n\s*/g, " "),
      f("pix"),
      a.role ?? "",
      a.department ?? "",
      dateBR(a.startDate),
      STATUS_LABEL[a.status] ?? a.status,
      ...extraLabels.map((label) => a.fields.find((x) => x.label === label)?.value ?? ""),
    ];
  });

  // CSV com todos os campos entre aspas: vírgulas e quebras dentro do texto não quebram colunas.
  const quote = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(quote).join(",")).join("\r\n") + "\r\n";
}
