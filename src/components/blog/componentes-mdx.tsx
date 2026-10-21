import type { ComponentProps, ReactNode } from "react";
import { BarrasHorizontais } from "@/components/perfil/barras-horizontais";
import { Fonte, TermoGlossario } from "@/components/perfil/comum";
import { GraficoColunas } from "@/components/perfil/grafico-colunas";
import { type Casa, lerAgregados } from "@/lib/dados";
import {
  formatarInteiro,
  formatarMoeda,
  formatarMoedaCurta,
  formatarPercentual,
  UFS,
} from "@/lib/formatar";
import { montarIndicadores } from "@/lib/indicadores";
import { type ChaveIndicador, INDICADORES } from "@/lib/tipos-indicadores";
import { CartaoPolitico } from "./cartao-politico";

/*
 * Componentes que os posts podem usar. Os que leem dados (Mediana, Numero,
 * MedianasPorUf, Politico) buscam o valor no build, então o post nunca fica
 * com um número digitado à mão e desatualizado.
 */

type Formato = "percentual" | "inteiro" | "moeda" | "moedaCurta";

function formatar(valor: number | null | undefined, formato: Formato) {
  if (valor === null || valor === undefined) return "—";
  if (formato === "percentual") return formatarPercentual(valor);
  if (formato === "moeda") return formatarMoeda(valor);
  if (formato === "moedaCurta") return formatarMoedaCurta(valor);
  return formatarInteiro(valor);
}

const CAMPO_MEDIANA = {
  presenca: "presencaPercentual",
  primeiroAutor: "proposicoesComoPrimeiroAutor",
  viraramNorma: "viraramNorma",
  gastoMensal: "despesaMediaMensal",
} as const;
type IndicadorComMediana = keyof typeof CAMPO_MEDIANA;

function legislaturaAtual(casa: Casa) {
  const lista = lerAgregados(casa)?.legislaturas ?? [];
  return lista[lista.length - 1];
}

/** Mediana da casa na legislatura atual, no meio do texto. */
function Mediana({
  casa,
  indicador,
}: {
  casa: Casa;
  indicador: IndicadorComMediana;
}) {
  const valor = legislaturaAtual(casa)?.casa[CAMPO_MEDIANA[indicador]];
  return <strong>{formatar(valor, INDICADORES[indicador].formato)}</strong>;
}

/** Valor de um indicador de um parlamentar, no meio do texto. */
function Numero({
  slug,
  indicador,
}: {
  slug: string;
  indicador: ChaveIndicador;
}) {
  const pessoa = montarIndicadores().pessoas.find((p) => p.slug === slug);
  if (!pessoa)
    throw new Error(`Post cita um parlamentar que não existe: ${slug}`);
  return (
    <strong>
      {formatar(pessoa[indicador], INDICADORES[indicador].formato)}
    </strong>
  );
}

/** Cartão de um parlamentar com os principais números e link para o perfil. */
function Politico({ slug }: { slug: string }) {
  const pessoa = montarIndicadores().pessoas.find((p) => p.slug === slug);
  if (!pessoa)
    throw new Error(`Post cita um parlamentar que não existe: ${slug}`);
  return <CartaoPolitico pessoa={pessoa} />;
}

/** Barras com a mediana de um indicador em cada estado. */
function MedianasPorUf({
  casa,
  indicador,
  titulo,
}: {
  casa: Casa;
  indicador: IndicadorComMediana;
  titulo: string;
}) {
  const ufs = legislaturaAtual(casa)?.ufs ?? {};
  const itens = Object.entries(ufs)
    .map(([uf, m]) => ({
      nome: UFS[uf] ?? uf,
      valor: m[CAMPO_MEDIANA[indicador]],
    }))
    .filter((i): i is { nome: string; valor: number } => i.valor !== null)
    .sort((a, b) => b.valor - a.valor);
  const formato = INDICADORES[indicador].formato;
  return (
    <figure className="my-6 flex flex-col gap-3">
      <figcaption className="text-sm font-medium">{titulo}</figcaption>
      <BarrasHorizontais
        rotulo={titulo}
        formatar={(v) => formatar(v, formato)}
        itens={itens}
      />
    </figure>
  );
}

/** Barras horizontais com dados escritos no próprio post. */
function Barras({
  titulo,
  dados,
  formato = "inteiro",
}: {
  titulo: string;
  dados: Array<{ rotulo: string; valor: number }>;
  formato?: Formato;
}) {
  return (
    <figure className="my-6 flex flex-col gap-3">
      <figcaption className="text-sm font-medium">{titulo}</figcaption>
      <BarrasHorizontais
        rotulo={titulo}
        formatar={(v) => formatar(v, formato)}
        itens={dados.map((d) => ({ nome: d.rotulo, valor: d.valor }))}
      />
    </figure>
  );
}

/** Colunas por ano com dados escritos no próprio post. */
function Colunas({
  titulo,
  dados,
}: {
  titulo: string;
  dados: Array<{ ano: number | string; valor: number }>;
}) {
  return (
    <figure className="my-6 flex flex-col gap-3">
      <figcaption className="text-sm font-medium">{titulo}</figcaption>
      <GraficoColunas
        dados={dados.map((d) => ({ chave: String(d.ano), valor: d.valor }))}
        eixo="ano"
        rotulo={titulo}
      />
    </figure>
  );
}

function Destaque({ children }: { children: ReactNode }) {
  return (
    // Um bloco de destaque dentro do texto, não uma região da página (`aside`)
    <div
      role="note"
      className="my-6 rounded-xl border-l-4 border-serie bg-muted px-4 py-3 text-base"
    >
      {children}
    </div>
  );
}

/** Tipografia dos elementos de Markdown. */
const tipografia = {
  h2: (props: ComponentProps<"h2">) => (
    <h2
      className="mt-10 mb-3 font-heading text-2xl font-semibold leading-snug"
      {...props}
    />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-8 mb-2 font-heading text-xl font-semibold" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="my-4 leading-relaxed" {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a className="underline underline-offset-2" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="my-4 flex list-disc flex-col gap-1.5 pl-6" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="my-4 flex list-decimal flex-col gap-1.5 pl-6" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="my-6 border-l-4 pl-4 text-muted-foreground"
      {...props}
    />
  ),
};

export const componentesMdx = {
  ...tipografia,
  Mediana,
  Numero,
  Politico,
  MedianasPorUf,
  Barras,
  Colunas,
  Destaque,
  Fonte,
  TermoGlossario,
};
