import { NextResponse } from "next/server";
import { endSession } from "@/lib/frequenciaAccess";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  await endSession(response);
  return response;
}
