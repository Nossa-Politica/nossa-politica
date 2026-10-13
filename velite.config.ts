import { defineCollection, defineConfig, s } from "velite";

/*
 * Conteúdo do blog: arquivos em `content/`, validados e compilados pelo Velite
 * para `.velite/` antes do build do Next.js. Um post é um arquivo MDX.
 */

const autores = defineCollection({
  name: "Autor",
  pattern: "autores/*.yml",
  schema: s.object({
    slug: s.slug("autores"),
    nome: s.string(),
    bio: s.string(),
    url: s.string().url().optional(),
  }),
});

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      titulo: s.string().max(120),
      slug: s.slug("posts"),
      data: s.isodate(),
      resumo: s.string().max(280),
      autor: s.string(),
      tags: s.array(s.string()).default([]),
      /** Rascunhos não aparecem no site nem no RSS */
      rascunho: s.boolean().default(false),
      /** Texto curto de cada rede, usado na publicação automática (fase 7) */
      social: s
        .object({
          bluesky: s.string().max(300).optional(),
          threads: s.string().max(500).optional(),
          facebook: s.string().optional(),
          instagram: s.string().max(2200).optional(),
        })
        .default({}),
      metadata: s.metadata(),
      corpo: s.mdx(),
    })
    .transform((post) => ({ ...post, url: `/blog/${post.slug}` })),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    clean: true,
  },
  collections: { autores, posts },
});
