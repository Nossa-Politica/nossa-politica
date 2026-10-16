/**
 * Publica nas redes os posts novos do blog. Roda no workflow `Redes sociais`,
 * depois de cada deploy de produção, e grava o que saiu no registro para não
 * repetir.
 *
 *   pnpm social:publicar --dry-run            # mostra o que sairia, sem publicar
 *   pnpm social:publicar --log caminho.json   # registro (padrão: .social/social-log.json)
 *   pnpm social:publicar --refazer slug       # apaga o post da rede e publica de novo
 *
 * Precisa de `.velite/` (rode `pnpm exec velite build` antes) e, fora do
 * dry-run, de BLUESKY_HANDLE e BLUESKY_APP_PASSWORD no ambiente.
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { URL_DO_SITE } from "../../src/lib/site";
import { imagemDoPost } from "../og/imagem";
import {
  contarGrafemas,
  enderecoDoPost,
  entrarNoBluesky,
  LIMITE_DA_IMAGEM,
  LIMITE_DO_TEXTO,
} from "./bluesky";
import { hoje, PostSocial, pendentes } from "./posts";
import { lerRegistro, salvarRegistro } from "./registro";

const { values: opcoes } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    log: { type: "string", default: ".social/social-log.json" },
    refazer: { type: "string" },
  },
});
const simulacao = opcoes["dry-run"];

function exigir(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Falta a variável ${nome}.`);
  return valor;
}

/** A página do post precisa estar no ar antes de o link ir para a rede. */
async function confirmarNoAr(link: string) {
  const resposta = await fetch(link, { redirect: "follow" });
  if (!resposta.ok)
    throw new Error(`A página ${link} respondeu ${resposta.status}.`);
}

async function main() {
  const posts = z
    .array(PostSocial)
    .parse(JSON.parse(await readFile(".velite/posts.json", "utf8")));
  const registro = await lerRegistro(opcoes.log);

  // Para corrigir um post já publicado (texto ou link errado): o Bluesky não
  // permite editar, então o antigo é apagado e o post volta para a fila
  const refazer = opcoes.refazer && registro.bluesky?.[opcoes.refazer];
  if (opcoes.refazer && !refazer)
    throw new Error(`O registro não tem ${opcoes.refazer} no Bluesky.`);
  if (refazer && opcoes.refazer) {
    if (simulacao) {
      console.log(`Bluesky: ${refazer.url} seria apagado e publicado de novo.`);
    } else {
      const conta = await entrarNoBluesky({
        handle: exigir("BLUESKY_HANDLE").replace(/^@/, ""),
        senhaDeApp: exigir("BLUESKY_APP_PASSWORD"),
      });
      await conta.apagar(refazer.id);
      console.log(`Apagado: ${refazer.url}`);
    }
    delete registro.bluesky?.[opcoes.refazer];
    if (!simulacao) await salvarRegistro(opcoes.log, registro);
  }

  const fila = pendentes(posts, registro, "bluesky", hoje(), opcoes.refazer);

  if (fila.length === 0) {
    console.log("Bluesky: nenhum post novo.");
    return;
  }
  console.log(
    `Bluesky: ${fila.length} post(s) ${simulacao ? "seriam publicados" : "a publicar"}.`,
  );

  let conta: Awaited<ReturnType<typeof entrarNoBluesky>> | undefined;
  let handle = "";
  let falhas = 0;

  for (const post of fila) {
    const texto = post.social.bluesky?.trim() ?? "";
    const link = `${URL_DO_SITE}${post.url}`;
    try {
      const imagem = await imagemDoPost(post);
      if (contarGrafemas(texto) > LIMITE_DO_TEXTO)
        throw new Error(`Texto com mais de ${LIMITE_DO_TEXTO} caracteres.`);
      if (imagem.byteLength > LIMITE_DA_IMAGEM)
        throw new Error("Imagem maior que 1 MB.");

      if (simulacao) {
        console.log(
          [
            `\n— ${post.slug}`,
            `  Texto (${contarGrafemas(texto)}/${LIMITE_DO_TEXTO}): ${texto}`,
            `  Cartão: ${post.titulo}`,
            `  Link: ${link}`,
            `  Imagem: ${Math.round(imagem.byteLength / 1024)} KB`,
          ].join("\n"),
        );
        continue;
      }

      await confirmarNoAr(link);
      if (!conta) {
        handle = exigir("BLUESKY_HANDLE").replace(/^@/, "");
        conta = await entrarNoBluesky({
          handle,
          senhaDeApp: exigir("BLUESKY_APP_PASSWORD"),
        });
      }

      const existente = await conta.publicacaoDoLink(link);
      const id =
        existente ??
        (await conta.publicar({
          texto,
          link,
          titulo: post.titulo,
          descricao: post.resumo,
          imagem,
        }));
      const url = enderecoDoPost(id, handle);

      registro.bluesky = {
        ...registro.bluesky,
        [post.slug]: { url, id, publicadoEm: new Date().toISOString() },
      };
      // Salva a cada post: se o próximo falhar, este não se repete
      await salvarRegistro(opcoes.log, registro);
      console.log(
        `${existente ? "Já estava publicado" : "Publicado"}: ${post.slug} → ${url}`,
      );
    } catch (erro) {
      falhas++;
      console.error(`Falha em ${post.slug}:`, erro);
    }
  }

  if (falhas > 0) process.exit(1);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
