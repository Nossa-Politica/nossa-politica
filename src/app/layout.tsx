import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { URL_DO_SITE } from "@/lib/site";
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
  metadataBase: new URL(URL_DO_SITE),
  title: "Nossa Política",
  openGraph: {
    siteName: "Nossa Política",
    locale: "pt_BR",
    images: [{ url: "/og/padrao.png", width: 1200, height: 630 }],
  },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
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
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
            <Link href="/" className="font-heading font-semibold">
              Nossa Política
            </Link>
            <nav
              aria-label="Principal"
              className="flex gap-4 text-sm text-muted-foreground"
            >
              <Link href="/explorar" className="hover:text-foreground">
                Explorar
              </Link>
              <Link href="/comparar" className="hover:text-foreground">
                Comparar
              </Link>
              <Link href="/votacoes" className="hover:text-foreground">
                Votações
              </Link>
              <Link href="/estados" className="hover:text-foreground">
                Estados
              </Link>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
            </nav>
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
