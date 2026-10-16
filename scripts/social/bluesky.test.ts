import { describe, expect, it } from "vitest";
import {
  contarGrafemas,
  ErroDoBluesky,
  enderecoDoPost,
  entrarNoBluesky,
  facetas,
} from "./bluesky";

describe("facetas", () => {
  it("marca links e hashtags com posições em bytes", () => {
    const texto = "Política é dado: https://exemplo.org/a. #Câmara e #2026x";
    const resultado = facetas(texto);
    const trecho = (i: number) => {
      const bytes = new TextEncoder().encode(texto);
      const { byteStart, byteEnd } = resultado[i].index;
      return new TextDecoder().decode(bytes.slice(byteStart, byteEnd));
    };
    expect(resultado).toHaveLength(3);
    expect(trecho(0)).toBe("https://exemplo.org/a");
    expect(trecho(1)).toBe("#Câmara");
    expect(resultado[1].features[0]).toEqual({
      $type: "app.bsky.richtext.facet#tag",
      tag: "Câmara",
    });
    expect(trecho(2)).toBe("#2026x");
  });

  it("não marca números soltos como hashtag", () => {
    expect(facetas("Item #1 da pauta")).toEqual([]);
  });
});

it("conta grafemas, não unidades de código", () => {
  expect(contarGrafemas("🇧🇷 ação")).toBe(6);
});

it("monta o endereço público do post", () => {
  expect(
    enderecoDoPost(
      "at://did:plc:abc/app.bsky.feed.post/3kxyz",
      "nossapolitica.bsky.social",
    ),
  ).toBe("https://bsky.app/profile/nossapolitica.bsky.social/post/3kxyz");
});

/** Servidor falso: responde cada método XRPC e guarda as chamadas. */
function servidorFalso(respostas: Record<string, unknown>) {
  const chamadas: Array<{ metodo: string; init?: RequestInit }> = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    const metodo = new URL(url).pathname.replace("/xrpc/", "");
    chamadas.push({ metodo, init });
    const corpo = respostas[metodo];
    if (corpo === undefined)
      return new Response('{"error":"NotFound"}', { status: 404 });
    return new Response(JSON.stringify(corpo), { status: 200 });
  }) as typeof fetch;
  return { buscar, chamadas };
}

const sessao = { accessJwt: "token", did: "did:plc:abc" };

describe("entrarNoBluesky", () => {
  it("envia a imagem e publica o post com o cartão do link", async () => {
    const blob = {
      $type: "blob",
      ref: { $link: "bafy" },
      mimeType: "image/png",
      size: 3,
    };
    const { buscar, chamadas } = servidorFalso({
      "com.atproto.server.createSession": sessao,
      "com.atproto.repo.uploadBlob": { blob },
      "com.atproto.repo.createRecord": {
        uri: "at://did:plc:abc/app.bsky.feed.post/3k",
        cid: "cid",
      },
    });
    const conta = await entrarNoBluesky({
      handle: "teste.bsky.social",
      senhaDeApp: "senha",
      fetch: buscar,
    });
    const uri = await conta.publicar({
      texto: "Texto do post",
      link: "https://site/blog/x",
      titulo: "Título",
      descricao: "Resumo",
      imagem: new Uint8Array([1, 2, 3]),
    });

    expect(uri).toBe("at://did:plc:abc/app.bsky.feed.post/3k");
    expect(chamadas.map((c) => c.metodo)).toEqual([
      "com.atproto.server.createSession",
      "com.atproto.repo.uploadBlob",
      "com.atproto.repo.createRecord",
    ]);
    const registro = JSON.parse(String(chamadas[2].init?.body));
    expect(registro.repo).toBe("did:plc:abc");
    expect(registro.record.text).toBe("Texto do post");
    expect(registro.record.embed.external).toEqual({
      uri: "https://site/blog/x",
      title: "Título",
      description: "Resumo",
      thumb: blob,
    });
    expect(new Headers(chamadas[2].init?.headers).get("Authorization")).toBe(
      "Bearer token",
    );
  });

  it("encontra um post que já tem o cartão do link", async () => {
    const { buscar } = servidorFalso({
      "com.atproto.server.createSession": sessao,
      "com.atproto.repo.listRecords": {
        records: [
          { uri: "at://a/app.bsky.feed.post/1", value: { text: "sem link" } },
          {
            uri: "at://a/app.bsky.feed.post/2",
            value: { embed: { external: { uri: "https://site/blog/x" } } },
          },
        ],
      },
    });
    const conta = await entrarNoBluesky({
      handle: "teste",
      senhaDeApp: "senha",
      fetch: buscar,
    });
    expect(await conta.publicacaoDoLink("https://site/blog/x")).toBe(
      "at://a/app.bsky.feed.post/2",
    );
    expect(await conta.publicacaoDoLink("https://site/blog/y")).toBeUndefined();
  });

  it("falha com uma mensagem clara quando o login é recusado", async () => {
    const { buscar } = servidorFalso({});
    await expect(
      entrarNoBluesky({ handle: "teste", senhaDeApp: "senha", fetch: buscar }),
    ).rejects.toThrow(ErroDoBluesky);
  });

  it("recusa texto longo demais antes de chamar a API", async () => {
    const { buscar, chamadas } = servidorFalso({
      "com.atproto.server.createSession": sessao,
    });
    const conta = await entrarNoBluesky({
      handle: "teste",
      senhaDeApp: "senha",
      fetch: buscar,
    });
    await expect(
      conta.publicar({
        texto: "a".repeat(301),
        link: "https://site",
        titulo: "",
        descricao: "",
        imagem: new Uint8Array(),
      }),
    ).rejects.toThrow("300");
    expect(chamadas).toHaveLength(1);
  });
});
