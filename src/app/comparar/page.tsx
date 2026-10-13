import type { Metadata } from "next";
import { Comparar } from "@/components/indicadores/comparar";

export const metadata: Metadata = {
  title: "Comparar · Nossa Política",
  description:
    "Compare dois ou três deputados ou senadores nos mesmos indicadores.",
};

export default function PaginaComparar() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Comparar
        </h1>
        <p className="text-muted-foreground">
          Escolha até três parlamentares para ver os mesmos números lado a lado.
        </p>
      </header>
      <Comparar />
    </main>
  );
}
