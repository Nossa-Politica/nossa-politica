import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermoGlossario } from "@/components/perfil/comum";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListaNominal } from "@/components/votacoes/lista-nominal";
import { Placar } from "@/components/votacoes/placar";
import type { Casa } from "@/lib/dados";
import { formatarData, NOME_DA_CASA, nomeLegislatura } from "@/lib/formatar";
import { carregarVotacao, todasAsVotacoes } from "@/lib/votacoes";

export const dynamicParams = false;

export function generateStaticParams() {
  return todasAsVotacoes().map((v) => ({ casa: v.casa, id: v.id }));
}

const ehCasa = (c: string): c is Casa => c === "camara" || c === "senado";

export async function generateMetadata({
  params,
}: PageProps<"/votacoes/[casa]/[id]">): Promise<Metadata> {
  const { casa, id } = await params;
  if (!ehCasa(casa)) return {};
  const v = carregarVotacao(casa, decodeURIComponent(id))?.votacao;
  if (!v) return {};
  const titulo = v.proposicao?.titulo || "Votação no Plenário";
  return {
    title: `${titulo} (${formatarData(v.data)}) · Nossa Política`,
    description: `Como cada parlamentar votou: ${v.descricao.slice(0, 150)}`,
  };
}

const urlProposicao = (casa: Casa, id: number) =>
  casa === "camara"
    ? `https://www.camara.leg.br/propostas-legislativas/${id}`
    : `https://www25.senado.leg.br/web/atividade/materias/-/materia/${id}`;

export default async function PaginaVotacao({
  params,
}: PageProps<"/votacoes/[casa]/[id]">) {
  const { casa, id } = await params;
  if (!ehCasa(casa)) notFound();
  const dados = carregarVotacao(casa, decodeURIComponent(id));
  if (!dados) notFound();
  const { votacao: v, contagem, porPartido, votos } = dados;
  const secreta = v.secreta ?? false;
  const orientacoes = Object.entries(v.orientacoes);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {NOME_DA_CASA[casa]} · {formatarData(v.data)} ·{" "}
          {nomeLegislatura(v.idLegislatura)}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {v.proposicao?.titulo || "Votação no Plenário"}
        </h1>
        {v.proposicao?.ementa && (
          <p className="text-muted-foreground">{v.proposicao.ementa}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {v.aprovada !== null && (
            <Badge variant="secondary">
              {v.aprovada ? "Aprovada" : "Rejeitada"}
            </Badge>
          )}
          {secreta && <Badge variant="outline">Votação secreta</Badge>}
          {v.proposicao && (
            <a
              href={urlProposicao(casa, v.proposicao.id)}
              target="_blank"
              rel="noopener"
              className="text-sm underline underline-offset-2"
            >
              Ver o projeto no site oficial
            </a>
          )}
        </div>
      </header>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="o-que-foi-votado"
      >
        <h2
          id="o-que-foi-votado"
          className="font-heading text-xl font-semibold"
        >
          O que foi votado
        </h2>
        <p className="text-sm">{v.descricao || "Sem descrição oficial."}</p>
        <Placar
          sim={v.placar.sim}
          nao={v.placar.nao}
          outros={v.placar.outros}
        />
        <p className="text-xs text-muted-foreground">
          Placar oficial.{" "}
          <TermoGlossario chave="votacaoNominal">
            Votação nominal
          </TermoGlossario>
          : o voto de cada parlamentar fica registrado
          {secreta &&
            ", exceto nas secretas, em que só se sabe quem compareceu"}
          .
        </p>
      </section>

      {orientacoes.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="orientacoes">
          <h2 id="orientacoes" className="font-heading text-xl font-semibold">
            Como os líderes orientaram
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {orientacoes.map(([bancada, orientacao]) => (
              <li key={bancada} className="rounded-lg border px-2.5 py-1">
                {bancada}: <strong>{orientacao}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!secreta && porPartido.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="por-partido">
          <h2 id="por-partido" className="font-heading text-xl font-semibold">
            Por partido
          </h2>
          <p className="text-sm text-muted-foreground">
            Partido de cada parlamentar no dia da votação. Sim: {contagem.Sim},
            Não: {contagem.Não}, outros:{" "}
            {contagem.Abstenção + contagem.Obstrução + contagem.Outros}.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partido</TableHead>
                  <TableHead className="text-right">Sim</TableHead>
                  <TableHead className="text-right">Não</TableHead>
                  <TableHead className="text-right">Outros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porPartido.map((p) => (
                  <TableRow key={p.partido}>
                    <TableCell>{p.partido || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.Sim}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.Não}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.Abstenção + p.Obstrução + p.Outros}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            "Outros" inclui abstenção, obstrução e, no Senado, ausências
            registradas na votação.
          </p>
        </section>
      )}

      {votos.length > 0 && (
        <section
          className="flex flex-col gap-3"
          aria-labelledby="como-cada-um-votou"
        >
          <h2
            id="como-cada-um-votou"
            className="font-heading text-xl font-semibold"
          >
            {secreta ? "Quem compareceu" : "Como cada um votou"}
          </h2>
          <ListaNominal votos={votos} />
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Fonte:{" "}
        <a
          href={
            casa === "camara"
              ? "https://dadosabertos.camara.leg.br/arquivos"
              : "https://legis.senado.leg.br/dadosabertos/docs/"
          }
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener"
        >
          Dados Abertos {casa === "camara" ? "da Câmara" : "do Senado"}
        </a>
      </p>
    </main>
  );
}
