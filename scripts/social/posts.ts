import { z } from "zod";
import type { Registro } from "./registro";

export const REDES = ["bluesky"] as const;
export type Rede = (typeof REDES)[number];

/**
 * Só posts dos últimos dias entram na fila. Assim, quando uma rede nova é
 * ligada, ela não recebe o arquivo inteiro do blog de uma vez.
 */
export const DIAS_MAXIMOS = 14;

/** O que a publicação usa de cada post compilado pelo Velite. */
export const PostSocial = z.object({
  slug: z.string(),
  titulo: z.string(),
  resumo: z.string(),
  data: z.string(),
  rascunho: z.boolean(),
  url: z.string(),
  social: z
    .object({
      bluesky: z.string().optional(),
      threads: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
    })
    .default({}),
});
export type PostSocial = z.infer<typeof PostSocial>;

/** Data de hoje (AAAA-MM-DD) no horário de Brasília. */
export function hoje(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(agora);
}

function diasAntes(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Posts que ainda não saíram na rede: publicados no site, com texto para a
 * rede, recentes e fora do registro. Do mais antigo para o mais novo.
 * `refazer` entra na fila mesmo que seja antigo.
 */
export function pendentes(
  posts: PostSocial[],
  registro: Registro,
  rede: Rede,
  dataDeHoje: string,
  refazer?: string,
): PostSocial[] {
  const limite = diasAntes(dataDeHoje, DIAS_MAXIMOS);
  const publicados = registro[rede] ?? {};
  return posts
    .filter(
      (p) =>
        !p.rascunho &&
        p.social[rede]?.trim() &&
        !publicados[p.slug] &&
        (p.data.slice(0, 10) >= limite || p.slug === refazer),
    )
    .sort((a, b) => a.data.localeCompare(b.data));
}
