import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RHGroup · CFFGROUP",
  description: "Controle de faltas, atestados e folgas dos colaboradores — CFFGROUP",
};

export default function FrequenciaLayout({ children }: LayoutProps<"/frequencia">) {
  return children;
}
