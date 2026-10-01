/** Tipos e textos da admissão digital, usados no servidor e no navegador. */

export type AdmissionStatus = "em_andamento" | "concluida" | "cancelada";
export type DocumentStatus = "pendente" | "enviado" | "aprovado" | "recusado";

export const ADMISSION_STATUS_LABEL: Record<AdmissionStatus, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
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

/** Documentos usuais de uma admissão CLT. O RH ajusta em cada admissão. */
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { name: "Documento de identidade (RG ou CNH)", description: "Frente e verso, legíveis.", required: true },
  { name: "CPF", description: "Pode ser o próprio RG/CNH, se o número constar nele.", required: true },
  {
    name: "Carteira de Trabalho Digital",
    description: "Print da tela com seus dados pessoais e o número da CTPS.",
    required: true,
  },
  { name: "Comprovante de residência", description: "Emitido nos últimos 3 meses.", required: true },
  { name: "Título de eleitor", required: true },
  { name: "Comprovante de escolaridade", description: "Diploma, certificado ou histórico.", required: true },
  { name: "Certidão de nascimento ou casamento", required: true },
  { name: "Foto 3x4", description: "Foto recente, de frente, fundo claro.", required: true },
  {
    name: "Dados bancários",
    description: "Comprovante com banco, agência e conta em seu nome.",
    required: true,
  },
  { name: "PIS/PASEP", description: "Se não aparecer na Carteira de Trabalho Digital.", required: false },
  { name: "Certificado de reservista", description: "Para homens de 18 a 45 anos.", required: false },
  {
    name: "Certidão de nascimento e cartão de vacina dos filhos",
    description: "Filhos menores de 14 anos (salário-família).",
    required: false,
  },
  { name: "Exame admissional (ASO)", description: "Atestado de saúde ocupacional.", required: true },
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
