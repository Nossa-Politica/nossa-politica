import { describe, expect, it } from "vitest";
import {
  contarCaracteres,
  ErroDoThreads,
  entrarNoThreads,
  renovarToken,
} from "./threads";

it("conta emojis pelo tamanho em bytes e letras como um caractere", () => {
  expect(contarCaracteres("ação")).toBe(4);
  expect(contarCaracteres("🇧🇷")).toBe(8);
  expect(contarCaracteres("ok 👍")).toBe(7);
});

type Rota = (params: URLSearchParams) => unknown;

/** Servidor falso da Graph API: "MÉTODO caminho" → resposta. */
function servidorFalso(rotas: Record<string, unknown | Rota>) {
  const chamadas: Array<{ rota: string; params: URLSearchParams }> = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const metodo = init?.method ?? "GET";
    const params =
      metodo === "POST"
        ? new URLSearchParams(String(init?.body))
        : u.searchParams;
    const rota = `${metodo} ${u.pathname.replace("/v1.0/", "")}`;
    chamadas.push({ rota, params });
    const resposta = rotas[rota];
    if (resposta === undefined)
      return new Response('{"error":{"message":"não existe"}}', {
        status: 400,
      });
    const corpo =
      typeof resposta === "function" ? (resposta as Rota)(params) : resposta;
    return new Response(JSON.stringify(corpo), { status: 200 });
  }) as typeof fetch;
  return { buscar, chamadas };
}

const eu = { "GET me": { id: "123", username: "nossapolitica" } };

describe("entrarNoThreads", () => {
  it("cria o contêiner, espera ficar pronto e publica", async () => {
    let consultas = 0;
    const { buscar, chamadas } = servidorFalso({
      ...eu,
      "POST 123/threads": { id: "c1" },
      "GET c1": () => ({
        status: ++consultas < 2 ? "IN_PROGRESS" : "FINISHED",
      }),
      "POST 123/threads_publish": { id: "m1" },
      "GET m1": {
        id: "m1",
        permalink: "https://www.threads.com/@nossapolitica/post/abc",
      },
    });
    const conta = await entrarNoThreads({
      token: "tok",
      fetch: buscar,
      esperaMs: 0,
    });
    const publicado = await conta.publicar({
      texto: "Texto do post",
      link: "https://site/blog/x",
    });

    expect(publicado).toEqual({
      id: "m1",
      url: "https://www.threads.com/@nossapolitica/post/abc",
    });
    const criacao = chamadas.find((c) => c.rota === "POST 123/threads");
    expect(Object.fromEntries(criacao?.params ?? [])).toEqual({
      media_type: "TEXT",
      text: "Texto do post",
      link_attachment: "https://site/blog/x",
      access_token: "tok",
    });
    expect(
      chamadas
        .find((c) => c.rota === "POST 123/threads_publish")
        ?.params.get("creation_id"),
    ).toBe("c1");
    expect(consultas).toBe(2);
  });

  it("para com erro quando o contêiner falha", async () => {
    const { buscar } = servidorFalso({
      ...eu,
      "POST 123/threads": { id: "c1" },
      "GET c1": { status: "ERROR", error_message: "link inválido" },
    });
    const conta = await entrarNoThreads({
      token: "tok",
      fetch: buscar,
      esperaMs: 0,
    });
    await expect(
      conta.publicar({ texto: "x", link: "https://site" }),
    ).rejects.toThrow("link inválido");
  });

  it("encontra um post que já tem o link, com ou sem barra no fim", async () => {
    const { buscar } = servidorFalso({
      ...eu,
      "GET me/threads": {
        data: [
          { id: "1", permalink: "https://threads/p/1" },
          {
            id: "2",
            permalink: "https://threads/p/2",
            link_attachment_url: "https://site/blog/x/",
          },
        ],
      },
    });
    const conta = await entrarNoThreads({ token: "tok", fetch: buscar });
    expect(await conta.publicacaoDoLink("https://site/blog/x")).toEqual({
      id: "2",
      url: "https://threads/p/2",
    });
    expect(await conta.publicacaoDoLink("https://site/blog/y")).toBeUndefined();
  });

  it("recusa texto longo demais antes de chamar a API", async () => {
    const { buscar, chamadas } = servidorFalso(eu);
    const conta = await entrarNoThreads({ token: "tok", fetch: buscar });
    await expect(
      conta.publicar({ texto: "a".repeat(501), link: "https://site" }),
    ).rejects.toThrow("500");
    expect(chamadas).toHaveLength(1);
  });

  it("não põe o token na mensagem de erro", async () => {
    const { buscar } = servidorFalso({});
    const erro = await entrarNoThreads({
      token: "segredo",
      fetch: buscar,
    }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDoThreads);
    expect(String(erro.message)).not.toContain("segredo");
  });
});

it("renova o token", async () => {
  const buscar = (async (url: string) => {
    const u = new URL(url);
    expect(u.pathname).toBe("/refresh_access_token");
    expect(u.searchParams.get("grant_type")).toBe("th_refresh_token");
    return new Response(
      JSON.stringify({
        access_token: "novo",
        token_type: "bearer",
        expires_in: 5184000,
      }),
    );
  }) as typeof fetch;
  expect(await renovarToken("velho", buscar)).toEqual({
    access_token: "novo",
    expires_in: 5184000,
  });
});
