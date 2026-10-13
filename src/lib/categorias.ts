import { removerAcentos } from "@etl/lib/texto";

/*
 * Nomes simples para as categorias de despesa da cota. Câmara e Senado usam
 * nomes oficiais longos ("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE
 * PARLAMENTAR"); o site mostra o simples e mantém o oficial na tabela.
 * A ordem importa: a primeira regra que casar vale.
 */
const REGRAS: Array<[RegExp, string]> = [
  [/PASSAGE(M|NS) AERE|BILHETE AEREO/, "Passagens aéreas"],
  [/PASSAGENS AEREAS, AQUATICAS/, "Passagens"],
  [/PASSAGENS TERRESTRES/, "Passagens de ônibus e barco"],
  [/ESCRITORIO|IMOVEIS PARA ESCRITORIO/, "Escritório"],
  [/MATERIAL DE CONSUMO/, "Material de escritório"],
  [/DIVULGACAO/, "Divulgação do mandato"],
  // Antes de "combustível": a categoria do Senado junta várias despesas
  [/LOCOMOCAO, HOSPEDAGEM/, "Transporte, hospedagem e alimentação"],
  [/COMBUSTIVE/, "Combustível"],
  [/ALIMENTACAO/, "Alimentação"],
  [/HOSPEDAGEM/, "Hospedagem"],
  [/VEICULOS AUTOMOTORES/, "Aluguel de carros"],
  [/AERONAVES/, "Aluguel de aviões"],
  [/EMBARCACOES/, "Aluguel de barcos"],
  [/SEGURANCA/, "Segurança"],
  [/CONSULTORIA/, "Consultorias e pesquisas"],
  [/TELEFONIA/, "Telefone"],
  [/TAXI|PEDAGIO/, "Táxi, pedágio e estacionamento"],
  [/POSTAIS/, "Correios"],
  [/ASSINATURA DE PUBLICACOES/, "Assinaturas"],
  [/TOKENS|CERTIFICADOS DIGITAIS/, "Certificado digital"],
  [/AUXILIO-MORADIA/, "Auxílio-moradia"],
  [/CURSO, PALESTRA/, "Cursos e eventos"],
];

export function categoriaSimples(oficial: string): string {
  const chave = removerAcentos(oficial).toUpperCase();
  for (const [regra, simples] of REGRAS) if (regra.test(chave)) return simples;
  const texto = oficial
    .trim()
    .replace(/[.,]+$/, "")
    .toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Soma categorias que têm o mesmo nome simples (as três de passagem aérea, por exemplo). */
export function agruparCategorias(
  categorias: Array<{ categoria: string; valor: number }>,
): Array<{ nome: string; valor: number; oficiais: string[] }> {
  const grupos = new Map<string, { valor: number; oficiais: string[] }>();
  for (const { categoria, valor } of categorias) {
    const nome = categoriaSimples(categoria);
    const grupo = grupos.get(nome) ?? { valor: 0, oficiais: [] };
    grupo.valor += valor;
    grupo.oficiais.push(categoria);
    grupos.set(nome, grupo);
  }
  return [...grupos]
    .map(([nome, g]) => ({ nome, ...g }))
    .filter((g) => g.valor > 0)
    .sort((a, b) => b.valor - a.valor);
}
