import { z } from "zod";

/*
 * Cliente mínimo da Graph API da Meta para a Página do Facebook. O token de
 * Página, gerado a partir de um token de usuário de longa duração, não vence.
 * (O Instagram usa a própria API, em `instagram.ts`, sem depender da Página.)
 */

export const VERSAO = "v25.0";
const API = `https://graph.facebook.com/${VERSAO}`;

const Pagina = z.object({
  id: z.string(),
  name: z.string(),
});
const Id = z.object({ id: z.string() });
const PostDaPagina = z.object({
  id: z.string(),
  permalink_url: z.string().optional(),
  attachments: z
    .object({
      data: z.array(
        z.object({
          url: z.string().optional(),
          unshimmed_url: z.string().optional(),
        }),
      ),
    })
    .optional(),
});
const PostsDaPagina = z.object({ data: z.array(PostDaPagina) });
const semBarraFinal = (url: string) => url.replace(/\/+$/, "");

export class ErroDaMeta extends Error {}

export interface OpcoesDoCliente {
  token: string;
  fetch?: typeof fetch;
}

export async function entrarNaMeta({
  token,
  fetch: buscar = fetch,
}: OpcoesDoCliente) {
  async function graph<T>(
    caminho: string,
    esquema: z.ZodType<T>,
    {
      metodo = "GET",
      params = {},
    }: { metodo?: string; params?: Record<string, string> } = {},
  ): Promise<T> {
    const corpo = new URLSearchParams({ ...params, access_token: token });
    const url =
      metodo === "POST" ? `${API}/${caminho}` : `${API}/${caminho}?${corpo}`;
    const resposta = await buscar(url, {
      method: metodo,
      ...(metodo === "POST" ? { body: corpo } : {}),
    });
    const texto = await resposta.text();
    if (!resposta.ok) {
      // A mensagem leva só o caminho, nunca a URL com o token
      throw new ErroDaMeta(
        `${metodo} ${caminho} respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
      );
    }
    return esquema.parse(JSON.parse(texto));
  }

  // Com um token de Página, `me` é a própria Página
  const pagina = await graph("me", Pagina, {
    params: { fields: "id,name" },
  });

  const facebook = {
    /** Procura nos posts recentes da Página um que já tenha este link. */
    async publicacaoDoLink(link: string) {
      const posts = await graph(`${pagina.id}/posts`, PostsDaPagina, {
        params: {
          fields: "id,permalink_url,attachments{url,unshimmed_url}",
          limit: "50",
        },
      });
      const achado = posts.data.find((p) =>
        p.attachments?.data.some((a) =>
          [a.unshimmed_url, a.url].some(
            (u) => u && semBarraFinal(u) === semBarraFinal(link),
          ),
        ),
      );
      return achado
        ? { id: achado.id, url: achado.permalink_url ?? linkDoPost(achado.id) }
        : undefined;
    },

    /** Texto com o link: o Facebook monta o cartão pelas metatags da página. */
    async publicar({ texto, link }: { texto: string; link: string }) {
      const { id } = await graph(`${pagina.id}/feed`, Id, {
        metodo: "POST",
        params: { message: texto, link },
      });
      const post = await graph(id, PostDaPagina, {
        params: { fields: "id,permalink_url" },
      });
      return { id, url: post.permalink_url ?? linkDoPost(id) };
    },

    async apagar(id: string) {
      await graph(id, z.unknown(), { metodo: "DELETE" });
    },
  };

  return { pagina, facebook };
}

/** Endereço de um post da Página a partir do id `pagina_post`. */
function linkDoPost(id: string): string {
  return `https://www.facebook.com/${id.replace("_", "/posts/")}`;
}
