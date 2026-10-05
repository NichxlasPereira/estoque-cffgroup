import type { Metadata } from "next";
import { AdmissionThanks } from "@/components/admission/AdmissionThanks";

export const metadata: Metadata = {
  title: "Envio concluído · CFFGROUP",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AdmissaoEnviadoPage({ params }: PageProps<"/admissao/[token]/enviado">) {
  const { token } = await params;
  return <AdmissionThanks token={token} />;
}
