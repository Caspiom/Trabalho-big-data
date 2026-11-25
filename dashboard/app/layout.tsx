import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fomento CNPq: gênero e raça/cor",
  description: "Auditoria de viés étnico-racial e de gênero no fomento do CNPq (ODS 5 e ODS 18).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
