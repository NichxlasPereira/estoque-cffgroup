"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { DocumentStatus, FieldType, admissionProgress, fieldsProgress, normalizeFieldValue } from "@/lib/admission";
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

interface PortalField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  value: string | null;
}

interface PortalData {
  candidateName: string | null;
  fields: PortalField[];
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
  const firstName = data.candidateName?.split(" ")[0];
  const dataProgress = fieldsProgress(data.fields);

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">Olá{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-sm text-muted">
          Este é o seu onboarding digital na CFFGROUP{data.role ? ` para ${data.role}` : ""}
          {data.startDate ? `, com início previsto em ${formatDateBR(data.startDate)}` : ""}. Preencha seus dados e
          envie cada documento abaixo — foto do celular ou PDF. O RH avalia e você acompanha por aqui.
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
          {dataProgress.filled < dataProgress.required &&
            `${dataProgress.required - dataProgress.filled} dado(s) a preencher · `}
          {progress.missing > 0 && `${progress.missing} a enviar · `}
          {progress.inReview > 0 && `${progress.inReview} em análise · `}
          {progress.refused > 0 && `${progress.refused} para reenviar · `}
          link válido até {formatDateBR(data.tokenExpiresAt)}
        </p>
      </div>

      {data.fields.length > 0 && <DataForm token={token} fields={data.fields} onSaved={load} />}

      <h2 className="font-display text-xl font-bold text-ink">Seus documentos</h2>
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
        Seus documentos são usados apenas para o seu onboarding e só a equipe de RH da CFFGROUP tem acesso a eles
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
          <span className="font-display text-sm font-bold tracking-tight text-ink">cffgroup · onboarding</span>
        </div>
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}

const INPUT_TYPE: Record<FieldType, string> = { text: "text", cpf: "text", date: "date", email: "email", tel: "tel", textarea: "text" };
const AUTOCOMPLETE: Partial<Record<FieldType, string>> = { email: "email", tel: "tel" };

function DataForm({ token, fields, onSaved }: { token: string; fields: PortalField[]; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.value ?? ""]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const progress = fieldsProgress(fields);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // Só envia com tudo certo: obrigatórios preenchidos e formatos válidos.
    const found: Record<string, string> = {};
    for (const f of fields) {
      const result = normalizeFieldValue(f.type, values[f.id] ?? "");
      if ("error" in result) found[f.id] = result.error;
      else if (f.required && !result.value) found[f.id] = "Preencha este campo.";
    }
    setErrors(found);
    const invalid = Object.keys(found);
    if (invalid.length > 0) {
      toast.error(
        `Os dados não foram enviados: corrija ${invalid.length === 1 ? "o campo destacado" : `os ${invalid.length} campos destacados`}.`
      );
      document.getElementById(`campo-${invalid[0]}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admissao/${token}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        toast.error(body.error || "Não foi possível enviar os dados.");
        return;
      }
      setDirty(false);
      await onSaved();
      toast.success("Dados enviados ao RH.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-4" noValidate>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-ink">Seus dados</h2>
        <span className="font-mono text-sm tabular-nums text-muted">
          {progress.filled}/{progress.required}
        </span>
      </div>
      {fields.map((f) => (
        <label key={f.id} className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">
            {f.label}
            {!f.required && <span className="ml-1.5 text-xs font-normal text-muted">(opcional)</span>}
          </span>
          {f.type === "textarea" ? (
            <textarea
              id={`campo-${f.id}`}
              rows={2}
              value={values[f.id] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.id]: e.target.value }));
                setErrors((errs) => ({ ...errs, [f.id]: "" }));
                setDirty(true);
              }}
              className={`w-full resize-y rounded-[10px] border bg-surface-2 px-3 py-2.5 text-base text-ink focus:outline-none ${
                errors[f.id] ? "border-critical" : "border-border focus:border-accent"
              }`}
            />
          ) : (
            <input
              id={`campo-${f.id}`}
              type={INPUT_TYPE[f.type]}
              inputMode={f.type === "cpf" ? "numeric" : undefined}
              autoComplete={AUTOCOMPLETE[f.type] ?? (f.label === "Nome completo" ? "name" : "off")}
              placeholder={f.type === "cpf" ? "000.000.000-00" : f.type === "tel" ? "(11) 99999-9999" : undefined}
              value={values[f.id] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.id]: e.target.value }));
                setErrors((errs) => ({ ...errs, [f.id]: "" }));
                setDirty(true);
              }}
              className={`w-full rounded-[10px] border bg-surface-2 px-3 py-2.5 text-base text-ink focus:outline-none ${
                errors[f.id] ? "border-critical" : "border-border focus:border-accent"
              }`}
            />
          )}
          {errors[f.id] && <span className="text-xs text-critical">{errors[f.id]}</span>}
        </label>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="rounded-[10px] bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Enviando..." : !dirty && progress.filled > 0 ? "Dados enviados ✓" : "Enviar dados"}
      </button>
    </form>
  );
}
