import { FrequenciaLoginForm } from "@/components/attendance/FrequenciaLoginForm";
import { frequenciaPassword } from "@/lib/frequenciaAuth";

export default async function EntrarFrequenciaPage({ searchParams }: PageProps<"/frequencia/entrar">) {
  const { voltar } = await searchParams;
  // Só volta para dentro do módulo — nunca para um endereço externo.
  const next = typeof voltar === "string" && voltar.startsWith("/frequencia") ? voltar : "/frequencia";

  return <FrequenciaLoginForm next={next} configured={frequenciaPassword() !== null} />;
}
