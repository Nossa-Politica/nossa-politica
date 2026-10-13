/**
 * Formato compacto do índice de busca, servido em /api/busca e carregado no
 * navegador só quando a pessoa começa a buscar (~1.100 nomes, poucas dezenas
 * de KB compactados).
 */
export interface ItemBusca {
  /** slug */
  s: string;
  /** nome */
  n: string;
  /** outros nomes e nome civil, para achar também por eles */
  o: string;
  /** partido */
  p: string;
  /** UF */
  u: string;
  /** cargo ("Deputada federal", "Ex-senador"...) */
  c: string;
  /** em exercício */
  e: boolean;
  /** foto */
  f: string;
}

/** Sem acento e minúsculo: "João" é achado por "joao". */
export function normalizarTermo(termo: string): string {
  return termo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
