import { describe, expect, it } from "vitest";
import { contarHashtags, ErroDaMeta, entrarNaMeta } from "./meta";

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

const pagina = {
  "GET me": {
    id: "10",
    name: "Nossa Política",
    instagram_business_account: { id: "20", username: "_nossapolitica" },
  },
};

it("conta hashtags", () => {
  expect(contarHashtags("Leia #política e #Câmara, não #")).toBe(2);
});

describe("Facebook", () => {
  it("publica texto com o link na Página", async () => {
    const { buscar, chamadas } = servidorFalso({
      ...pagina,
      "POST 10/feed": { id: "10_99" },
      "GET 10_99": {
        id: "10_99",
        permalink_url: "https://www.facebook.com/nossapolitica/posts/99",
      },
    });
    const { facebook } = await entrarNaMeta({ token: "tok", fetch: buscar });
    const publicado = await facebook.publicar({
      texto: "Texto",
      link: "https://site/blog/x",
    });
    expect(publicado).toEqual({
      id: "10_99",
      url: "https://www.facebook.com/nossapolitica/posts/99",
    });
    const envio = chamadas.find((c) => c.rota === "POST 10/feed");
    expect(envio?.params.get("message")).toBe("Texto");
    expect(envio?.params.get("link")).toBe("https://site/blog/x");
  });

  it("encontra um post da Página com o mesmo link", async () => {
    const { buscar } = servidorFalso({
      ...pagina,
      "GET 10/posts": {
        data: [
          { id: "10_1", attachments: { data: [{ url: "https://l.fb/x" }] } },
          {
            id: "10_2",
            permalink_url: "https://fb/p/2",
            attachments: {
              data: [{ unshimmed_url: "https://site/blog/x/" }],
            },
          },
        ],
      },
    });
    const { facebook } = await entrarNaMeta({ token: "tok", fetch: buscar });
    expect(await facebook.publicacaoDoLink("https://site/blog/x")).toEqual({
      id: "10_2",
      url: "https://fb/p/2",
    });
    expect(await facebook.publicacaoDoLink("https://site/blog/y")).toBe(
      undefined,
    );
  });
});

describe("Instagram", () => {
  it("cria o contêiner com a imagem, espera e publica", async () => {
    let consultas = 0;
    const { buscar, chamadas } = servidorFalso({
      ...pagina,
      "POST 20/media": { id: "c1" },
      "GET c1": () => ({
        status_code: ++consultas < 3 ? "IN_PROGRESS" : "FINISHED",
      }),
      "POST 20/media_publish": { id: "m1" },
      "GET m1": { id: "m1", permalink: "https://www.instagram.com/p/abc/" },
    });
    const { instagram } = await entrarNaMeta({
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

  it("encontra uma mídia com a mesma legenda", async () => {
    const { buscar } = servidorFalso({
      ...pagina,
      "GET 20/media": {
        data: [
          { id: "1", caption: "Outra", permalink: "https://ig/p/1" },
          { id: "2", caption: "Legenda ", permalink: "https://ig/p/2" },
        ],
      },
    });
    const { instagram } = await entrarNaMeta({ token: "tok", fetch: buscar });
    expect(await instagram.publicacaoDaLegenda("Legenda")).toEqual({
      id: "2",
      url: "https://ig/p/2",
    });
  });

  it("explica quando a Página não tem Instagram vinculado", async () => {
    const { buscar } = servidorFalso({
      "GET me": { id: "10", name: "Nossa Política" },
    });
    const { instagram } = await entrarNaMeta({ token: "tok", fetch: buscar });
    await expect(
      instagram.publicar({ legenda: "x", imagem: "https://site/x.jpg" }),
    ).rejects.toThrow("não tem uma conta profissional do Instagram");
  });

  it("recusa legenda com hashtags demais antes de chamar a API", async () => {
    const { buscar, chamadas } = servidorFalso(pagina);
    const { instagram } = await entrarNaMeta({ token: "tok", fetch: buscar });
    const legenda = Array.from({ length: 31 }, (_, i) => `#t${i}a`).join(" ");
    await expect(
      instagram.publicar({ legenda, imagem: "https://site/x.jpg" }),
    ).rejects.toThrow("30 hashtags");
    expect(chamadas).toHaveLength(1);
  });
});

it("não põe o token na mensagem de erro", async () => {
  const { buscar } = servidorFalso({});
  const erro = await entrarNaMeta({ token: "segredo", fetch: buscar }).catch(
    (e) => e,
  );
  expect(erro).toBeInstanceOf(ErroDaMeta);
  expect(String(erro.message)).not.toContain("segredo");
});
