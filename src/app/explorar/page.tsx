import type { Metadata } from "next";
import { Explorar } from "@/components/indicadores/explorar";

export const metadata: Metadata = {
  title: "Explorar · Nossa Política",
  description:
    "Todos os deputados e senadores lado a lado em presença, projetos, gastos, votações e emendas, com a mediana marcada.",
};

export default function PaginaExplorar() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Explorar
        </h1>
        <p className="text-muted-foreground">
          Escolha um indicador e filtre por casa, estado ou partido. Os mesmos
          critérios valem para todos; a mediana do grupo fica marcada para
          comparação.
        </p>
      </header>
      <Explorar />
    </main>
  );
}
