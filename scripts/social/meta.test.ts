import { describe, expect, it } from "vitest";
import { ErroDaMeta, entrarNaMeta } from "./meta";

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

const pagina = { "GET me": { id: "10", name: "Nossa Política" } };

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

it("não põe o token na mensagem de erro", async () => {
  const { buscar } = servidorFalso({});
  const erro = await entrarNaMeta({ token: "segredo", fetch: buscar }).catch(
    (e) => e,
  );
  expect(erro).toBeInstanceOf(ErroDaMeta);
  expect(String(erro.message)).not.toContain("segredo");
});
