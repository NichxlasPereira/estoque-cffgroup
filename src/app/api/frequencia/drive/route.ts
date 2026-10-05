import { NextResponse } from "next/server";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { DriveError, DriveSession, driveConfig } from "@/lib/googleDrive";
import { SheetsSession, sheetsConfig } from "@/lib/googleSheets";

/** Confere a conexão com o Google Drive (credencial e pasta de destino). */
/** Confere a planilha (aba e acesso). */
async function checkSheet() {
  let config;
  try {
    config = sheetsConfig();
  } catch (err) {
    return { configured: true, ok: false, error: (err as Error).message };
  }
  if (!config) return { configured: false, ok: false };
  try {
    const sheet = await SheetsSession.open(config);
    return { configured: true, ok: true, tab: sheet.tabTitle, url: `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof DriveError ? err.message : "Não foi possível abrir a planilha." };
  }
}

export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;

  let config;
  try {
    config = driveConfig();
  } catch (err) {
    return NextResponse.json({ configured: true, ok: false, error: (err as Error).message, sheet: await checkSheet() });
  }
  const sheet = await checkSheet();
  if (!config) return NextResponse.json({ configured: false, ok: false, sheet });

  try {
    const drive = await DriveSession.open(config);
    const folder = await drive.checkFolder();
    return NextResponse.json({
      configured: true,
      ok: true,
      folderName: folder.name,
      folderUrl: folder.url,
      serviceAccount: config.key.client_email,
      sheet,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      ok: false,
      error: err instanceof DriveError ? err.message : "Não foi possível falar com o Google Drive.",
      serviceAccount: config.key.client_email,
      sheet,
    });
  }
}
