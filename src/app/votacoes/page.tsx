import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemVotacao } from "@/components/votacoes/item-votacao";
import { listarVotacoes } from "@/lib/dados";
import { formatarInteiro } from "@/lib/formatar";

export const metadata: Metadata = {
  title: "Votações · Nossa Política",
  description:
    "As votações nominais da Câmara e do Senado e como cada parlamentar votou.",
  alternates: { canonical: "/votacoes" },
};

const RECENTES = 60;

export default function PaginaVotacoes() {
  const casas = [
    {
      casa: "camara" as const,
      nome: "Câmara",
      votacoes: listarVotacoes("camara"),
    },
    {
      casa: "senado" as const,
      nome: "Senado",
      votacoes: listarVotacoes("senado"),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Votações
        </h1>
        <p className="text-muted-foreground">
          As votações nominais do Plenário, em que o voto de cada parlamentar
          fica registrado. Toque numa votação para ver o placar, a orientação
          dos líderes e como cada um votou.
        </p>
      </header>
      <Tabs defaultValue="camara" className="gap-4">
        <TabsList>
          {casas.map((c) => (
            <TabsTrigger key={c.casa} value={c.casa}>
              {c.nome}
            </TabsTrigger>
          ))}
        </TabsList>
        {casas.map((c) => (
          <TabsContent
            key={c.casa}
            value={c.casa}
            className="flex flex-col gap-2"
          >
            <p className="text-sm text-muted-foreground">
              As {RECENTES} mais recentes de{" "}
              {formatarInteiro(c.votacoes.length)} desde 2019.
            </p>
            <ol className="flex flex-col divide-y">
              {c.votacoes.slice(0, RECENTES).map((v) => (
                <ItemVotacao key={v.id} casa={c.casa} votacao={v} />
              ))}
            </ol>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
