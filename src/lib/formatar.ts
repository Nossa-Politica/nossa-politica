/*
 * Formatação de números e frases em português simples. As frases de
 * comparação viram o título dos blocos ("Gastou 12% acima da mediana"),
 * sempre sem adjetivos: o número diz o que é, sem julgar.
 */

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export const formatarMoeda = (valor: number) => moeda.format(valor);
export const formatarInteiro = (valor: number) => inteiro.format(valor);
export const formatarPercentual = (valor: number) =>
  `${decimal.format(valor)}%`;

/** R$ 1,2 mil · R$ 3,4 mi · R$ 1,1 bi */
export function formatarMoedaCurta(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1e9) return `R$ ${decimal.format(valor / 1e9)} bi`;
  if (abs >= 1e6) return `R$ ${decimal.format(valor / 1e6)} mi`;
  if (abs >= 1e3) return `R$ ${decimal.format(valor / 1e3)} mil`;
  return moeda.format(valor);
}

/** Para eixos de gráfico, sem "R$" (cabe numa linha): "60 mil", "38 mi" */
export function formatarValorEixo(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1e9) return `${decimal.format(valor / 1e9)} bi`;
  if (abs >= 1e6) return `${decimal.format(valor / 1e6)} mi`;
  if (abs >= 1e3) return `${decimal.format(valor / 1e3)} mil`;
  return inteiro.format(valor);
}

/** "2026-10-09" → "09/10/2026" */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2025-03" → "mar/25" */
export function formatarMes(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${ano.slice(2)}`;
}

export type Direcao = "acima" | "abaixo" | "igual";

export interface Comparacao {
  direcao: Direcao;
  /** Diferença relativa em %, sempre positiva (para valores como gasto e projetos) */
  diferencaRelativa: number;
  /** Diferença absoluta (para percentuais, em pontos percentuais) */
  diferencaAbsoluta: number;
}

/** Compara um valor com a mediana; diferenças menores que 1% contam como igual. */
export function comparar(valor: number, mediana: number): Comparacao {
  const diferencaAbsoluta = valor - mediana;
  const diferencaRelativa =
    mediana === 0
      ? valor === 0
        ? 0
        : 100
      : (diferencaAbsoluta / mediana) * 100;
  const direcao: Direcao =
    Math.abs(diferencaRelativa) < 1
      ? "igual"
      : diferencaAbsoluta > 0
        ? "acima"
        : "abaixo";
  return {
    direcao,
    diferencaRelativa: Math.abs(diferencaRelativa),
    diferencaAbsoluta: Math.abs(diferencaAbsoluta),
  };
}

/** "12% acima da mediana" · "igual à mediana" */
export function fraseRelativa(c: Comparacao): string {
  if (c.direcao === "igual") return "igual à mediana";
  return `${decimal.format(c.diferencaRelativa)}% ${c.direcao} da mediana`;
}

/** Para percentuais: "2,1 pontos acima da mediana" */
export function frasePontos(c: Comparacao): string {
  if (c.direcao === "igual" || c.diferencaAbsoluta < 0.1)
    return "igual à mediana";
  const pontos = decimal.format(c.diferencaAbsoluta);
  return `${pontos} ${c.diferencaAbsoluta === 1 ? "ponto" : "pontos"} ${c.direcao} da mediana`;
}

/** Para contagens: "5 a mais que a mediana" */
export function fraseContagem(valor: number, mediana: number): string {
  const diferenca = valor - mediana;
  if (Math.abs(diferenca) < 0.5) return "igual à mediana";
  const n = decimal.format(Math.abs(diferenca));
  return `${n} a ${diferenca > 0 ? "mais" : "menos"} que a mediana`;
}

export type CasaLegislativa = "camara" | "senado";

/** "Deputada federal", "Senador" */
export function cargo(casa: CasaLegislativa, sexo?: "F" | "M"): string {
  if (casa === "camara")
    return sexo === "F" ? "Deputada federal" : "Deputado federal";
  return sexo === "F" ? "Senadora" : "Senador";
}

/** "deputados", "senadores" (para "mediana dos deputados") */
export function colegas(casa: CasaLegislativa): string {
  return casa === "camara" ? "deputados" : "senadores";
}

export const NOME_DA_CASA: Record<CasaLegislativa, string> = {
  camara: "Câmara dos Deputados",
  senado: "Senado Federal",
};

const ANOS_LEGISLATURA: Record<number, string> = {
  55: "2015–2019",
  56: "2019–2023",
  57: "2023–2027",
  58: "2027–2031",
};

/** "57ª legislatura (2023–2027)" */
export function nomeLegislatura(id: number): string {
  const anos = ANOS_LEGISLATURA[id];
  return anos ? `${id}ª legislatura (${anos})` : `${id}ª legislatura`;
}

/** "do Acre", "da Bahia", "de São Paulo" */
const ARTIGO: Record<string, "do" | "da" | "de"> = {
  AC: "do",
  AL: "de",
  AP: "do",
  AM: "do",
  BA: "da",
  CE: "do",
  DF: "do",
  ES: "do",
  GO: "de",
  MA: "do",
  MT: "de",
  MS: "de",
  MG: "de",
  PA: "do",
  PB: "da",
  PR: "do",
  PE: "de",
  PI: "do",
  RJ: "do",
  RN: "do",
  RS: "do",
  RO: "de",
  RR: "de",
  SC: "de",
  SP: "de",
  SE: "de",
  TO: "do",
};
export const deUf = (uf: string) => `${ARTIGO[uf] ?? "de"} ${UFS[uf] ?? uf}`;
/** "para o Acre", "para a Bahia", "para São Paulo" */
export const paraUf = (uf: string) => {
  const a = ARTIGO[uf];
  return `para ${a === "do" ? "o " : a === "da" ? "a " : ""}${UFS[uf] ?? uf}`;
};

export const UFS: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};
