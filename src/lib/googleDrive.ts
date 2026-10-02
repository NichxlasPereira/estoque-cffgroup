import { createSign } from "node:crypto";

/**
 * Cliente mínimo do Google Drive (API v3) para uma conta de serviço — sem
 * dependências: assina o JWT com node:crypto e fala REST com fetch.
 *
 * Configuração (variáveis de ambiente, nunca no código — o repositório é público):
 *   GOOGLE_SERVICE_ACCOUNT_KEY  o JSON da chave da conta de serviço, inteiro
 *   GOOGLE_DRIVE_FOLDER_ID      a pasta de destino, dentro de um Drive compartilhado
 *
 * A conta de serviço não tem espaço próprio no "Meu Drive": a pasta precisa
 * estar num Drive compartilhado do Workspace, com a conta como membro.
 */

const OAUTH_URL = process.env.GOOGLE_OAUTH_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const API_URL = process.env.GOOGLE_DRIVE_API_URL ?? "https://www.googleapis.com";
const SCOPE = "https://www.googleapis.com/auth/drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

export interface DriveConfig {
  key: ServiceAccountKey;
  folderId: string;
}

export class DriveError extends Error {}

/** null = integração não configurada; lança DriveError se configurada errado. */
export function driveConfig(): DriveConfig | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!raw || !folderId) return null;
  let key: ServiceAccountKey;
  try {
    key = JSON.parse(raw);
  } catch {
    throw new DriveError("GOOGLE_SERVICE_ACCOUNT_KEY não é um JSON válido. Cole o conteúdo inteiro do arquivo da chave.");
  }
  if (!key.client_email || !key.private_key) {
    throw new DriveError("A chave da conta de serviço está incompleta (faltam client_email ou private_key).");
  }
  return { key, folderId };
}

export function serviceAccountEmail(): string | null {
  try {
    return driveConfig()?.key.client_email ?? null;
  } catch {
    return null;
  }
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

async function accessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: OAUTH_URL, iat: now, exp: now + 3600 }));
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key).toString("base64url");
  } catch {
    throw new DriveError("Não foi possível usar a private_key da conta de serviço. Gere uma nova chave JSON.");
  }

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new DriveError(`O Google recusou a conta de serviço (${body.error_description || body.error || res.status}).`);
  }
  return body.access_token;
}

/** Sessão autenticada: um token para várias chamadas seguidas. */
export class DriveSession {
  private constructor(
    private token: string,
    readonly folderId: string
  ) {}

  static async open(config: DriveConfig): Promise<DriveSession> {
    return new DriveSession(await accessToken(config.key), config.folderId);
  }

  private async call(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const reason = body?.error?.message || res.statusText;
      if (res.status === 404) {
        throw new DriveError(
          `Pasta não encontrada no Drive (${reason}). Confira GOOGLE_DRIVE_FOLDER_ID e se a conta de serviço é membro do Drive compartilhado.`
        );
      }
      if (res.status === 403) {
        throw new DriveError(`Sem permissão no Drive (${reason}). A conta de serviço precisa ser "Gerente de conteúdo" do Drive compartilhado.`);
      }
      throw new DriveError(`Erro do Google Drive: ${reason} (${res.status}).`);
    }
    return res;
  }

  /** Confere se a pasta de destino existe e é acessível. */
  async checkFolder(): Promise<{ name: string; url: string }> {
    const res = await this.call(
      `/drive/v3/files/${encodeURIComponent(this.folderId)}?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`
    );
    const file = await res.json();
    if (file.mimeType !== FOLDER_MIME) throw new DriveError("GOOGLE_DRIVE_FOLDER_ID aponta para um arquivo, não para uma pasta.");
    return { name: file.name, url: file.webViewLink };
  }

  async createFolder(name: string, parentId = this.folderId): Promise<{ id: string; url: string }> {
    const res = await this.call(`/drive/v3/files?supportsAllDrives=true&fields=id,webViewLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
    });
    const file = await res.json();
    return { id: file.id, url: file.webViewLink };
  }

  /** Envio "resumable": serve para qualquer tamanho (o multipart simples só vai até 5 MB). */
  async uploadFile(name: string, mimeType: string, data: Buffer, parentId: string): Promise<string> {
    const start = await this.call(`/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(data.byteLength),
      },
      body: JSON.stringify({ name, parents: [parentId] }),
    });
    const location = start.headers.get("location");
    if (!location) throw new DriveError("O Google Drive não devolveu o endereço de envio.");

    const res = await fetch(location, {
      method: "PUT",
      headers: { "Content-Type": mimeType, "Content-Length": String(data.byteLength) },
      body: new Uint8Array(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.id) throw new DriveError(`Falha ao enviar ${name} (${body?.error?.message || res.status}).`);
    return body.id;
  }
}
