import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Fontes } from "@etl/comum/fontes";
import {
  Agregados,
  ListaVotacoes,
  type MandatoNaLegislatura,
  type Medianas,
  Parlamentar,
  type ResumoVotacao,
  VotosDoAno,
} from "@etl/comum/saida";
import { EmendasDoParlamentar, EmendasPorUf } from "@etl/emendas/saida";
import { ListaPessoas, type Pessoa } from "@etl/pessoas/saida";
import { EleicoesDoParlamentar } from "@etl/tse/saida";
import type { z } from "zod";

/*
 * Leitura dos arquivos da branch `dados` (baixada em ./dados antes do build).
 * Só roda no build: as páginas são geradas estaticamente, e os dados não vão
 * para o Worker. Sem a pasta (clone novo, sem `pnpm dados:baixar`), o site
 * gera só as páginas que não dependem de dados.
 */

export type Casa = "camara" | "senado";

const pasta = () => process.env.DADOS_DIR ?? join(process.cwd(), "dados");

const cache = new Map<string, unknown>();

function ler<S extends z.ZodType>(
  caminho: string,
  esquema: S,
): z.infer<S> | undefined {
  if (cache.has(caminho)) return cache.get(caminho) as z.infer<S>;
  const completo = join(pasta(), caminho);
  if (!existsSync(completo)) return undefined;
  const valor = esquema.parse(JSON.parse(readFileSync(completo, "utf8")));
  cache.set(caminho, valor);
  return valor;
}

export function existemDados(): boolean {
  return existsSync(join(pasta(), "pessoas.json"));
}

export function lerPessoas(): Pessoa[] {
  return ler("pessoas.json", ListaPessoas)?.pessoas ?? [];
}

export function lerFontes() {
  return ler("fontes.json", Fontes);
}

const PASTA_DA_CASA: Record<Casa, string> = {
  camara: "camara/deputados",
  senado: "senado/senadores",
};

export function lerParlamentar(casa: Casa, id: number) {
  return ler(`${PASTA_DA_CASA[casa]}/${id}.json`, Parlamentar);
}

export function lerEmendas(casa: Casa, id: number) {
  return ler(`emendas/parlamentares/${casa}-${id}.json`, EmendasDoParlamentar);
}

export function lerEleicoes(casa: Casa, id: number) {
  return ler(`tse/parlamentares/${casa}-${id}.json`, EleicoesDoParlamentar);
}

export function lerAgregados(casa: Casa) {
  return ler(`${casa}/agregados.json`, Agregados);
}

export function lerEmendasPorUf() {
  return ler("emendas/ufs.json", EmendasPorUf);
}

/** Votações nominais da casa, da mais recente para a mais antiga. */
export function listarVotacoes(casa: Casa) {
  return ler(`${casa}/votacoes.json`, ListaVotacoes)?.votacoes ?? [];
}

/** Votos de cada parlamentar nas votações de um ano (idVotacao → votos). */
export function lerVotosDoAno(casa: Casa, ano: number) {
  return ler(`${casa}/votos/${ano}.json`, VotosDoAno)?.votacoes ?? {};
}

/** Pessoa a partir do registro de uma casa (`camara-204379`). */
export function pessoaDoRegistro(casa: Casa, id: number): Pessoa | undefined {
  const chave = "pessoas-por-registro";
  let indice = cache.get(chave) as Map<string, Pessoa> | undefined;
  if (!indice) {
    indice = new Map(
      lerPessoas().flatMap((p) =>
        p.registros.map((r) => [`${r.casa}-${r.id}`, p] as const),
      ),
    );
    cache.set(chave, indice);
  }
  return indice.get(`${casa}-${id}`);
}

function lerVotacoes(casa: Casa): Map<string, ResumoVotacao> {
  const chave = `votacoes-indice-${casa}`;
  if (cache.has(chave)) return cache.get(chave) as Map<string, ResumoVotacao>;
  const lista = ler(`${casa}/votacoes.json`, ListaVotacoes)?.votacoes ?? [];
  const indice = new Map(lista.map((v) => [v.id, v]));
  cache.set(chave, indice);
  return indice;
}

/** Medianas da casa, do partido e da UF do parlamentar na legislatura. */
export function medianasDoMandato(
  casa: Casa,
  mandato: MandatoNaLegislatura,
): { casa?: Medianas; partido?: Medianas; uf?: Medianas } {
  const legislatura = lerAgregados(casa)?.legislaturas.find(
    (l) => l.idLegislatura === mandato.idLegislatura,
  );
  return {
    casa: legislatura?.casa,
    partido: legislatura?.partidos[mandato.partido],
    uf: legislatura?.ufs[mandato.uf],
  };
}

export interface VotoRecente {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  voto: string;
  aprovada: boolean | null;
  secreta: boolean;
}

/** As votações mais recentes do mandato, com o voto do parlamentar. */
export function votosRecentes(
  casa: Casa,
  mandato: MandatoNaLegislatura,
  quantidade = 10,
): VotoRecente[] {
  const votacoes = lerVotacoes(casa);
  return Object.entries(mandato.votacoes.votos)
    .map(([id, voto]) => ({ votacao: votacoes.get(id), voto }))
    .filter(
      (x): x is { votacao: ResumoVotacao; voto: string } =>
        x.votacao !== undefined,
    )
    .sort((a, b) => b.votacao.data.localeCompare(a.votacao.data))
    .slice(0, quantidade)
    .map(({ votacao, voto }) => ({
      id: votacao.id,
      data: votacao.data,
      titulo: votacao.proposicao?.titulo || "Votação no Plenário",
      // O que foi decidido naquela votação (um projeto pode ter várias: texto, destaques…)
      descricao: votacao.descricao || votacao.proposicao?.ementa || "",
      voto,
      aprovada: votacao.aprovada,
      secreta: votacao.secreta ?? false,
    }));
}
