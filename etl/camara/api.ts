import { join } from "node:path";
import { z } from "zod";
import { escreverJson, lerJsonSeExistir } from "../lib/arquivos";
import { buscarJson, type OpcoesHttp } from "../lib/http";
import { extrairDados, validarLinhas } from "../lib/validacao";
import { API } from "./config";
import { DeputadoDaLista, ItemHistorico } from "./esquemas";

const Legislatura = z.object({
  id: z.number(),
  dataInicio: z.string(),
  dataFim: z.string(),
});
export type Legislatura = z.infer<typeof Legislatura>;

const RespostaPaginada = z.object({
  dados: z.array(z.unknown()),
  links: z.array(z.object({ rel: z.string(), href: z.string() })),
});

const LIMITE_PAGINAS = 1000;

/**
 * Segue os links `next` da API. A última página às vezes ainda traz um `next`
 * apontando para uma página vazia, então também para na primeira página vazia.
 */
export async function buscarTodasAsPaginas(
  url: string,
  opcoes: OpcoesHttp = {},
): Promise<unknown[]> {
  const linhas: unknown[] = [];
  let proxima: string | undefined = url;
  for (let i = 0; proxima; i++) {
    if (i === LIMITE_PAGINAS) {
      throw new Error(`Mais de ${LIMITE_PAGINAS} páginas a partir de ${url}`);
    }
    const pagina = RespostaPaginada.parse(await buscarJson(proxima, opcoes));
    if (pagina.dados.length === 0) break;
    linhas.push(...pagina.dados);
    proxima = pagina.links.find((l) => l.rel === "next")?.href;
  }
  return linhas;
}

/** Cópia da última lista de legislaturas, na raiz da pasta de dados. */
export const ARQUIVO_LEGISLATURAS = "legislaturas.json";

/*
 * A API da Câmara tem quedas (503) que duram mais que a espera padrão
 * (~15 s). Com 8 tentativas a partir de 2 s, espera até ~4 min antes de
 * desistir e usar a cópia em disco.
 */
const PACIENCIA_LEGISLATURAS: OpcoesHttp = {
  tentativas: 8,
  esperaInicialMs: 2000,
};

/**
 * As `quantidade` legislaturas mais recentes que já começaram.
 *
 * Câmara, Senado, emendas e TSE dependem desta lista, então uma queda da API
 * da Câmara não pode derrubar as quatro fontes. A cada sucesso a lista é
 * gravada em `pastaDados/legislaturas.json`; numa falha, essa cópia é usada
 * com um aviso no log. Sem cópia, o erro original é lançado.
 */
export async function buscarLegislaturas(
  quantidade: number,
  hoje: string,
  pastaDados: string,
  opcoes: OpcoesHttp = {},
): Promise<Legislatura[]> {
  const arquivo = join(pastaDados, ARQUIVO_LEGISLATURAS);
  let todas: Legislatura[];
  try {
    const json = await buscarJson(
      `${API}/legislaturas?ordem=DESC&ordenarPor=id&itens=${quantidade + 1}`,
      { ...PACIENCIA_LEGISLATURAS, ...opcoes },
    );
    todas = z.array(Legislatura).parse(extrairDados(json, "legislaturas"));
    await escreverJson(arquivo, todas);
  } catch (erro) {
    const copia = await lerJsonSeExistir(arquivo);
    if (copia === undefined) throw erro;
    todas = z.array(Legislatura).parse(copia);
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.log(
      `::warning::Legislaturas lidas de ${arquivo}, porque a API da Câmara falhou (${motivo}).`,
    );
  }
  return todas
    .filter((l) => l.dataInicio <= hoje)
    .slice(0, quantidade)
    .sort((a, b) => a.id - b.id);
}

/** Todos que exerceram mandato na legislatura, incluindo suplentes. */
export async function buscarDeputadosDaLegislatura(
  idLegislatura: number,
  opcoes: OpcoesHttp = {},
): Promise<DeputadoDaLista[]> {
  const linhas = await buscarTodasAsPaginas(
    `${API}/deputados?idLegislatura=${idLegislatura}&itens=100&ordem=ASC&ordenarPor=nome`,
    opcoes,
  );
  return validarLinhas(
    DeputadoDaLista,
    linhas,
    `deputados da legislatura ${idLegislatura}`,
    0,
  );
}

const DeputadoDoArquivo = z.object({
  uri: z.string(),
  nomeCivil: z.string().nullish(),
  siglaSexo: z.string().nullish(),
});

export interface DadosPessoais {
  nomeCivil?: string;
  sexo?: "F" | "M";
}

/**
 * Nome civil e sexo de todos os deputados, do arquivo em massa
 * `deputados.json` (um arquivo de ~4 MB em vez de uma chamada por deputado).
 * O nome civil serve para a busca e para cruzar com o TSE; o sexo, para
 * escrever "deputada" ou "deputado".
 */
export async function buscarDadosPessoais(
  opcoes: OpcoesHttp = {},
): Promise<Map<number, DadosPessoais>> {
  const json = await buscarJson(
    "https://dadosabertos.camara.leg.br/arquivos/deputados/json/deputados.json",
    opcoes,
  );
  const linhas = validarLinhas(
    DeputadoDoArquivo,
    extrairDados(json, "deputados.json"),
    "deputados.json",
  );
  const dados = new Map<number, DadosPessoais>();
  for (const { uri, nomeCivil, siglaSexo } of linhas) {
    const id = Number(uri.split("/").pop());
    if (!Number.isInteger(id)) continue;
    dados.set(id, {
      nomeCivil: nomeCivil?.trim() || undefined,
      sexo: siglaSexo === "F" || siglaSexo === "M" ? siglaSexo : undefined,
    });
  }
  return dados;
}

/** Entradas, saídas, licenças e trocas de partido de um deputado. */
export async function buscarHistorico(
  idDeputado: number,
  opcoes: OpcoesHttp = {},
): Promise<ItemHistorico[]> {
  const json = await buscarJson(
    `${API}/deputados/${idDeputado}/historico`,
    opcoes,
  );
  return validarLinhas(
    ItemHistorico,
    extrairDados(json, `histórico do deputado ${idDeputado}`),
    `histórico do deputado ${idDeputado}`,
    0,
  );
}
