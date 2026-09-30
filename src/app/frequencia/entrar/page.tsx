import { ModuleLoginForm } from "@/components/ModuleLoginForm";
import { modulePassword, safeReturnTo } from "@/lib/moduleAuth";

export default async function EntrarFrequenciaPage({ searchParams }: PageProps<"/frequencia/entrar">) {
  const { voltar } = await searchParams;
  return (
    <ModuleLoginForm
      module="frequencia"
      next={safeReturnTo("frequencia", voltar)}
      configured={modulePassword("frequencia") !== null}
    />
  );
}
