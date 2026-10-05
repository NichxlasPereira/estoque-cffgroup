import { AppsScriptConfig, appsScriptConfig, callAppsScript } from "./appsScript";
import { DriveSession, driveConfig } from "./googleDrive";
import { SheetsSession, sheetsConfig } from "./googleSheets";

/**
 * Para onde vão os documentos e a planilha. Há dois caminhos, e o resto do
 * sistema não precisa saber qual está em uso:
 *  - Apps Script (APPS_SCRIPT_URL): preferido — não precisa de conta de serviço;
 *  - conta de serviço do Google Cloud (GOOGLE_SERVICE_ACCOUNT_KEY…).
 * As funções devolvem null quando nada está configurado e lançam DriveError
 * quando a configuração está errada.
 */

export interface DriveTarget {
  createFolder(name: string): Promise<{ id: string; url: string }>;
  uploadFile(name: string, mimeType: string, data: Buffer, folderId: string): Promise<string>;
}

export interface SheetTarget {
  /** Todas as células da aba, como texto (linha 0 = títulos). */
  loadGrid(): Promise<string[][]>;
  /** a1 sem o nome da aba, ex.: "C5". */
  writeCells(cells: { a1: string; value: string }[]): Promise<void>;
  append(row: string[]): Promise<void>;
}

class AppsScriptDrive implements DriveTarget {
  constructor(private config: AppsScriptConfig) {}
  async createFolder(name: string) {
    const r = await callAppsScript<{ id: string; url: string }>(this.config, "criarPasta", { nome: name });
    return { id: r.id, url: r.url };
  }
  async uploadFile(name: string, mimeType: string, data: Buffer, folderId: string) {
    const r = await callAppsScript<{ id: string }>(this.config, "enviarArquivo", {
      pastaId: folderId,
      nome: name,
      tipo: mimeType,
      base64: data.toString("base64"),
    });
    return r.id;
  }
}

class AppsScriptSheet implements SheetTarget {
  constructor(private config: AppsScriptConfig) {}
  async loadGrid() {
    return (await callAppsScript<{ valores: string[][] }>(this.config, "lerPlanilha")).valores ?? [];
  }
  async writeCells(cells: { a1: string; value: string }[]) {
    if (cells.length) await callAppsScript(this.config, "escreverCelulas", { celulas: cells.map((c) => ({ a1: c.a1, valor: c.value })) });
  }
  async append(row: string[]) {
    await callAppsScript(this.config, "adicionarLinha", { linha: row });
  }
}

export async function openDriveTarget(): Promise<DriveTarget | null> {
  const script = appsScriptConfig();
  if (script) return new AppsScriptDrive(script);
  const config = driveConfig();
  return config ? DriveSession.open(config) : null;
}

export async function openSheetTarget(): Promise<SheetTarget | null> {
  const script = appsScriptConfig();
  if (script) return new AppsScriptSheet(script);
  const config = sheetsConfig();
  return config ? SheetsSession.open(config) : null;
}
