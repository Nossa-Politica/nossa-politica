import { z } from "zod";

/*
 * Cliente mínimo da API oficial do Bluesky (AT Protocol, via XRPC). Entra com
 * uma senha de app (nunca a senha da conta) e publica um texto com o cartão do
 * link: título, resumo e imagem, como aparece quando alguém cola o endereço.
 */

/** Limite do Bluesky para a imagem do cartão do link. */
export const LIMITE_DA_IMAGEM = 1_000_000;
/** Limite do Bluesky para o texto (em grafemas). */
export const LIMITE_DO_TEXTO = 300;

const Sessao = z.object({ accessJwt: z.string(), did: z.string() });

const BlobEnviado = z.object({
  blob: z.looseObject({ mimeType: z.string(), size: z.number() }),
});

const RegistroCriado = z.object({ uri: z.string(), cid: z.string() });

const ListaDePosts = z.object({
  cursor: z.string().optional(),
  records: z.array(
    z.object({
      uri: z.string(),
      value: z.looseObject({
        embed: z
          .looseObject({
            external: z.looseObject({ uri: z.string() }).optional(),
          })
          .optional(),
      }),
    }),
  ),
});

type Faceta = {
  index: { byteStart: number; byteEnd: number };
  features: Array<
    | { $type: "app.bsky.richtext.facet#link"; uri: string }
    | { $type: "app.bsky.richtext.facet#tag"; tag: string }
  >;
};

/**
 * Links e hashtags do texto viram "facetas" (é assim que o Bluesky os torna
 * clicáveis). As posições são em bytes UTF-8, não em caracteres.
 */
export function facetas(texto: string): Faceta[] {
  const bytes = new TextEncoder();
  const posicao = (indice: number) =>
    bytes.encode(texto.slice(0, indice)).length;
  const resultado: Faceta[] = [];

  for (const m of texto.matchAll(/https?:\/\/[^\s]+[^\s.,;:!?)"']/gu)) {
    resultado.push({
      index: {
        byteStart: posicao(m.index),
        byteEnd: posicao(m.index + m[0].length),
      },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }],
    });
  }
  for (const m of texto.matchAll(
    /(^|\s)#([\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu,
  )) {
    const inicio = m.index + m[1].length;
    resultado.push({
      index: {
        byteStart: posicao(inicio),
        byteEnd: posicao(inicio + 1 + m[2].length),
      },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag: m[2] }],
    });
  }
  return resultado.sort((a, b) => a.index.byteStart - b.index.byteStart);
}

export function contarGrafemas(texto: string): number {
  return [
    ...new Intl.Segmenter("pt", { granularity: "grapheme" }).segment(texto),
  ].length;
}

/** `at://did/app.bsky.feed.post/rkey` → endereço público do post. */
export function enderecoDoPost(uri: string, handle: string): string {
  const rkey = uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

export interface NovaPublicacao {
  texto: string;
  link: string;
  titulo: string;
  descricao: string;
  imagem: Uint8Array;
}

export interface OpcoesDoCliente {
  handle: string;
  senhaDeApp: string;
  /** Servidor da conta (PDS). O padrão serve para contas criadas no app. */
  servico?: string;
  fetch?: typeof fetch;
}

export class ErroDoBluesky extends Error {}

export async function entrarNoBluesky({
  handle,
  senhaDeApp,
  servico = "https://bsky.social",
  fetch: buscar = fetch,
}: OpcoesDoCliente) {
  async function xrpc<T>(
    metodo: string,
    esquema: z.ZodType<T>,
    init: RequestInit & { token?: string } = {},
  ): Promise<T> {
    const { token, ...resto } = init;
    const resposta = await buscar(`${servico}/xrpc/${metodo}`, {
      ...resto,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...resto.headers,
      },
    });
    const corpo = await resposta.text();
    if (!resposta.ok) {
      // A resposta de erro do XRPC traz { error, message }; nunca ecoa a senha
      throw new ErroDoBluesky(
        `${metodo} respondeu ${resposta.status}: ${corpo.slice(0, 300)}`,
      );
    }
    return esquema.parse(JSON.parse(corpo));
  }

  const sessao = await xrpc("com.atproto.server.createSession", Sessao, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password: senhaDeApp }),
  });
  const token = sessao.accessJwt;

  return {
    /**
     * Procura nos posts recentes da conta um que já tenha o cartão deste link.
     * É uma segunda proteção contra repetição, caso o registro não tenha sido
     * salvo depois de uma publicação.
     */
    async publicacaoDoLink(link: string): Promise<string | undefined> {
      const params = new URLSearchParams({
        repo: sessao.did,
        collection: "app.bsky.feed.post",
        limit: "100",
      });
      const lista = await xrpc(
        `com.atproto.repo.listRecords?${params}`,
        ListaDePosts,
        { token },
      );
      return lista.records.find((r) => r.value.embed?.external?.uri === link)
        ?.uri;
    },

    async publicar(nova: NovaPublicacao) {
      if (contarGrafemas(nova.texto) > LIMITE_DO_TEXTO)
        throw new ErroDoBluesky(
          `Texto com mais de ${LIMITE_DO_TEXTO} caracteres.`,
        );
      if (nova.imagem.byteLength > LIMITE_DA_IMAGEM)
        throw new ErroDoBluesky("Imagem maior que 1 MB.");

      const { blob } = await xrpc("com.atproto.repo.uploadBlob", BlobEnviado, {
        method: "POST",
        token,
        headers: { "Content-Type": "image/png" },
        body: new Uint8Array(nova.imagem),
      });

      const criado = await xrpc(
        "com.atproto.repo.createRecord",
        RegistroCriado,
        {
          method: "POST",
          token,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo: sessao.did,
            collection: "app.bsky.feed.post",
            record: {
              $type: "app.bsky.feed.post",
              text: nova.texto,
              facets: facetas(nova.texto),
              langs: ["pt"],
              createdAt: new Date().toISOString(),
              embed: {
                $type: "app.bsky.embed.external",
                external: {
                  uri: nova.link,
                  title: nova.titulo,
                  description: nova.descricao,
                  thumb: blob,
                },
              },
            },
          }),
        },
      );
      return criado.uri;
    },

    /** Apaga um post da conta (o Bluesky não permite editar). */
    async apagar(uri: string) {
      const rkey = uri.split("/").pop();
      await xrpc("com.atproto.repo.deleteRecord", z.unknown(), {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: sessao.did,
          collection: "app.bsky.feed.post",
          rkey,
        }),
      });
    },
  };
}
