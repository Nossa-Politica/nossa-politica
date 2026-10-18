import { describe, expect, it } from "vitest";
import {
  contarHashtags,
  ErroDoInstagram,
  entrarNoInstagram,
  renovarToken,
} from "./instagram";

type Rota = (params: URLSearchParams) => unknown;

/** Servidor falso da API do Instagram: "MÉTODO caminho" → resposta. */
function servidorFalso(rotas: Record<string, unknown | Rota>) {
  const chamadas: Array<{ rota: string; params: URLSearchParams }> = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const metodo = init?.method ?? "GET";
    const params =
      metodo === "POST"
        ? new URLSearchParams(String(init?.body))
        : u.searchParams;
    const rota = `${metodo} ${u.pathname.replace(/^\/v[\d.]+\//, "")}`;
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

const conta = { "GET me": { user_id: "20", username: "_nossapolitica" } };

it("conta hashtags", () => {
  expect(contarHashtags("Leia #política e #Câmara, não #")).toBe(2);
});

describe("entrarNoInstagram", () => {
  it("cria o contêiner com a imagem, espera e publica", async () => {
    let consultas = 0;
    const { buscar, chamadas } = servidorFalso({
      ...conta,
      "POST 20/media": { id: "c1" },
      "GET c1": () => ({
        status_code: ++consultas < 3 ? "IN_PROGRESS" : "FINISHED",
      }),
      "POST 20/media_publish": { id: "m1" },
      "GET m1": { id: "m1", permalink: "https://www.instagram.com/p/abc/" },
    });
    const instagram = await entrarNoInstagram({
      token: "tok",
      fetch: buscar,
      esperaMs: 0,
    });
    const publicado = await instagram.publicar({
      legenda: "Legenda. Link na bio.",
      imagem: "https://site/og/instagram/x.jpg",
    });
    expect(publicado).toEqual({
      id: "m1",
      url: "https://www.instagram.com/p/abc/",
    });
    const criacao = chamadas.find((c) => c.rota === "POST 20/media");
    expect(criacao?.params.get("image_url")).toBe(
      "https://site/og/instagram/x.jpg",
    );
    expect(criacao?.params.get("caption")).toBe("Legenda. Link na bio.");
    expect(consultas).toBe(3);
  });

  it("para com erro quando o contêiner falha", async () => {
    const { buscar } = servidorFalso({
      ...conta,
      "POST 20/media": { id: "c1" },
      "GET c1": { status_code: "ERROR" },
    });
    const instagram = await entrarNoInstagram({
      token: "tok",
      fetch: buscar,
      esperaMs: 0,
    });
    await expect(
      instagram.publicar({ legenda: "x", imagem: "https://site/x.jpg" }),
    ).rejects.toThrow("ERROR");
  });

  it("encontra uma mídia com a mesma legenda", async () => {
    const { buscar } = servidorFalso({
      ...conta,
      "GET 20/media": {
        data: [
          { id: "1", caption: "Outra", permalink: "https://ig/p/1" },
          { id: "2", caption: "Legenda ", permalink: "https://ig/p/2" },
        ],
      },
    });
    const instagram = await entrarNoInstagram({ token: "tok", fetch: buscar });
    expect(await instagram.publicacaoDaLegenda("Legenda")).toEqual({
      id: "2",
      url: "https://ig/p/2",
    });
    expect(await instagram.publicacaoDaLegenda("Nova")).toBeUndefined();
  });

  it("recusa legenda com hashtags demais antes de chamar a API", async () => {
    const { buscar, chamadas } = servidorFalso(conta);
    const instagram = await entrarNoInstagram({ token: "tok", fetch: buscar });
    const legenda = Array.from({ length: 31 }, (_, i) => `#t${i}a`).join(" ");
    await expect(
      instagram.publicar({ legenda, imagem: "https://site/x.jpg" }),
    ).rejects.toThrow("30 hashtags");
    expect(chamadas).toHaveLength(1);
  });

  it("não põe o token na mensagem de erro", async () => {
    const { buscar } = servidorFalso({});
    const erro = await entrarNoInstagram({
      token: "segredo",
      fetch: buscar,
    }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDoInstagram);
    expect(String(erro.message)).not.toContain("segredo");
  });
});

it("renova o token", async () => {
  const buscar = (async (url: string) => {
    const u = new URL(url);
    expect(u.pathname).toBe("/refresh_access_token");
    expect(u.searchParams.get("grant_type")).toBe("ig_refresh_token");
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
