import type { Metadata } from "next";
import { AdmissionPortal } from "@/components/admission/AdmissionPortal";

export const metadata: Metadata = {
  title: "Admissão digital · CFFGROUP",
  description: "Envio de documentos para admissão na CFFGROUP.",
  // Link privado do candidato: nunca deve aparecer em buscadores.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AdmissaoPage({ params }: PageProps<"/admissao/[token]">) {
  const { token } = await params;
  return <AdmissionPortal token={token} />;
}
