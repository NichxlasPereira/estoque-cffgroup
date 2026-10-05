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
    description: "Comprovante com banco, agência e conta em seu nome, e a sua chave Pix.",
    required: true,
  },
  { name: "Foto para crachá", description: "Foto recente, de frente, com fundo claro.", required: true },
];

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
  candidateName: string;
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
