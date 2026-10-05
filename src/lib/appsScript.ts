import { DriveError } from "./googleDrive";

/**
 * Integração pelo Google Apps Script: um código colado na própria planilha do
 * RH (ver integrations/google-apps-script/Codigo.gs), publicado como app da
 * Web. Ele roda com a conta de quem o publicou — sem conta de serviço, chave
 * JSON ou Google Cloud — e preenche a planilha e salva os documentos no Drive.
 *
 *   APPS_SCRIPT_URL     o endereço do app da Web (termina em /exec)
 *   APPS_SCRIPT_SECRET  o código secreto que a função "configurar" do script mostra
 */

export interface AppsScriptConfig {
  url: string;
  secret: string;
}

/** null = não configurado; lança DriveError se configurado pela metade ou errado. */
export function appsScriptConfig(): AppsScriptConfig | null {
  const url = process.env.APPS_SCRIPT_URL?.trim();
  const secret = process.env.APPS_SCRIPT_SECRET?.trim();
  if (!url && !secret) return null;
  if (!url || !secret) throw new DriveError("Configure as duas variáveis: APPS_SCRIPT_URL e APPS_SCRIPT_SECRET.");
  const official = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url);
  if (!official && process.env.NODE_ENV === "production") {
    throw new DriveError("APPS_SCRIPT_URL deve ser o endereço do app da Web, no formato https://script.google.com/macros/s/…/exec.");
  }
  return { url, secret };
}

/** Chama uma ação do script. O Google responde com um redirecionamento, que o fetch segue. */
export async function callAppsScript<T>(config: AppsScriptConfig, action: string, payload: object = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segredo: config.secret, acao: action, ...payload }),
      redirect: "follow",
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new DriveError("Não foi possível falar com o Apps Script (sem resposta). Tente de novo em instantes.");
  }
  const text = await res.text();
  let body: { ok?: boolean; erro?: string } & Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    // Página HTML no lugar de JSON = o Google pediu login: o app não está aberto para "Qualquer pessoa".
    throw new DriveError(
      'O Apps Script não respondeu como esperado. Confira se ele foi implantado como "App da Web" com acesso para "Qualquer pessoa" e se APPS_SCRIPT_URL termina em /exec.'
    );
  }
  if (!body.ok) throw new DriveError(`Apps Script: ${body.erro || "erro desconhecido"}.`);
  return body as T;
}

export interface AppsScriptStatus {
  aba: string;
  planilhaUrl: string;
  pasta: string;
  pastaUrl: string;
}

export function pingAppsScript(config: AppsScriptConfig): Promise<AppsScriptStatus> {
  return callAppsScript<AppsScriptStatus>(config, "ping");
}
