import { NextResponse } from "next/server";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";

export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  return NextResponse.json(auth.user);
}
