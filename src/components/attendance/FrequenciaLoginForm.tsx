"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "../Button";
import { ThemeToggle } from "../ThemeToggle";
import { IconAlertTriangle } from "../icons";
import { Field, inputClass } from "./formControls";

interface FrequenciaLoginFormProps {
  next: string;
  /** Nenhuma conta existe ainda: mostra o cadastro do primeiro administrador. */
  needsSetup: boolean;
  setupConfigured: boolean;
}

type Mode = "login" | "register";

export function FrequenciaLoginForm({ next, needsSetup, setupConfigured }: FrequenciaLoginFormProps) {
  const [values, setValues] = useState({ setupKey: "", name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [requestSent, setRequestSent] = useState(false);
  // Primeiro acesso e pedido de cadastro pedem nome e confirmação de senha.
  const creating = needsSetup || mode === "register";

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(undefined);
    setRequestSent(false);
    setValues((v) => ({ ...v, password: "", confirm: "" }));
  }

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.email.trim() || !values.password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (creating) {
      if ((needsSetup && !values.setupKey) || !values.name.trim()) {
        setError("Preencha todos os campos.");
        return;
      }
      if (values.password !== values.confirm) {
        setError("As senhas não conferem.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = needsSetup
        ? "/api/frequencia/setup"
        : mode === "register"
          ? "/api/frequencia/register"
          : "/api/frequencia/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          needsSetup
            ? { setupKey: values.setupKey, name: values.name, email: values.email, password: values.password }
            : mode === "register"
              ? { name: values.name, email: values.email, password: values.password }
              : { email: values.email, password: values.password }
        ),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Não foi possível entrar.");
        setValues((v) => ({ ...v, password: "", confirm: "", setupKey: "" }));
        if (res.status === 409 && needsSetup) window.location.reload();
        return;
      }
      if (mode === "register" && !needsSetup) {
        // Pedido enviado: não há sessão até um administrador aprovar.
        setRequestSent(true);
        setMode("login");
        setValues((v) => ({ ...v, name: "", password: "", confirm: "" }));
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
          <span className="font-display text-sm font-bold tracking-tight text-ink">cffgroup · RHGroup</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">
          {needsSetup ? "Primeiro acesso" : mode === "register" ? "Solicitar cadastro" : "Acesso restrito"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {needsSetup
            ? "Crie a conta de administrador. Depois, é você quem libera o acesso de outras pessoas."
            : mode === "register"
              ? "Preencha seus dados. Você poderá entrar assim que um administrador aprovar o cadastro."
              : "Área de uso exclusivo do RH. Entre com o seu e-mail e senha."}
        </p>

        {requestSent && (
          <div className="mt-4 rounded-[10px] border border-ok bg-ok-soft px-3 py-2.5 text-sm text-ink">
            Pedido enviado! Assim que um administrador aprovar, entre aqui com o e-mail e a senha que você cadastrou.
          </div>
        )}

        {needsSetup && !setupConfigured ? (
          <div className="mt-5 flex gap-3 rounded-[10px] border border-warn bg-warn-soft px-3 py-2.5 text-sm text-ink">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <p>
              A chave de primeiro acesso não está configurada. Defina a variável{" "}
              <code className="font-mono text-xs">FREQUENCIA_PASSWORD</code> no servidor.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            {needsSetup && (
              <>
                <Field label="Chave de primeiro acesso" hint="O valor de FREQUENCIA_PASSWORD, definido no servidor.">
                  <input
                    type="password"
                    autoComplete="off"
                    value={values.setupKey}
                    onChange={(e) => set("setupKey", e.target.value)}
                    className={inputClass(false)}
                  />
                </Field>
              </>
            )}
            {creating && (
              <Field label="Seu nome">
                <input
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                  autoFocus={mode === "register"}
                  className={inputClass(false)}
                />
              </Field>
            )}
            <Field label="E-mail">
              <input
                type="email"
                autoComplete={creating ? "email" : "username"}
                autoFocus={!creating}
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass(false)}
              />
            </Field>
            <Field label={creating ? "Crie uma senha" : "Senha"} hint={creating ? "Mínimo de 8 caracteres." : undefined}>
              <input
                type="password"
                autoComplete={creating ? "new-password" : "current-password"}
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                className={inputClass(!!error)}
              />
            </Field>
            {creating && (
              <Field label="Repita a senha">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={values.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            )}
            {error && <span className="text-xs text-critical">{error}</span>}
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Enviando..."
                : needsSetup
                  ? "Criar conta e entrar"
                  : mode === "register"
                    ? "Enviar pedido de cadastro"
                    : "Entrar"}
            </Button>
            {!needsSetup && (
              <p className="text-center text-sm text-muted">
                {mode === "login" ? (
                  <>
                    Não tem acesso?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-semibold text-accent-strong underline-offset-2 hover:underline"
                    >
                      Solicitar cadastro
                    </button>
                  </>
                ) : (
                  <>
                    Já tem cadastro aprovado?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-semibold text-accent-strong underline-offset-2 hover:underline"
                    >
                      Entrar
                    </button>
                  </>
                )}
              </p>
            )}
          </form>
        )}

        <Link href="/" prefetch={false} className="mt-5 inline-block text-sm text-muted underline-offset-2 hover:text-ink hover:underline">
          ← Voltar para o estoque
        </Link>
      </div>
    </main>
  );
}
