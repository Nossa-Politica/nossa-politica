import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import deputadosPagina1 from "./__fixtures__/api/deputados-pagina-1.json";
import deputadosUltima from "./__fixtures__/api/deputados-pagina-ultima.json";
import historico from "./__fixtures__/api/historico-204379.json";
import legislaturas from "./__fixtures__/api/legislaturas.json";
import {
  ARQUIVO_LEGISLATURAS,
  buscarDeputadosDaLegislatura,
  buscarHistorico,
  buscarLegislaturas,
} from "./api";

/** Respostas gravadas da API da Câmara, servidas por trecho da URL. */
function apiGravada(rotas: Record<string, unknown>) {
  const chamadas: string[] = [];
  const fetch: typeof globalThis.fetch = async (entrada) => {
    const url = String(entrada);
    chamadas.push(url);
    const rota = Object.keys(rotas).find((trecho) => url.includes(trecho));
    if (!rota) return new Response("", { status: 404 });
    return Response.json(rotas[rota]);
  };
  return { fetch, chamadas };
}

/** Pasta de dados temporária, recriada a cada teste. */
let pastaDados: string;
beforeEach(async () => {
  pastaDados = await mkdtemp(join(tmpdir(), "legislaturas-"));
});
afterEach(async () => {
  await rm(pastaDados, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** API fora do ar: sempre 503, sem esperar entre as tentativas. */
function apiForaDoAr() {
  let chamadas = 0;
  const fetch: typeof globalThis.fetch = async () => {
    chamadas++;
    return new Response("", { status: 503 });
  };
  return {
    opcoes: { fetch, esperar: async () => {} },
    chamadas: () => chamadas,
  };
}

describe("API da Câmara (respostas gravadas)", () => {
  it("lista as legislaturas já iniciadas, da mais antiga para a atual", async () => {
    const { fetch } = apiGravada({ "/legislaturas": legislaturas });
    const resultado = await buscarLegislaturas(2, "2026-10-09", pastaDados, {
      fetch,
    });
    expect(resultado.map((l) => l.id)).toEqual([56, 57]);
    expect(resultado[1]).toMatchObject({
      dataInicio: "2023-02-01",
      dataFim: "2027-01-31",
    });
  });

  it("segue a paginação e para na página vazia depois da última", async () => {
    // A última página ainda traz um link `next` para uma página vazia
    const { fetch, chamadas } = apiGravada({
      "pagina=442": { dados: [], links: [] },
      "pagina=441": deputadosUltima,
      "/deputados?": {
        ...deputadosPagina1,
        links: deputadosPagina1.links.map((l) =>
          l.rel === "next"
            ? { ...l, href: l.href.replace("pagina=2", "pagina=441") }
            : l,
        ),
      },
    });
    const deputados = await buscarDeputadosDaLegislatura(57, { fetch });
    expect(deputados.map((d) => d.nome)).toEqual([
      "Abilio Brunini",
      "Acácio Favacho",
      "Zucco",
      "Zucco",
    ]);
    expect(chamadas).toHaveLength(3);
  });

  it("valida o histórico de um deputado", async () => {
    const { fetch } = apiGravada({ "/historico": historico });
    const itens = await buscarHistorico(204379, { fetch });
    expect(itens).toHaveLength(6);
    expect(
      itens.some((i) => i.descricaoStatus === "Alteração de partido"),
    ).toBe(true);
  });

  it("falha se a API mudar o formato", async () => {
    const { fetch } = apiGravada({
      "/historico": { dados: [{ id: "204379", situacao: 1 }] },
    });
    await expect(buscarHistorico(204379, { fetch })).rejects.toThrow(
      "fora do formato",
    );
  });
});

describe("legislaturas com a API da Câmara fora do ar", () => {
  it("grava a lista na pasta de dados quando a API responde", async () => {
    const { fetch } = apiGravada({ "/legislaturas": legislaturas });
    await buscarLegislaturas(2, "2026-10-09", pastaDados, { fetch });
    const copia = JSON.parse(
      await readFile(join(pastaDados, ARQUIVO_LEGISLATURAS), "utf8"),
    );
    expect(copia.map((l: { id: number }) => l.id)).toContain(57);
  });

  it("usa a cópia da carga anterior e avisa no log", async () => {
    const { fetch } = apiGravada({ "/legislaturas": legislaturas });
    await buscarLegislaturas(2, "2026-10-09", pastaDados, { fetch });

    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const fora = apiForaDoAr();
    const resultado = await buscarLegislaturas(
      2,
      "2026-11-10",
      pastaDados,
      fora.opcoes,
    );

    expect(resultado.map((l) => l.id)).toEqual([56, 57]);
    expect(fora.chamadas()).toBe(8);
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^::warning::Legislaturas lidas de .*HTTP 503/),
    );
  });

  it("aplica a data de hoje também sobre a cópia", async () => {
    await writeFile(
      join(pastaDados, ARQUIVO_LEGISLATURAS),
      JSON.stringify([
        { id: 58, dataInicio: "2027-02-01", dataFim: "2031-01-31" },
        { id: 57, dataInicio: "2023-02-01", dataFim: "2027-01-31" },
        { id: 56, dataInicio: "2019-02-01", dataFim: "2023-01-31" },
      ]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});

    const antes = await buscarLegislaturas(
      2,
      "2027-01-31",
      pastaDados,
      apiForaDoAr().opcoes,
    );
    const depois = await buscarLegislaturas(
      2,
      "2027-02-01",
      pastaDados,
      apiForaDoAr().opcoes,
    );
    expect(antes.map((l) => l.id)).toEqual([56, 57]);
    expect(depois.map((l) => l.id)).toEqual([57, 58]);
  });

  it("lança o erro da API se não houver cópia", async () => {
    await expect(
      buscarLegislaturas(2, "2026-11-10", pastaDados, apiForaDoAr().opcoes),
    ).rejects.toThrow("HTTP 503");
  });

  it("não aceita uma cópia fora do formato", async () => {
    await writeFile(
      join(pastaDados, ARQUIVO_LEGISLATURAS),
      JSON.stringify([{ id: "57" }]),
    );
    await expect(
      buscarLegislaturas(2, "2026-11-10", pastaDados, apiForaDoAr().opcoes),
    ).rejects.toThrow();
  });
});
