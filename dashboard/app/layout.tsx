import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "Fomento CNPq: gênero e raça/cor",
  description: "Auditoria de viés étnico-racial e de gênero no fomento do CNPq (ODS 5 e ODS 18).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
