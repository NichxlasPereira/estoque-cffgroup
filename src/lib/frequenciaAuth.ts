import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Senha extra do módulo de frequência (dados de RH e de saúde), além do Basic
 * Auth do site inteiro. A senha vem de FREQUENCIA_PASSWORD e nunca fica no
 * código. Sem ela configurada, o módulo fica bloqueado (falha fechado).
 */

export const FREQ_COOKIE = "freq_session";
export const FREQ_SESSION_SECONDS = 12 * 60 * 60;

export function frequenciaPassword(): string | null {
  const value = process.env.FREQUENCIA_PASSWORD;
  return value && value.length > 0 ? value : null;
}

/**
 * Valor do cookie de sessão: HMAC da senha sobre o horário de expiração.
 * Trocar a senha invalida todas as sessões abertas.
 */
export function createSessionToken(password: string, expiresAt = Date.now() + FREQ_SESSION_SECONDS * 1000): string {
  const exp = String(expiresAt);
  const sig = createHmac("sha256", password).update(`frequencia:${exp}`).digest("hex");
  return `${exp}.${sig}`;
}

export function isValidSessionToken(token: string | undefined, password: string): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = createSessionToken(password, Number(exp)).split(".")[1];
  return safeEqual(sig, expected);
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Compara mesmo com tamanhos diferentes para não vazar o tamanho pelo tempo.
  const same = bufA.length === bufB.length;
  return timingSafeEqual(same ? bufA : bufB, bufB) && same;
}

/** Caminhos do módulo de frequência que exigem a senha extra. */
export function isFrequenciaPath(pathname: string): boolean {
  if (pathname === "/frequencia/entrar" || pathname.startsWith("/api/frequencia/")) return false;
  return (
    pathname === "/frequencia" ||
    pathname.startsWith("/frequencia/") ||
    pathname.startsWith("/api/employees") ||
    pathname.startsWith("/api/occurrences") ||
    pathname.startsWith("/api/attachments")
  );
}
