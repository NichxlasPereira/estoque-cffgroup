import { NextResponse } from "next/server";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { DriveError, DriveSession, driveConfig } from "@/lib/googleDrive";

/** Confere a conexão com o Google Drive (credencial e pasta de destino). */
export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;

  let config;
  try {
    config = driveConfig();
  } catch (err) {
    return NextResponse.json({ configured: true, ok: false, error: (err as Error).message });
  }
  if (!config) return NextResponse.json({ configured: false, ok: false });

  try {
    const drive = await DriveSession.open(config);
    const folder = await drive.checkFolder();
    return NextResponse.json({
      configured: true,
      ok: true,
      folderName: folder.name,
      folderUrl: folder.url,
      serviceAccount: config.key.client_email,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      ok: false,
      error: err instanceof DriveError ? err.message : "Não foi possível falar com o Google Drive.",
      serviceAccount: config.key.client_email,
    });
  }
}
