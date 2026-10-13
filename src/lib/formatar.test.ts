import { describe, expect, it } from "vitest";
import { agruparCategorias, categoriaSimples } from "./categorias";
import {
  cargo,
  comparar,
  formatarMes,
  formatarMoedaCurta,
  formatarValorEixo,
  fraseContagem,
  frasePontos,
  fraseRelativa,
} from "./formatar";

describe("frases de comparação com a mediana", () => {
  it("diz a diferença relativa sem adjetivos", () => {
    expect(fraseRelativa(comparar(122.7, 100))).toBe("22,7% acima da mediana");
    expect(fraseRelativa(comparar(77.3, 100))).toBe("22,7% abaixo da mediana");
    expect(fraseRelativa(comparar(100.4, 100))).toBe("igual à mediana");
  });

  it("usa pontos para percentuais", () => {
    expect(frasePontos(comparar(91, 89.5))).toBe("1,5 pontos acima da mediana");
    expect(frasePontos(comparar(88.5, 89.5))).toBe("1 ponto abaixo da mediana");
  });

  it("usa a diferença em unidades para contagens", () => {
    expect(fraseContagem(48, 20)).toBe("28 a mais que a mediana");
    expect(fraseContagem(0, 0.5)).toBe("0,5 a menos que a mediana");
    expect(fraseContagem(20, 20)).toBe("igual à mediana");
  });
});

describe("formatação", () => {
  it("abrevia valores", () => {
    expect(formatarMoedaCurta(104_966_727)).toBe("R$ 105 mi");
    expect(formatarMoedaCurta(1_200)).toBe("R$ 1,2 mil");
    expect(formatarValorEixo(60_000)).toBe("60 mil");
    expect(formatarMes("2025-03")).toBe("mar/25");
  });

  it("concorda o cargo com o sexo", () => {
    expect(cargo("camara", "F")).toBe("Deputada federal");
    expect(cargo("senado", "M")).toBe("Senador");
    expect(cargo("senado")).toBe("Senador");
  });
});

describe("categorias de despesa", () => {
  it("troca o nome oficial pelo simples", () => {
    expect(
      categoriaSimples(
        "MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR",
      ),
    ).toBe("Escritório");
    expect(
      categoriaSimples(
        "Locomoção, hospedagem, alimentação, combustíveis e lubrificantes",
      ),
    ).toBe("Transporte, hospedagem e alimentação");
    expect(categoriaSimples("ALGO NOVO.")).toBe("Algo novo");
  });

  it("soma categorias com o mesmo nome simples", () => {
    expect(
      agruparCategorias([
        { categoria: "PASSAGEM AÉREA - SIGEPA", valor: 100 },
        { categoria: "PASSAGEM AÉREA - REEMBOLSO", valor: 50 },
        { categoria: "TELEFONIA", valor: 200 },
        { categoria: "SERVIÇOS POSTAIS", valor: -5 },
      ]),
    ).toEqual([
      { nome: "Telefone", valor: 200, oficiais: ["TELEFONIA"] },
      {
        nome: "Passagens aéreas",
        valor: 150,
        oficiais: ["PASSAGEM AÉREA - SIGEPA", "PASSAGEM AÉREA - REEMBOLSO"],
      },
    ]);
  });
});
