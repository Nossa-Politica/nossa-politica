import "server-only";
import { autores, posts } from "#conteudo";

/*
 * Posts e autores compilados pelo Velite (`.velite/`). Rascunhos ficam fora de
 * tudo o que é publicado (listas, RSS, páginas).
 */

export type Post = (typeof posts)[number];
export type Autor = (typeof autores)[number];

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

export function autorPorSlug(slug: string): Autor {
  const autor = autores.find((a) => a.slug === slug);
  if (!autor)
    throw new Error(`Autor não cadastrado em content/autores: ${slug}`);
  return autor;
}

/** Minutos de leitura a 200 palavras por minuto (ritmo de texto informativo). */
export function minutosDeLeitura(post: Post): number {
  return Math.max(1, Math.round(post.metadata.wordCount / 200));
}

export function todosOsAutores(): Autor[] {
  return autores;
}

export { URL_DO_SITE } from "./site";
