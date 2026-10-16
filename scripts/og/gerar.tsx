/**
 * Gera as imagens de compartilhamento em `public/og/` antes do build:
 * uma padrão do site e uma por post do blog.
 *
 *   tsx scripts/og/gerar.tsx   # roda sozinho no `pnpm build`
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { gerarImagem, imagemDoPost } from "./imagem";

const PASTA = join(process.cwd(), "public/og");

const Posts = z.array(
  z.object({
    slug: z.string(),
    titulo: z.string(),
    resumo: z.string(),
    rascunho: z.boolean(),
  }),
);

async function main() {
  await mkdir(join(PASTA, "blog"), { recursive: true });

  await writeFile(
    join(PASTA, "padrao.png"),
    await gerarImagem({
      chapeu: "Transparência no Congresso",
      titulo: "O que o seu político fez?",
      subtitulo:
        "Gastos, projetos, votações, presença e emendas, comparados com os colegas.",
    }),
  );

  const posts = Posts.parse(
    JSON.parse(await readFile(".velite/posts.json", "utf8")),
  );
  for (const post of posts.filter((p) => !p.rascunho)) {
    await writeFile(
      join(PASTA, "blog", `${post.slug}.png`),
      await imagemDoPost(post),
    );
  }
  console.log(`Imagens de compartilhamento: padrão e ${posts.length} post(s).`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
