import { z } from "zod";

/*
 * Cliente mínimo da API oficial do Threads (Meta). Usa um token de longa
 * duração (60 dias), renovado toda semana pelo workflow `Tokens das redes`.
 * O post é um texto com o link anexado: o Threads monta o cartão sozinho a
 * partir das metatags da página (título, resumo e imagem de compartilhamento).
 */

export const LIMITE_DO_TEXTO = 500;

const API = "https://graph.threads.net/v1.0";

/**
 * O Threads conta cada emoji pelo tamanho em bytes (UTF-8), e o resto como um
 * caractere por letra.
 */
export function contarCaracteres(texto: string): number {
  let total = 0;
  for (const c of texto) {
    const emoji =
      /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u200d|\ufe0f/u.test(c);
    total += emoji ? new TextEncoder().encode(c).length : 1;
  }
  return total;
}

const Usuario = z.object({ id: z.string(), username: z.string() });
const Id = z.object({ id: z.string() });
const Status = z.object({
  status: z.enum(["IN_PROGRESS", "FINISHED", "PUBLISHED", "ERROR", "EXPIRED"]),
  error_message: z.string().optional(),
});
const Permalink = z.object({ id: z.string(), permalink: z.string() });
const ListaDePosts = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      permalink: z.string().optional(),
      link_attachment_url: z.string().optional(),
    }),
  ),
});

const semBarraFinal = (url: string) => url.replace(/\/+$/, "");

export class ErroDoThreads extends Error {}

export interface OpcoesDoCliente {
  token: string;
  fetch?: typeof fetch;
  /** Pausa entre as consultas ao contêiner (os testes passam 0). */
  esperaMs?: number;
}

export async function entrarNoThreads({
  token,
  fetch: buscar = fetch,
  esperaMs = 3000,
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
      throw new ErroDoThreads(
        `${metodo} ${caminho} respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
      );
    }
    return esquema.parse(JSON.parse(texto));
  }

  const usuario = await graph("me", Usuario, {
    params: { fields: "id,username" },
  });

  return {
    usuario,

    /** Procura nos posts recentes da conta um que já tenha este link. */
    async publicacaoDoLink(link: string) {
      const lista = await graph("me/threads", ListaDePosts, {
        params: { fields: "id,permalink,link_attachment_url", limit: "50" },
      });
      const achado = lista.data.find(
        (p) =>
          p.link_attachment_url &&
          semBarraFinal(p.link_attachment_url) === semBarraFinal(link),
      );
      return achado?.permalink
        ? { id: achado.id, url: achado.permalink }
        : undefined;
    },

    async publicar({ texto, link }: { texto: string; link: string }) {
      if (contarCaracteres(texto) > LIMITE_DO_TEXTO)
        throw new ErroDoThreads(
          `Texto com mais de ${LIMITE_DO_TEXTO} caracteres.`,
        );

      // 1. Cria o contêiner; 2. espera o Threads processar; 3. publica
      const conteiner = await graph(`${usuario.id}/threads`, Id, {
        metodo: "POST",
        params: { media_type: "TEXT", text: texto, link_attachment: link },
      });
      for (let tentativa = 0; ; tentativa++) {
        const { status, error_message } = await graph(conteiner.id, Status, {
          params: { fields: "status,error_message" },
        });
        if (status === "FINISHED") break;
        if (status !== "IN_PROGRESS" || tentativa >= 20)
          throw new ErroDoThreads(
            `Contêiner ${status}: ${error_message ?? "sem detalhes"}`,
          );
        await new Promise((r) => setTimeout(r, esperaMs));
      }
      const publicado = await graph(`${usuario.id}/threads_publish`, Id, {
        metodo: "POST",
        params: { creation_id: conteiner.id },
      });
      const { permalink } = await graph(publicado.id, Permalink, {
        params: { fields: "id,permalink" },
      });
      return { id: publicado.id, url: permalink };
    },

    async apagar(id: string) {
      await graph(id, z.unknown(), { metodo: "DELETE" });
    },
  };
}

/**
 * Renova o token de longa duração (precisa ter mais de 24 horas e não ter
 * vencido). Devolve o token novo, que vale 60 dias a partir de agora.
 */
export async function renovarToken(token: string, buscar = fetch) {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: token,
  });
  const resposta = await buscar(
    `https://graph.threads.net/refresh_access_token?${params}`,
  );
  const texto = await resposta.text();
  if (!resposta.ok)
    throw new ErroDoThreads(
      `A renovação respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
    );
  return z
    .object({ access_token: z.string(), expires_in: z.number() })
    .parse(JSON.parse(texto));
}
