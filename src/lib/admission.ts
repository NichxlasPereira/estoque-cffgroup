/** Tipos e textos da admissão digital, usados no servidor e no navegador. */

export type AdmissionStatus = "em_andamento" | "concluida" | "cancelada";
export type DocumentStatus = "pendente" | "enviado" | "aprovado" | "recusado";

export const ADMISSION_STATUS_LABEL: Record<AdmissionStatus, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluído",
  cancelada: "Cancelado",
};

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  pendente: "Não enviado",
  enviado: "Em análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export interface ChecklistItem {
  name: string;
  description?: string;
  required: boolean;
}

/** Documentos pedidos por padrão no onboarding. O RH ajusta em cada onboarding. */
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { name: "Documento de identidade (RG ou CNH)", description: "Frente e verso, legíveis.", required: true },
  {
    name: "Dados bancários (com chave Pix)",
    description: "Comprovante com banco, agência e conta em seu nome. A chave Pix você digita em “Seus dados”.",
    required: true,
  },
  { name: "Foto para crachá", description: "Foto recente, de frente, com fundo claro.", required: true },
];

export type FieldType = "text" | "cpf" | "date" | "email" | "tel" | "textarea";

export interface FieldTemplate {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
}

/** Dados que o candidato preenche no link. O RH inclui ou retira em cada onboarding. */
export const DEFAULT_FIELDS: FieldTemplate[] = [
  { key: "nome", label: "Nome completo", type: "text", required: true },
  { key: "cpf", label: "CPF", type: "cpf", required: true },
  { key: "nascimento", label: "Data de nascimento", type: "date", required: true },
  { key: "email", label: "E-mail", type: "email", required: true },
  { key: "telefone", label: "Telefone / WhatsApp", type: "tel", required: true },
  { key: "endereco", label: "Endereço completo (com CEP)", type: "textarea", required: true },
  { key: "pix", label: "Chave Pix", type: "text", required: true },
];

export interface AdmissionFieldInfo {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  value: string | null;
}

function validCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(digits[len])) return false;
  }
  return true;
}

/**
 * Valida e padroniza a resposta de um campo. Retorna o valor a gravar
 * (null = vazio) ou um erro. Usada no navegador e de novo no servidor.
 */
export function normalizeFieldValue(type: FieldType, raw: string): { value: string | null } | { error: string } {
  const text = raw.trim();
  if (!text) return { value: null };
  if (text.length > 1000) return { error: "Texto longo demais." };
  switch (type) {
    case "cpf": {
      const digits = text.replace(/\D/g, "");
      if (!validCpf(digits)) return { error: "CPF inválido. Confira os números." };
      return { value: `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}` };
    }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? { value: text.toLowerCase() } : { error: "E-mail inválido." };
    case "tel": {
      const digits = text.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) return { error: "Telefone inválido. Inclua o DDD." };
      return { value: text };
    }
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(`${text}T00:00:00Z`).getTime())) {
        return { error: "Data inválida." };
      }
      return { value: text };
    }
    default:
      return { value: text.replace(type === "textarea" ? /[ \t]+/g : /\s+/g, " ") };
  }
}

export function fieldsProgress(fields: Pick<AdmissionFieldInfo, "required" | "value">[]) {
  const required = fields.filter((f) => f.required);
  return { required: required.length, filled: required.filter((f) => f.value).length };
}

export interface AdmissionFileInfo {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface AdmissionDocumentInfo {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  status: DocumentStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  files: AdmissionFileInfo[];
}

export interface AdmissionInfo {
  id: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  startDate: string | null;
  status: AdmissionStatus;
  notes: string | null;
  tokenExpiresAt: string;
  createdBy: string | null;
  employeeId: string | null;
  driveStatus: "enviado" | "erro" | "nao_configurado" | null;
  driveFolderUrl: string | null;
  driveError: string | null;
  driveSyncedAt: string | null;
  createdAt: string;
  documents: AdmissionDocumentInfo[];
  fields: AdmissionFieldInfo[];
}

export interface AdmissionProgress {
  required: number;
  approved: number;
  inReview: number;
  refused: number;
  missing: number;
}

/** Progresso considera só os documentos obrigatórios. */
export function admissionProgress(docs: Pick<AdmissionDocumentInfo, "required" | "status">[]): AdmissionProgress {
  const required = docs.filter((d) => d.required);
  return {
    required: required.length,
    approved: required.filter((d) => d.status === "aprovado").length,
    inReview: required.filter((d) => d.status === "enviado").length,
    refused: required.filter((d) => d.status === "recusado").length,
    missing: required.filter((d) => d.status === "pendente").length,
  };
}

export const LINK_VALID_DAYS = 30;
