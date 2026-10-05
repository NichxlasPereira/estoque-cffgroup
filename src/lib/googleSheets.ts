import { DriveError, ServiceAccountKey, accessToken, serviceAccountKey } from "./googleDrive";

/**
 * Cliente mínimo do Google Sheets (API v4), com a mesma conta de serviço do
 * Drive. Configuração (variáveis de ambiente):
 *   GOOGLE_SHEETS_ID       o ID da planilha (docs.google.com/spreadsheets/d/<ID>/edit)
 *   GOOGLE_SHEETS_TAB_GID  opcional: o número depois de "gid=" no endereço da aba;
 *                          sem ele, usa a primeira aba
 * A planilha precisa estar compartilhada com o e-mail da conta de serviço como Editor.
 *
 * Tudo é gravado como texto puro (RAW): os valores vêm do candidato, e com
 * USER_ENTERED um "=IMPORTXML(...)" digitado no nome viraria fórmula na planilha.
 */

const SHEETS_URL = process.env.GOOGLE_SHEETS_API_URL ?? "https://sheets.googleapis.com";

export interface SheetsConfig {
  key: ServiceAccountKey;
  spreadsheetId: string;
  tabGid: number | null;
}

export function sheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!spreadsheetId) return null;
  const key = serviceAccountKey();
  if (!key) return null;
  const gid = process.env.GOOGLE_SHEETS_TAB_GID?.trim();
  return { key, spreadsheetId, tabGid: gid && /^\d+$/.test(gid) ? Number(gid) : null };
}

/** Converte índice de coluna (0 = A) em letra: 0→A, 25→Z, 26→AA. */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export class SheetsSession {
  private constructor(
    private token: string,
    readonly spreadsheetId: string,
    readonly tabTitle: string
  ) {}

  static async open(config: SheetsConfig): Promise<SheetsSession> {
    const token = await accessToken(config.key);
    const res = await sheetsFetch(token, `/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}?fields=sheets.properties`);
    const meta = await res.json();
    const tabs: { sheetId: number; title: string }[] = (meta.sheets ?? []).map((s: { properties: { sheetId: number; title: string } }) => s.properties);
    const tab = config.tabGid === null ? tabs[0] : tabs.find((t) => t.sheetId === config.tabGid);
    if (!tab) throw new DriveError("A aba indicada em GOOGLE_SHEETS_TAB_GID não existe nessa planilha.");
    return new SheetsSession(token, config.spreadsheetId, tab.title);
  }

  /** Intervalo em notação A1 com o nome da aba entre aspas (aceita espaços e acentos). */
  range(a1: string): string {
    return `'${this.tabTitle.replace(/'/g, "''")}'!${a1}`;
  }

  private base(): string {
    return `/v4/spreadsheets/${encodeURIComponent(this.spreadsheetId)}`;
  }

  /** Todas as células da aba (até a coluna ZZ). */
  async loadGrid(): Promise<string[][]> {
    return this.read("A1:ZZ");
  }

  async read(a1: string): Promise<string[][]> {
    const res = await sheetsFetch(this.token, `${this.base()}/values/${encodeURIComponent(this.range(a1))}`);
    return (await res.json()).values ?? [];
  }

  async append(row: string[]): Promise<void> {
    await sheetsFetch(
      this.token,
      `${this.base()}/values/${encodeURIComponent(this.range("A1"))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: [row] }) }
    );
  }

  /** Grava células soltas, sem tocar nas outras colunas da linha. */
  async writeCells(cells: { a1: string; value: string }[]): Promise<void> {
    if (cells.length === 0) return;
    await sheetsFetch(this.token, `${this.base()}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: cells.map((c) => ({ range: this.range(c.a1), values: [[c.value]] })),
      }),
    });
  }
}

async function sheetsFetch(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SHEETS_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.message || res.statusText;
    if (res.status === 404) throw new DriveError(`Planilha não encontrada (${reason}). Confira GOOGLE_SHEETS_ID.`);
    if (res.status === 403) {
      throw new DriveError(
        `Sem acesso à planilha (${reason}). Compartilhe a planilha com o e-mail da conta de serviço como Editor e ative a Google Sheets API.`
      );
    }
    throw new DriveError(`Erro do Google Sheets: ${reason} (${res.status}).`);
  }
  return res;
}
