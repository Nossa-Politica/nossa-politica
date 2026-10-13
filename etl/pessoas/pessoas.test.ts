import { describe, expect, it } from "vitest";
import type { Parlamentar } from "../comum/saida";
import { montarPessoas, type ParlamentarComCasa } from "./consolidar";

function parlamentar(
  casa: "camara" | "senado",
  dados: Partial<Parlamentar> & { id: number; nome: string },
  legislaturas: Array<{ id: number; uf: string }>,
): ParlamentarComCasa {
  return {
    casa,
    parlamentar: {
      versao: 1,
      slug: "",
      partido: "ABC",
      uf: legislaturas[legislaturas.length - 1].uf,
      urlFoto: "",
      emExercicio: false,
      urlFonte: "",
      atualizadoEm: "",
      ...dados,
      legislaturas: legislaturas.map(
        (l) =>
          ({
            idLegislatura: l.id,
            uf: l.uf,
          }) as Parlamentar["legislaturas"][number],
      ),
    },
  };
}

describe("montarPessoas", () => {
  const pessoas = montarPessoas([
    // Deputado na 56ª que virou senador na 57ª
    parlamentar(
      "camara",
      { id: 178836, nome: "Alan Rick", nomeCivil: "ALAN RICK MIRANDA" },
      [{ id: 56, uf: "AC" }],
    ),
    parlamentar(
      "senado",
      {
        id: 5672,
        nome: "Alan Rick",
        nomeCivil: "Alan Rick Miranda",
        emExercicio: true,
        sexo: "M",
      },
      [{ id: 57, uf: "AC" }],
    ),
    // Homônimos de estados diferentes
    parlamentar(
      "camara",
      { id: 1, nome: "Mariana Carvalho", nomeCivil: "MARIANA A" },
      [{ id: 56, uf: "RO" }],
    ),
    parlamentar(
      "camara",
      { id: 2, nome: "Mariana Carvalho", nomeCivil: "MARIANA B" },
      [{ id: 57, uf: "MA" }],
    ),
    // Mesmo nome civil, mas sem UF em comum: não junta
    parlamentar(
      "camara",
      { id: 3, nome: "José Silva", nomeCivil: "JOSE DA SILVA" },
      [{ id: 57, uf: "SP" }],
    ),
    parlamentar(
      "senado",
      { id: 4, nome: "José Silva", nomeCivil: "JOSE DA SILVA" },
      [{ id: 57, uf: "BA" }],
    ),
  ]);
  const porSlug = new Map(pessoas.map((p) => [p.slug, p]));

  it("junta Câmara e Senado da mesma pessoa, com o mandato atual como principal", () => {
    const alan = porSlug.get("alan-rick");
    expect(alan?.casa).toBe("senado");
    expect(alan?.emExercicio).toBe(true);
    expect(alan?.registros.map((r) => `${r.casa}-${r.id}`)).toEqual([
      "senado-5672",
      "camara-178836",
    ]);
  });

  it("separa homônimos com a UF no endereço", () => {
    expect(porSlug.has("mariana-carvalho-ro")).toBe(true);
    expect(porSlug.has("mariana-carvalho-ma")).toBe(true);
  });

  it("não junta mesmo nome civil de estados diferentes", () => {
    expect(porSlug.has("jose-silva-sp")).toBe(true);
    expect(porSlug.has("jose-silva-ba")).toBe(true);
  });

  it("gera um endereço único por pessoa", () => {
    expect(new Set(pessoas.map((p) => p.slug)).size).toBe(pessoas.length);
    expect(pessoas).toHaveLength(5);
  });
});
