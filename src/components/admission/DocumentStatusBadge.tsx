import { DOCUMENT_STATUS_LABEL, DocumentStatus } from "@/lib/admission";

const STYLES: Record<DocumentStatus, string> = {
  pendente: "border border-border-strong text-muted",
  enviado: "bg-warn-soft text-warn",
  aprovado: "bg-ok-soft text-ok",
  recusado: "bg-critical-soft text-critical",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {DOCUMENT_STATUS_LABEL[status]}
    </span>
  );
}
