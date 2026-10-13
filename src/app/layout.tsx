import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nossa Política",
  description:
    "Encontre um político e entenda em 30 segundos o que ele fez: gastos, projetos, votos e presença.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
            <Link href="/" className="font-heading font-semibold">
              Nossa Política
            </Link>
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground">
            <p>
              Dados públicos da Câmara, do Senado, do Portal da Transparência e
              do TSE. Site independente e sem vínculo com partidos.
            </p>
            <p>
              <a
                href="https://github.com/guilhermemcardoso/nossa-politica"
                className="underline underline-offset-2"
                target="_blank"
                rel="noopener"
              >
                Código aberto
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
