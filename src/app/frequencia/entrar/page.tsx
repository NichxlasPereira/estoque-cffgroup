import { redirect } from "next/navigation";
import { FrequenciaLoginForm } from "@/components/attendance/FrequenciaLoginForm";
import { currentFrequenciaUser, setupKey } from "@/lib/frequenciaAccess";
import { prisma } from "@/lib/prisma";

export default async function EntrarFrequenciaPage({ searchParams }: PageProps<"/frequencia/entrar">) {
  const { voltar } = await searchParams;
  // Só volta para dentro do módulo — nunca para um endereço externo.
  const next =
    typeof voltar === "string" && (voltar === "/frequencia" || voltar.startsWith("/frequencia?")) ? voltar : "/frequencia";

  if (await currentFrequenciaUser()) redirect(next);

  const needsSetup = (await prisma.frequenciaUser.count()) === 0;
  return <FrequenciaLoginForm next={next} needsSetup={needsSetup} setupConfigured={setupKey() !== null} />;
}
