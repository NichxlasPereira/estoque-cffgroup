import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Senha compartilhada por módulo, além do Basic Auth do site inteiro. Vem de
 * variável de ambiente e nunca fica no código; sem ela, o módulo fica
 * bloqueado (falha fechado). Hoje só o estoque usa este esquema — a
 * frequência tem contas individuais (ver frequenciaAccess.ts).
 */

export type ModuleKey = "estoque";

interface ModuleConfig {
  envVar: string;
  cookie: string;
  /** Tela de senha do módulo. */
  loginPath: string;
  /** Para onde ir depois de entrar, se nada for pedido. */
  home: string;
  /** Páginas e APIs do módulo (sem a tela de senha). */
  owns: (pathname: string) => boolean;
  /** Destinos aceitos depois do login — evita redirecionar para fora. */
  allowsReturnTo: (path: string) => boolean;
}

const startsWithSegment = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export const MODULES: Record<ModuleKey, ModuleConfig> = {
  estoque: {
    envVar: "ESTOQUE_PASSWORD",
    cookie: "estoque_session",
    loginPath: "/entrar",
    home: "/",
    owns: (p) => p === "/" || startsWithSegment(p, "/api/materials") || startsWithSegment(p, "/api/withdrawals"),
    allowsReturnTo: (p) => p === "/" || p.startsWith("/?"),
  },
};

export const SESSION_SECONDS = 12 * 60 * 60;

export function isModuleKey(value: unknown): value is ModuleKey {
  return value === "estoque";
}

export function moduleForPath(pathname: string): ModuleKey | null {
  for (const key of Object.keys(MODULES) as ModuleKey[]) {
    if (MODULES[key].owns(pathname)) return key;
  }
  return null;
}

export function modulePassword(module: ModuleKey): string | null {
  const value = process.env[MODULES[module].envVar];
  return value && value.length > 0 ? value : null;
}

/**
 * Valor do cookie de sessão: HMAC da senha sobre módulo + expiração. Trocar a
 * senha invalida as sessões abertas, e a sessão de um módulo não vale no outro
 * mesmo que as senhas sejam iguais.
 */
export function createSessionToken(
  module: ModuleKey,
  password: string,
  expiresAt = Date.now() + SESSION_SECONDS * 1000
): string {
  const exp = String(expiresAt);
  const sig = createHmac("sha256", password).update(`${module}:${exp}`).digest("hex");
  return `${exp}.${sig}`;
}

export function isValidSessionToken(module: ModuleKey, token: string | undefined, password: string): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = createSessionToken(module, password, Number(exp)).split(".")[1];
  return safeEqual(sig, expected);
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Compara mesmo com tamanhos diferentes para não vazar o tamanho pelo tempo.
  const same = bufA.length === bufB.length;
  return timingSafeEqual(same ? bufA : bufB, bufB) && same;
}

export function safeReturnTo(module: ModuleKey, requested: unknown): string {
  const config = MODULES[module];
  return typeof requested === "string" && config.allowsReturnTo(requested) ? requested : config.home;
}
