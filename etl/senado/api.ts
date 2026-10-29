import { z } from "zod";
import { buscarJson, type OpcoesHttp } from "../lib/http";
import { validarLinhas } from "../lib/validacao";
import {
  DespesaCeaps,
  type Filiacao,
  ListaDaLegislatura,
  type MandatoSenado,
  OrientacaoSenado,
  ProcessoSenado,
  RespostaFiliacoes,
  RespostaMandatos,
  SenadorDaLista,
  VotacaoSenado,
} from "./esquemas";

const LEGIS = "https://legis.senado.leg.br/dadosabertos";
const ADM = "https://adm.senado.gov.br/adm-dadosabertos/api/v1";

const semHifen = (data: string) => data.replaceAll("-", "");

/*
 * A API do Senado tem quedas curtas (503) que duram mais que a espera padrão
 * (~15 s). Com 8 tentativas a partir de 2 s, a carga espera até ~4 min antes
 * de desistir de uma consulta.
 */
const PACIENCIA: OpcoesHttp = { tentativas: 8, esperaInicialMs: 2000 };

const buscarDoSenado = (url: string, opcoes: OpcoesHttp = {}) =>
  buscarJson(url, { ...PACIENCIA, ...opcoes });

/** Todos que tiveram mandato na legislatura, incluindo suplentes que nunca assumiram. */
export async function buscarSenadoresDaLegislatura(
  legislatura: number,
  opcoes: OpcoesHttp = {},
): Promise<SenadorDaLista[]> {
  const json = ListaDaLegislatura.parse(
    await buscarDoSenado(
      `${LEGIS}/senador/lista/legislatura/${legislatura}`,
      opcoes,
    ),
  );
  return validarLinhas(
    SenadorDaLista,
    json.ListaParlamentarLegislatura.Parlamentares.Parlamentar,
    `senadores da legislatura ${legislatura}`,
    0,
  );
}

export async function buscarMandatos(
  codigo: number,
  opcoes: OpcoesHttp = {},
): Promise<MandatoSenado[]> {
  const json = await buscarDoSenado(
    `${LEGIS}/senador/${codigo}/mandatos`,
    opcoes,
  );
  return RespostaMandatos.parse(json).MandatoParlamentar.Parlamentar.Mandatos;
}

export async function buscarFiliacoes(
  codigo: number,
  opcoes: OpcoesHttp = {},
): Promise<Filiacao[]> {
  const json = await buscarDoSenado(
    `${LEGIS}/senador/${codigo}/filiacoes`,
    opcoes,
  );
  return RespostaFiliacoes.parse(json).FiliacaoParlamentar.Parlamentar
    .Filiacoes;
}

/** Projetos em que o senador é autor ou coautor, de qualquer ano. */
export async function buscarProcessosDoAutor(
  codigo: number,
  opcoes: OpcoesHttp = {},
): Promise<ProcessoSenado[]> {
  const json = await buscarDoSenado(
    `${LEGIS}/processo?codigoParlamentarAutor=${codigo}`,
    opcoes,
  );
  return validarLinhas(
    ProcessoSenado,
    z.array(z.unknown()).parse(json),
    `processos do senador ${codigo}`,
  );
}

/** Votações do Plenário no período (a API aceita no máximo 1 ano por consulta). */
export async function buscarVotacoes(
  inicio: string,
  fim: string,
  opcoes: OpcoesHttp = {},
): Promise<VotacaoSenado[]> {
  const json = await buscarDoSenado(
    `${LEGIS}/votacao?dataInicio=${inicio}&dataFim=${fim}`,
    opcoes,
  );
  return validarLinhas(
    VotacaoSenado,
    z.array(z.unknown()).parse(json),
    `votações do Senado ${inicio}–${fim}`,
  );
}

export async function buscarOrientacoes(
  inicio: string,
  fim: string,
  opcoes: OpcoesHttp = {},
): Promise<OrientacaoSenado[]> {
  const json = await buscarDoSenado(
    `${LEGIS}/plenario/votacao/orientacaoBancada/${semHifen(inicio)}/${semHifen(fim)}`,
    opcoes,
  );
  const { votacoes } = z
    .object({ votacoes: z.array(z.unknown()).nullish() })
    .parse(json);
  return validarLinhas(
    OrientacaoSenado,
    votacoes ?? [],
    `orientações do Senado ${inicio}–${fim}`,
  );
}

/** Despesas da Cota para o Exercício da Atividade Parlamentar dos Senadores. */
export async function buscarDespesas(
  ano: number,
  opcoes: OpcoesHttp = {},
): Promise<DespesaCeaps[]> {
  const json = await buscarDoSenado(`${ADM}/senadores/despesas_ceaps/${ano}`, {
    timeoutMs: 5 * 60_000,
    ...opcoes,
  });
  return validarLinhas(
    DespesaCeaps,
    z.array(z.unknown()).parse(json),
    `despesas CEAPS ${ano}`,
  );
}
