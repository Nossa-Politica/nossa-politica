/**
 * Termos técnicos e sua explicação em linguagem simples. O site mostra o termo
 * simples no texto e o técnico na explicação.
 */
export const GLOSSARIO = {
  cota: {
    termo: "Cota parlamentar",
    explicacao:
      "Dinheiro público que cada parlamentar recebe para despesas do mandato, como passagens, escritório e divulgação. Ele gasta e depois pede o reembolso, apresentando a nota fiscal.",
  },
  mediana: {
    termo: "Mediana",
    explicacao:
      "O valor do meio: metade dos parlamentares fica acima e metade abaixo. Usamos a mediana, e não a média, para que poucos valores muito altos ou muito baixos não distorçam a comparação.",
  },
  primeiroAutor: {
    termo: "Primeiro autor",
    explicacao:
      "Quem assina o projeto em primeiro lugar, normalmente quem o escreveu. Algumas bancadas assinam projetos em grupo, então contar só os de primeiro autor é a comparação mais justa.",
  },
  norma: {
    termo: "Virou lei",
    explicacao:
      "Projeto aprovado e transformado em norma: lei, emenda à Constituição ou decreto legislativo.",
  },
  sessaoDeliberativa: {
    termo: "Sessão deliberativa",
    explicacao:
      "Sessão do Plenário em que há votações. Sessões solenes e reuniões de comissão não entram na conta de presença.",
  },
  votacaoNominal: {
    termo: "Votação nominal",
    explicacao:
      "Votação em que fica registrado como cada parlamentar votou. Nas votações simbólicas, só o resultado é registrado.",
  },
  alinhamentoPartido: {
    termo: "Votou com o partido",
    explicacao:
      "Quantas vezes o voto foi igual ao da maioria dos colegas de partido na mesma votação.",
  },
  alinhamentoGoverno: {
    termo: "Votou com o governo",
    explicacao:
      "Quantas vezes o voto foi igual à orientação do líder do governo. Só entram votações em que o governo orientou Sim ou Não.",
  },
  emenda: {
    termo: "Emenda parlamentar",
    explicacao:
      "Parte do orçamento federal que o parlamentar indica para onde vai: um município, um hospital, uma obra. Empenhado é o valor reservado; pago é o que de fato saiu.",
  },
  emendaPix: {
    termo: "Transferência especial",
    explicacao:
      "Conhecida como emenda Pix: o dinheiro vai direto para o caixa do município ou estado, sem um projeto definido antes.",
  },
  bens: {
    termo: "Bens declarados",
    explicacao:
      "Patrimônio que o candidato declarou à Justiça Eleitoral ao registrar a candidatura. É o valor informado por ele, não uma avaliação de mercado.",
  },
} as const;

export type ChaveGlossario = keyof typeof GLOSSARIO;
