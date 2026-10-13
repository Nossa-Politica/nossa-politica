import type { MandatoNaLegislatura, Medianas } from "@etl/comum/saida";
import { Badge } from "@/components/ui/badge";
import {
  type CasaLegislativa,
  colegas,
  formatarData,
  formatarInteiro,
  fraseContagem,
} from "@/lib/formatar";
import { Bloco, Fonte, TermoGlossario, TituloBloco } from "./comum";

const VISIVEIS = 15;

const urlProposicao = (casa: CasaLegislativa, id: number) =>
  casa === "camara"
    ? `https://www.camara.leg.br/propostas-legislativas/${id}`
    : `https://www25.senado.leg.br/web/atividade/materias/-/materia/${id}`;

const TIPOS: Record<string, string> = {
  PL: "Projeto de lei",
  PLP: "Lei complementar",
  PEC: "Emenda à Constituição",
  PDL: "Decreto legislativo",
};

export function BlocoProjetos({
  id,
  casa,
  mandato,
  medianaCasa,
  atualizadoEm,
}: {
  id: string;
  casa: CasaLegislativa;
  mandato: MandatoNaLegislatura;
  medianaCasa?: Medianas;
  atualizadoEm?: string;
}) {
  const { proposicoes } = mandato;
  const m = medianaCasa?.proposicoesComoPrimeiroAutor;
  const conclusao =
    proposicoes.comoPrimeiroAutor === 0
      ? "Nenhum projeto apresentado como primeiro autor"
      : `Apresentou ${formatarInteiro(proposicoes.comoPrimeiroAutor)} ${
          proposicoes.comoPrimeiroAutor === 1 ? "projeto" : "projetos"
        } como primeiro autor${
          m != null
            ? `, ${fraseContagem(proposicoes.comoPrimeiroAutor, m)} dos ${colegas(casa)}`
            : ""
        }`;

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Projetos"
        conclusao={conclusao}
      />
      <p className="text-sm text-muted-foreground">
        {formatarInteiro(proposicoes.apresentadas)} projetos assinados no total,
        contando os de{" "}
        <TermoGlossario chave="primeiroAutor">coautoria</TermoGlossario>;{" "}
        {formatarInteiro(proposicoes.viraramNorma)}{" "}
        <TermoGlossario chave="norma">
          {proposicoes.viraramNorma === 1 ? "virou lei" : "viraram lei"}
        </TermoGlossario>
        . Contamos projetos de lei, de lei complementar, de emenda à
        Constituição e de decreto legislativo.
      </p>

      {proposicoes.lista.length > 0 && (
        <ol className="flex flex-col divide-y">
          {proposicoes.lista.slice(0, VISIVEIS).map((p) => (
            <li key={p.id} className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <a
                  href={urlProposicao(casa, p.id)}
                  target="_blank"
                  rel="noopener"
                  className="font-medium underline underline-offset-2"
                >
                  {p.sigla}
                </a>
                <span className="text-muted-foreground">
                  {TIPOS[p.tipo] ?? p.tipo} · {formatarData(p.dataApresentacao)}
                </span>
                {p.primeiroAutor && (
                  <Badge variant="secondary">Primeiro autor</Badge>
                )}
              </div>
              <p className="line-clamp-3 text-sm">{p.ementa}</p>
              {p.situacao && (
                <p className="text-xs text-muted-foreground">
                  Situação: {p.situacao}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {proposicoes.lista.length > VISIVEIS && (
        <p className="text-sm text-muted-foreground">
          Mostrando os {VISIVEIS} mais recentes de{" "}
          {formatarInteiro(proposicoes.apresentadas)}.
        </p>
      )}

      <Fonte
        nome={
          casa === "camara"
            ? "Dados Abertos da Câmara"
            : "Dados Abertos do Senado"
        }
        url={
          casa === "camara"
            ? "https://dadosabertos.camara.leg.br/"
            : "https://legis.senado.leg.br/dadosabertos/docs/"
        }
        atualizadoEm={atualizadoEm}
      />
    </Bloco>
  );
}
