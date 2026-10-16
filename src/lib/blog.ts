import "server-only";
import { posts } from "#conteudo";

/*
 * Posts compilados pelo Velite (`.velite/`). Rascunhos ficam fora de
 * tudo o que é publicado (listas, RSS, páginas).
 */

export type Post = (typeof posts)[number];

export function postsPublicados(): Post[] {
  return posts
    .filter((p) => !p.rascunho)
    .sort(
      (a, b) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug),
    );
}

export function postPorSlug(slug: string): Post | undefined {
  return postsPublicados().find((p) => p.slug === slug);
}

/** Minutos de leitura a 200 palavras por minuto (ritmo de texto informativo). */
export function minutosDeLeitura(post: Post): number {
  return Math.max(1, Math.round(post.metadata.wordCount / 200));
}

export { URL_DO_SITE } from "./site";
