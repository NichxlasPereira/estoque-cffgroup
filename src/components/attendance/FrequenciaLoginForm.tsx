"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "../Button";
import { ThemeToggle } from "../ThemeToggle";
import { IconAlertTriangle } from "../icons";
import { inputClass } from "./formControls";

interface FrequenciaLoginFormProps {
  next: string;
  configured: boolean;
}

export function FrequenciaLoginForm({ next, configured }: FrequenciaLoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Digite a senha.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/frequencia/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Não foi possível entrar.");
        setPassword("");
        return;
      }
      // Navegação completa, para o proxy já receber o cookie novo.
      window.location.assign(next);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-[16px] border border-border bg-surface p-6 shadow-[0_24px_64px_rgba(0,0,0,0.25)]">
        <div className="mb-5 flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "linear-gradient(135deg, #9b7bfb 0%, #6d4bde 100%)" }}
          >
            <span className="font-display text-sm font-bold text-white">C</span>
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-ink">cffgroup · frequência</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted">
          A frequência reúne dados de RH e atestados. Digite a senha do módulo para continuar.
        </p>

        {configured ? (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(undefined);
                }}
                className={inputClass(!!error)}
              />
              {error && <span className="text-xs text-critical">{error}</span>}
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <div className="mt-5 flex gap-3 rounded-[10px] border border-warn bg-warn-soft px-3 py-2.5 text-sm text-ink">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <p>
              A senha ainda não foi definida. O administrador precisa configurar a variável{" "}
              <code className="font-mono text-xs">FREQUENCIA_PASSWORD</code> no servidor.
            </p>
          </div>
        )}

        <Link href="/" className="mt-5 inline-block text-sm text-muted underline-offset-2 hover:text-ink hover:underline">
          ← Voltar para o estoque
        </Link>
      </div>
    </main>
  );
}
