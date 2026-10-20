/**
 * Gera as imagens de compartilhamento em `public/og/` antes do build:
 * uma padrão do site, uma por post do blog (mais a vertical do Instagram) e
 * uma por político (se houver `dados/`).
 *
 *   tsx scripts/og/gerar.tsx   # roda sozinho no `pnpm build`
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { ListaPessoas } from "../../etl/pessoas/saida";
import { gerarImagem, imagemDoPost, imagemVerticalDoPost } from "./imagem";

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
  await mkdir(join(PASTA, "instagram"), { recursive: true });

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
    // Versão vertical, publicada no Instagram (que busca a imagem pelo link)
    await writeFile(
      join(PASTA, "instagram", `${post.slug}.jpg`),
      await imagemVerticalDoPost(post),
    );
  }

  const pessoas = await gerarPoliticos();
  console.log(
    `Imagens de compartilhamento: padrão, ${posts.length} post(s) e ${pessoas} político(s).`,
  );
}

const CASA = { camara: "Câmara dos Deputados", senado: "Senado Federal" };

/** Uma imagem por político, com nome, casa e partido. Sem números: só a identificação. */
async function gerarPoliticos(): Promise<number> {
  const arquivo = join(process.env.DADOS_DIR ?? "dados", "pessoas.json");
  if (!existsSync(arquivo)) return 0;
  const { pessoas } = ListaPessoas.parse(
    JSON.parse(await readFile(arquivo, "utf8")),
  );
  await mkdir(join(PASTA, "politicos"), { recursive: true });
  for (const p of pessoas) {
    await writeFile(
      join(PASTA, "politicos", `${p.slug}.png`),
      await gerarImagem({
        chapeu: `${CASA[p.casa]} · ${p.partido}-${p.uf}`,
        titulo: p.nome,
        subtitulo:
          "Gastos, projetos, votações, presença e emendas, comparados com os colegas.",
      }),
    );
  }
  return pessoas.length;
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
