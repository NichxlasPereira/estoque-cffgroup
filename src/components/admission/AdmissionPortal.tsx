"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { DocumentStatus, admissionProgress } from "@/lib/admission";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_MB, formatFileSize } from "@/lib/attendance";
import { formatDateBR } from "@/lib/format";
import { ThemeToggle } from "../ThemeToggle";
import { IconAlertTriangle, IconPaperclip, IconX } from "../icons";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface PortalDocument {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  status: DocumentStatus;
  reviewNote: string | null;
  files: { id: string; fileName: string; size: number }[];
}

interface PortalData {
  candidateName: string;
  role: string | null;
  startDate: string | null;
  tokenExpiresAt: string;
  documents: PortalDocument[];
}

/** Página do candidato: envia os documentos pedidos e acompanha a análise do RH. */
export function AdmissionPortal({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admissao/${token}`, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Não foi possível abrir este link.");
      return;
    }
    setData(body);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(doc: PortalDocument, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(doc.id);
    let sent = 0;
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        toast.error(`${file.name}: passa de ${MAX_ATTACHMENT_MB} MB.`);
        continue;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admissao/${token}/documents/${doc.id}`, { method: "POST", body: form });
      if (res.ok) sent++;
      else {
        const body = await res.json().catch(() => ({}));
        toast.error(`${file.name}: ${body.error || "não foi possível enviar."}`);
      }
    }
    setUploading(null);
    if (sent > 0) toast.success(sent === 1 ? "Arquivo enviado." : `${sent} arquivos enviados.`);
    await load();
  }

  async function removeFile(fileId: string) {
    const res = await fetch(`/api/admissao/${token}/files/${fileId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error || "Não foi possível remover.");
    }
    await load();
  }

  if (error) {
    return (
      <Shell>
        <div className="flex gap-3 rounded-[14px] border border-warn bg-warn-soft p-4 text-sm text-ink">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <p>{error}</p>
        </div>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell>
        <p className="py-16 text-center text-sm text-muted">Carregando...</p>
      </Shell>
    );
  }

  const progress = admissionProgress(data.documents);
  const done = progress.approved === progress.required;
  const pct = progress.required ? Math.round((progress.approved / progress.required) * 100) : 0;
  const firstName = data.candidateName.split(" ")[0];

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">Olá, {firstName}!</h1>
        <p className="text-sm text-muted">
          Esta é a sua admissão digital na CFFGROUP{data.role ? ` para ${data.role}` : ""}
          {data.startDate ? `, com início previsto em ${formatDateBR(data.startDate)}` : ""}. Envie cada documento
          abaixo — foto do celular ou PDF. O RH avalia e você acompanha por aqui.
        </p>
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-4">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">
            {done ? "Tudo aprovado! O RH vai entrar em contato." : "Documentos obrigatórios aprovados"}
          </span>
          <span className="font-mono tabular-nums text-muted">
            {progress.approved}/{progress.required}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {progress.missing > 0 && `${progress.missing} a enviar · `}
          {progress.inReview > 0 && `${progress.inReview} em análise · `}
          {progress.refused > 0 && `${progress.refused} para reenviar · `}
          link válido até {formatDateBR(data.tokenExpiresAt)}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {data.documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            busy={uploading === doc.id}
            onUpload={(files) => upload(doc, files)}
            onRemove={removeFile}
          />
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        Seus documentos são usados apenas para a sua admissão e só a equipe de RH da CFFGROUP tem acesso a eles
        (LGPD). Não compartilhe este link — ele é pessoal.
      </p>
    </Shell>
  );
}

function DocumentCard({
  doc,
  busy,
  onUpload,
  onRemove,
}: {
  doc: PortalDocument;
  busy: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (fileId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = doc.status === "aprovado";

  return (
    <li
      className={`rounded-[14px] border bg-surface p-4 ${
        doc.status === "recusado" ? "border-critical" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">
            {doc.name}
            {!doc.required && <span className="ml-1.5 text-xs font-normal text-muted">(se tiver)</span>}
          </p>
          {doc.description && <p className="text-xs text-muted">{doc.description}</p>}
        </div>
        <DocumentStatusBadge status={doc.status} />
      </div>

      {doc.status === "recusado" && doc.reviewNote && (
        <p className="mt-3 rounded-[10px] bg-critical-soft px-3 py-2 text-sm text-ink">
          <strong className="text-critical">O RH pediu para reenviar:</strong> {doc.reviewNote}
        </p>
      )}

      {doc.files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {doc.files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-[8px] bg-surface-2 px-3 py-2 text-sm">
              <IconPaperclip className="h-4 w-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate text-ink">{f.fileName}</span>
              <span className="shrink-0 font-mono text-xs text-muted">{formatFileSize(f.size)}</span>
              {!locked && (
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  aria-label={`Remover ${f.fileName}`}
                  className="shrink-0 rounded-full p-1 text-muted transition hover:text-critical"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong px-3 py-2.5 text-sm font-semibold text-accent-strong transition hover:bg-accent-soft disabled:opacity-60"
          >
            <IconPaperclip className="h-4 w-4" />
            {busy ? "Enviando..." : doc.files.length > 0 ? "Enviar mais um arquivo" : "Enviar documento"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      )}
    </li>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "linear-gradient(135deg, #9b7bfb 0%, #6d4bde 100%)" }}
          >
            <span className="font-display text-sm font-bold text-white">C</span>
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-ink">cffgroup · admissão digital</span>
        </div>
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
