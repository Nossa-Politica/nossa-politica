import { z } from "zod";

/*
 * Cliente mínimo da Graph API da Meta para a Página do Facebook e o Instagram
 * ligado a ela. Um único token de Página, gerado a partir de um token de
 * longa duração, não vence e serve para as duas redes.
 */

export const VERSAO = "v24.0";
const API = `https://graph.facebook.com/${VERSAO}`;

/** Limites do Instagram para a legenda. */
export const LIMITE_DA_LEGENDA = 2200;
export const LIMITE_DE_HASHTAGS = 30;

export function contarHashtags(texto: string): number {
  return texto.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0;
}

const Pagina = z.object({
  id: z.string(),
  name: z.string(),
  instagram_business_account: z
    .object({ id: z.string(), username: z.string().optional() })
    .optional(),
});
const Id = z.object({ id: z.string() });
const StatusDoConteiner = z.object({
  status_code: z.enum([
    "IN_PROGRESS",
    "FINISHED",
    "PUBLISHED",
    "ERROR",
    "EXPIRED",
  ]),
});
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
const MidiaDoInstagram = z.object({
  id: z.string(),
  caption: z.string().optional(),
  permalink: z.string().optional(),
});
const MidiasDoInstagram = z.object({ data: z.array(MidiaDoInstagram) });

const semBarraFinal = (url: string) => url.replace(/\/+$/, "");

export class ErroDaMeta extends Error {}

export interface OpcoesDoCliente {
  token: string;
  fetch?: typeof fetch;
  /** Pausa entre as consultas ao contêiner do Instagram (os testes passam 0). */
  esperaMs?: number;
}

export async function entrarNaMeta({
  token,
  fetch: buscar = fetch,
  esperaMs = 5000,
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
    params: { fields: "id,name,instagram_business_account{id,username}" },
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

  const idDoInstagram = pagina.instagram_business_account?.id;
  const instagram = {
    /** Procura nas mídias recentes uma com a mesma legenda. */
    async publicacaoDaLegenda(legenda: string) {
      const midias = await graph(
        `${exigirInstagram()}/media`,
        MidiasDoInstagram,
        { params: { fields: "id,caption,permalink", limit: "50" } },
      );
      const achada = midias.data.find(
        (m) => m.caption?.trim() === legenda.trim(),
      );
      return achada?.permalink
        ? { id: achada.id, url: achada.permalink }
        : undefined;
    },

    /** Imagem (JPEG num endereço público) com legenda. */
    async publicar({ legenda, imagem }: { legenda: string; imagem: string }) {
      if (legenda.length > LIMITE_DA_LEGENDA)
        throw new ErroDaMeta(
          `Legenda com mais de ${LIMITE_DA_LEGENDA} caracteres.`,
        );
      if (contarHashtags(legenda) > LIMITE_DE_HASHTAGS)
        throw new ErroDaMeta(`Mais de ${LIMITE_DE_HASHTAGS} hashtags.`);

      const ig = exigirInstagram();
      // 1. Cria o contêiner; 2. espera o Instagram baixar a imagem; 3. publica
      const conteiner = await graph(`${ig}/media`, Id, {
        metodo: "POST",
        params: { image_url: imagem, caption: legenda },
      });
      for (let tentativa = 0; ; tentativa++) {
        const { status_code } = await graph(conteiner.id, StatusDoConteiner, {
          params: { fields: "status_code" },
        });
        if (status_code === "FINISHED") break;
        if (status_code !== "IN_PROGRESS" || tentativa >= 30)
          throw new ErroDaMeta(`Contêiner do Instagram: ${status_code}`);
        await new Promise((r) => setTimeout(r, esperaMs));
      }
      const { id } = await graph(`${ig}/media_publish`, Id, {
        metodo: "POST",
        params: { creation_id: conteiner.id },
      });
      const midia = await graph(id, MidiaDoInstagram, {
        params: { fields: "id,permalink" },
      });
      return { id, url: midia.permalink ?? "https://www.instagram.com/" };
    },
  };

  function exigirInstagram(): string {
    if (!idDoInstagram)
      throw new ErroDaMeta(
        `A Página "${pagina.name}" não tem uma conta profissional do Instagram vinculada.`,
      );
    return idDoInstagram;
  }

  return { pagina, facebook, instagram };
}

/** Endereço de um post da Página a partir do id `pagina_post`. */
function linkDoPost(id: string): string {
  return `https://www.facebook.com/${id.replace("_", "/posts/")}`;
}
