import type { Metadata } from "next";
import Link from "next/link";
import { UFS } from "@/lib/formatar";

export const metadata: Metadata = {
  title: "Estados · Nossa Política",
  description:
    "A bancada de cada estado no Congresso, os gastos e as emendas enviadas.",
  alternates: { canonical: "/estados" },
};

export default function PaginaEstados() {
  const estados = Object.entries(UFS).sort(([, a], [, b]) =>
    a.localeCompare(b, "pt-BR"),
  );
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Estados
        </h1>
        <p className="text-muted-foreground">
          Escolha um estado para ver os senadores e deputados, os gastos da
          bancada e as emendas que o estado recebeu.
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {estados.map(([uf, nome]) => (
          <li key={uf}>
            <Link
              href={`/estados/${uf.toLowerCase()}`}
              className="flex h-12 items-center justify-between rounded-lg border px-3 hover:bg-muted"
            >
              <span>{nome}</span>
              <span className="text-xs text-muted-foreground">{uf}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
