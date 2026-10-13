/**
 * Resumo de cada pessoa no mandato mais recente, servido em /api/indicadores
 * e usado pelas páginas Comparar e Explorar (no navegador).
 */
export interface ResumoPessoa {
  slug: string;
  nome: string;
  foto: string;
  /** "Deputada federal", "Ex-senador"… */
  cargo: string;
  casa: "camara" | "senado";
  partido: string;
  uf: string;
  emExercicio: boolean;
  legislatura: number;
  presenca: number | null;
  primeiroAutor: number;
  viraramNorma: number;
  gastoMensal: number | null;
  comPartido: number | null;
  comGoverno: number | null;
  /** Emendas individuais empenhadas desde 2020 */
  emendas: number | null;
}

export interface MedianasResumo {
  presenca: number | null;
  primeiroAutor: number | null;
  viraramNorma: number | null;
  gastoMensal: number | null;
}

export interface Indicadores {
  atualizadoEm?: string;
  /** Medianas da legislatura atual de cada casa */
  medianas: Record<"camara" | "senado", MedianasResumo>;
  pessoas: ResumoPessoa[];
}

export type ChaveIndicador =
  | "presenca"
  | "primeiroAutor"
  | "viraramNorma"
  | "gastoMensal"
  | "comPartido"
  | "comGoverno"
  | "emendas";

export const INDICADORES: Record<
  ChaveIndicador,
  {
    rotulo: string;
    formato: "percentual" | "inteiro" | "moeda" | "moedaCurta";
    explicacao: string;
  }
> = {
  presenca: {
    rotulo: "Presença",
    formato: "percentual",
    explicacao: "Câmara: sessões com votação. Senado: votações nominais.",
  },
  primeiroAutor: {
    rotulo: "Projetos como primeiro autor",
    formato: "inteiro",
    explicacao:
      "Projetos de lei, de lei complementar, de emenda à Constituição e de decreto.",
  },
  viraramNorma: {
    rotulo: "Projetos que viraram lei",
    formato: "inteiro",
    explicacao: "Inclui coautorias.",
  },
  gastoMensal: {
    rotulo: "Gasto da cota por mês",
    formato: "moeda",
    explicacao:
      "O limite da cota varia por estado; compare dentro do mesmo estado.",
  },
  comPartido: {
    rotulo: "Votou com o partido",
    formato: "percentual",
    explicacao: "Voto igual ao da maioria dos colegas de partido.",
  },
  comGoverno: {
    rotulo: "Votou com o governo",
    formato: "percentual",
    explicacao: "Voto igual à orientação do líder do governo.",
  },
  emendas: {
    rotulo: "Emendas indicadas",
    formato: "moedaCurta",
    explicacao:
      "Emendas individuais empenhadas desde 2020, somando todos os mandatos.",
  },
};
