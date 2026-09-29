import { NextResponse } from "next/server";
import { FREQ_COOKIE } from "@/lib/frequenciaAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(FREQ_COOKIE);
  return response;
}
