import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estoque CFFGROUP",
  description: "Controle de estoque de materiais de escritório — CFFGROUP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#14152a",
              color: "#f2f0fb",
              border: "1px solid #292a4c",
              borderLeft: "3px solid #7c5cf0",
              borderRadius: "12px",
              fontFamily: "var(--font-manrope)",
              fontSize: "14px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            },
            success: { iconTheme: { primary: "#3ddc97", secondary: "#12271f" } },
            error: { iconTheme: { primary: "#f2637c", secondary: "#2b1620" } },
          }}
        />
      </body>
    </html>
  );
}
