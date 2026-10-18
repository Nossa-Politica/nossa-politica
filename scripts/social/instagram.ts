import { z } from "zod";

/*
 * Cliente mínimo da API do Instagram com login do Instagram: publica direto
 * na conta profissional, sem depender de uma Página do Facebook vinculada. O
 * token vale 60 dias e é renovado toda semana pelo workflow `Tokens das redes`.
 * O post é a imagem vertical gerada no build, com a legenda (sem link
 * clicável: "Link na bio").
 */

const API = "https://graph.instagram.com/v25.0";

export const LIMITE_DA_LEGENDA = 2200;
export const LIMITE_DE_HASHTAGS = 30;

export function contarHashtags(texto: string): number {
  return texto.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0;
}

const Conta = z.object({ user_id: z.string(), username: z.string() });
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
const Midia = z.object({
  id: z.string(),
  caption: z.string().optional(),
  permalink: z.string().optional(),
});
const Midias = z.object({ data: z.array(Midia) });

export class ErroDoInstagram extends Error {}

export interface OpcoesDoCliente {
  token: string;
  fetch?: typeof fetch;
  /** Pausa entre as consultas ao contêiner (os testes passam 0). */
  esperaMs?: number;
}

export async function entrarNoInstagram({
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
      throw new ErroDoInstagram(
        `${metodo} ${caminho} respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
      );
    }
    return esquema.parse(JSON.parse(texto));
  }

  const conta = await graph("me", Conta, {
    params: { fields: "user_id,username" },
  });

  return {
    conta,

    /** Procura nas mídias recentes uma com a mesma legenda. */
    async publicacaoDaLegenda(legenda: string) {
      const midias = await graph(`${conta.user_id}/media`, Midias, {
        params: { fields: "id,caption,permalink", limit: "50" },
      });
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
        throw new ErroDoInstagram(
          `Legenda com mais de ${LIMITE_DA_LEGENDA} caracteres.`,
        );
      if (contarHashtags(legenda) > LIMITE_DE_HASHTAGS)
        throw new ErroDoInstagram(`Mais de ${LIMITE_DE_HASHTAGS} hashtags.`);

      // 1. Cria o contêiner; 2. espera o Instagram baixar a imagem; 3. publica
      const conteiner = await graph(`${conta.user_id}/media`, Id, {
        metodo: "POST",
        params: { image_url: imagem, caption: legenda },
      });
      for (let tentativa = 0; ; tentativa++) {
        const { status_code } = await graph(conteiner.id, StatusDoConteiner, {
          params: { fields: "status_code" },
        });
        if (status_code === "FINISHED") break;
        if (status_code !== "IN_PROGRESS" || tentativa >= 30)
          throw new ErroDoInstagram(`Contêiner do Instagram: ${status_code}`);
        await new Promise((r) => setTimeout(r, esperaMs));
      }
      const { id } = await graph(`${conta.user_id}/media_publish`, Id, {
        metodo: "POST",
        params: { creation_id: conteiner.id },
      });
      const midia = await graph(id, Midia, {
        params: { fields: "id,permalink" },
      });
      return {
        id,
        url: midia.permalink ?? `https://www.instagram.com/${conta.username}/`,
      };
    },
  };
}

/**
 * Renova o token de longa duração (precisa ter mais de 24 horas e não ter
 * vencido). Devolve o token novo, que vale 60 dias a partir de agora.
 */
export async function renovarToken(token: string, buscar = fetch) {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });
  const resposta = await buscar(
    `https://graph.instagram.com/refresh_access_token?${params}`,
  );
  const texto = await resposta.text();
  if (!resposta.ok)
    throw new ErroDoInstagram(
      `A renovação respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
    );
  return z
    .object({ access_token: z.string(), expires_in: z.number() })
    .parse(JSON.parse(texto));
}
