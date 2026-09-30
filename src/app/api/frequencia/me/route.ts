import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";

export async function GET() {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  // Administradores veem quantos pedidos de cadastro aguardam aprovação.
  const pendingRequests =
    auth.user.role === "admin" ? await prisma.frequenciaUser.count({ where: { pending: true } }) : 0;
  return NextResponse.json({ ...auth.user, pendingRequests });
}
