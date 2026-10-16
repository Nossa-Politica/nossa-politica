/**
 * Publica nas redes os posts novos do blog. Roda no workflow `Redes sociais`,
 * depois de cada deploy de produção, e grava o que saiu no registro para não
 * repetir.
 *
 *   pnpm social:publicar --dry-run            # mostra o que sairia, sem publicar
 *   pnpm social:publicar --log caminho.json   # registro (padrão: .social/social-log.json)
 *   pnpm social:publicar --rede threads       # só uma rede (padrão: todas)
 *   pnpm social:publicar --refazer slug       # apaga o post nas redes e publica de novo
 *
 * Precisa de `.velite/` (rode `pnpm exec velite build` antes). Fora do
 * dry-run, cada rede precisa das suas credenciais no ambiente (veja
 * `redes.ts`); uma rede sem credenciais é pulada com um aviso.
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { URL_DO_SITE } from "../../src/lib/site";
import { hoje, PostSocial, pendentes, type Rede } from "./posts";
import { type Conta, DESTINOS, type Destino } from "./redes";
import { lerRegistro, type Registro, salvarRegistro } from "./registro";

const { values: opcoes } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    log: { type: "string", default: ".social/social-log.json" },
    rede: { type: "string" },
    refazer: { type: "string" },
  },
});
const simulacao = opcoes["dry-run"];

/** A página do post precisa estar no ar antes de o link ir para a rede. */
async function confirmarNoAr(link: string) {
  const resposta = await fetch(link, { redirect: "follow" });
  if (!resposta.ok)
    throw new Error(`A página ${link} respondeu ${resposta.status}.`);
}

function semPost(registro: Registro, rede: Rede, slug: string): Registro {
  const { [slug]: _, ...resto } = registro[rede] ?? {};
  return { ...registro, [rede]: resto };
}

/** Publica os posts pendentes numa rede. Devolve o número de falhas. */
async function publicarNaRede(
  destino: Destino,
  posts: PostSocial[],
  registro: Registro,
): Promise<number> {
  const { rede, nome } = destino;
  const faltando = destino.variaveis.filter((v) => !process.env[v]?.trim());
  if (!simulacao && faltando.length > 0) {
    console.log(
      `::warning::${nome}: pulado, faltam ${faltando.join(", ")}. Os posts recentes saem quando as credenciais forem configuradas.`,
    );
    return 0;
  }

  let conta: Conta | undefined;
  const entrar = async () => {
    conta ??= await destino.entrar();
    return conta;
  };

  // Para corrigir um post já publicado (texto ou link errado): as redes não
  // permitem editar, então o antigo é apagado e o post volta para a fila
  const refazer = opcoes.refazer;
  const antigo = refazer ? registro[rede]?.[refazer] : undefined;
  let consulta = registro;
  if (refazer && antigo) {
    if (simulacao) {
      console.log(`${nome}: ${antigo.url} seria apagado e publicado de novo.`);
      consulta = semPost(registro, rede, refazer);
    } else {
      await (await entrar()).apagar(antigo.id);
      console.log(`${nome}: apagado ${antigo.url}`);
      Object.assign(registro, semPost(registro, rede, refazer));
      await salvarRegistro(opcoes.log, registro);
    }
  }

  const fila = pendentes(posts, consulta, rede, hoje(), refazer);
  if (fila.length === 0) {
    console.log(`${nome}: nenhum post novo.`);
    return 0;
  }
  console.log(
    `${nome}: ${fila.length} post(s) ${simulacao ? "seriam publicados" : "a publicar"}.`,
  );

  let falhas = 0;
  for (const post of fila) {
    const link = `${URL_DO_SITE}${post.url}`;
    try {
      const linhas = await destino.conferir(post);
      if (simulacao) {
        console.log(
          [`\n— ${post.slug}`, ...linhas, `Link: ${link}`].join("\n  "),
        );
        continue;
      }

      await confirmarNoAr(link);
      const contaAtiva = await entrar();
      const existente = await contaAtiva.publicacaoDoLink(link);
      const publicado = existente ?? (await contaAtiva.publicar(post, link));

      registro[rede] = {
        ...registro[rede],
        [post.slug]: { ...publicado, publicadoEm: new Date().toISOString() },
      };
      // Salva a cada post: se o próximo falhar, este não se repete
      await salvarRegistro(opcoes.log, registro);
      console.log(
        `${nome}: ${existente ? "já estava publicado" : "publicado"} ${post.slug} → ${publicado.url}`,
      );
    } catch (erro) {
      falhas++;
      console.error(`${nome}: falha em ${post.slug}:`, erro);
    }
  }
  return falhas;
}

async function main() {
  const posts = z
    .array(PostSocial)
    .parse(JSON.parse(await readFile(".velite/posts.json", "utf8")));
  const registro = await lerRegistro(opcoes.log);

  const destinos = opcoes.rede
    ? DESTINOS.filter((d) => d.rede === opcoes.rede)
    : DESTINOS;
  if (destinos.length === 0)
    throw new Error(`Rede desconhecida: ${opcoes.rede}`);
  const refazer = opcoes.refazer;
  if (refazer && !destinos.some((d) => registro[d.rede]?.[refazer]))
    throw new Error(`O registro não tem ${refazer} em nenhuma rede.`);

  let falhas = 0;
  for (const destino of destinos) {
    falhas += await publicarNaRede(destino, posts, registro);
  }
  if (falhas > 0) process.exit(1);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
