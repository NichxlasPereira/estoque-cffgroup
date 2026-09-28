import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequência CFFGROUP",
  description: "Controle de atrasos, faltas e atestados dos colaboradores — CFFGROUP",
};

export default function FrequenciaLayout({ children }: LayoutProps<"/frequencia">) {
  return children;
}
