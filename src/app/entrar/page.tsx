import { ModuleLoginForm } from "@/components/ModuleLoginForm";
import { modulePassword, safeReturnTo } from "@/lib/moduleAuth";

export default async function EntrarEstoquePage({ searchParams }: PageProps<"/entrar">) {
  const { voltar } = await searchParams;
  return (
    <ModuleLoginForm
      module="estoque"
      next={safeReturnTo("estoque", voltar)}
      configured={modulePassword("estoque") !== null}
    />
  );
}
