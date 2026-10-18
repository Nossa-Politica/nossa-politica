import { imagemDoPost, imagemVerticalDoPost } from "../og/imagem";
import * as bluesky from "./bluesky";
import * as instagram from "./instagram";
import * as meta from "./meta";
import type { PostSocial, Rede } from "./posts";
import * as threads from "./threads";

/*
 * O que muda de uma rede para outra: credenciais, limites e a API. O
 * `publish.ts` só conversa com esta interface.
 */

export interface Publicado {
  id: string;
  url: string;
}

export interface Conta {
  /** Procura na conta um post deste link (segunda proteção contra repetição) */
  jaPublicado(post: PostSocial, link: string): Promise<Publicado | undefined>;
  publicar(post: PostSocial, link: string): Promise<Publicado>;
  /** Ausente quando a API da rede não permite apagar (Instagram) */
  apagar?(id: string): Promise<void>;
}

export interface Destino {
  rede: Rede;
  nome: string;
  /** Variáveis de ambiente que a rede exige fora do dry-run */
  variaveis: string[];
  /**
   * Confere texto, limites e imagem antes de publicar. Devolve as linhas que o
   * dry-run mostra e lança erro se algo passar do limite.
   */
  conferir(post: PostSocial): Promise<string[]>;
  entrar(): Promise<Conta>;
}

const env = (nome: string) => process.env[nome]?.trim() ?? "";
const textoDe = (post: PostSocial, rede: Rede) =>
  post.social[rede]?.trim() ?? "";

const destinoBluesky: Destino = {
  rede: "bluesky",
  nome: "Bluesky",
  variaveis: ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD"],
  async conferir(post) {
    const texto = textoDe(post, "bluesky");
    const tamanho = bluesky.contarGrafemas(texto);
    if (tamanho > bluesky.LIMITE_DO_TEXTO)
      throw new Error(
        `Texto com mais de ${bluesky.LIMITE_DO_TEXTO} caracteres.`,
      );
    const imagem = await imagemDoPost(post);
    if (imagem.byteLength > bluesky.LIMITE_DA_IMAGEM)
      throw new Error("Imagem maior que 1 MB.");
    return [
      `Texto (${tamanho}/${bluesky.LIMITE_DO_TEXTO}): ${texto}`,
      `Cartão: ${post.titulo}`,
      `Imagem: ${Math.round(imagem.byteLength / 1024)} KB`,
    ];
  },
  async entrar() {
    const handle = env("BLUESKY_HANDLE").replace(/^@/, "");
    const conta = await bluesky.entrarNoBluesky({
      handle,
      senhaDeApp: env("BLUESKY_APP_PASSWORD"),
    });
    const publicado = (id: string) => ({
      id,
      url: bluesky.enderecoDoPost(id, handle),
    });
    return {
      async jaPublicado(_post, link) {
        const id = await conta.publicacaoDoLink(link);
        return id ? publicado(id) : undefined;
      },
      async publicar(post, link) {
        const id = await conta.publicar({
          texto: textoDe(post, "bluesky"),
          link,
          titulo: post.titulo,
          descricao: post.resumo,
          imagem: await imagemDoPost(post),
        });
        return publicado(id);
      },
      apagar: (id) => conta.apagar(id),
    };
  },
};

const destinoThreads: Destino = {
  rede: "threads",
  nome: "Threads",
  variaveis: ["THREADS_ACCESS_TOKEN"],
  async conferir(post) {
    const texto = textoDe(post, "threads");
    const tamanho = threads.contarCaracteres(texto);
    if (tamanho > threads.LIMITE_DO_TEXTO)
      throw new Error(
        `Texto com mais de ${threads.LIMITE_DO_TEXTO} caracteres.`,
      );
    return [
      `Texto (${tamanho}/${threads.LIMITE_DO_TEXTO}): ${texto}`,
      "Cartão: montado pelo Threads a partir das metatags da página",
    ];
  },
  async entrar() {
    const conta = await threads.entrarNoThreads({
      token: env("THREADS_ACCESS_TOKEN"),
    });
    return {
      jaPublicado: (_post, link) => conta.publicacaoDoLink(link),
      publicar: (post, link) =>
        conta.publicar({ texto: textoDe(post, "threads"), link }),
      apagar: (id) => conta.apagar(id),
    };
  },
};

const destinoFacebook: Destino = {
  rede: "facebook",
  nome: "Facebook",
  variaveis: ["META_PAGE_TOKEN"],
  async conferir(post) {
    return [
      `Texto: ${textoDe(post, "facebook")}`,
      "Cartão: montado pelo Facebook a partir das metatags da página",
    ];
  },
  async entrar() {
    const { facebook } = await meta.entrarNaMeta({
      token: env("META_PAGE_TOKEN"),
    });
    return {
      jaPublicado: (_post, link) => facebook.publicacaoDoLink(link),
      publicar: (post, link) =>
        facebook.publicar({ texto: textoDe(post, "facebook"), link }),
      apagar: (id) => facebook.apagar(id),
    };
  },
};

/** Imagem vertical publicada pelo build em `public/og/instagram/`. */
const imagemDoInstagram = (post: PostSocial, link: string) =>
  `${new URL(link).origin}/og/instagram/${post.slug}.jpg`;

const destinoInstagram: Destino = {
  rede: "instagram",
  nome: "Instagram",
  variaveis: ["INSTAGRAM_ACCESS_TOKEN"],
  async conferir(post) {
    const legenda = textoDe(post, "instagram");
    if (legenda.length > instagram.LIMITE_DA_LEGENDA)
      throw new Error(
        `Legenda com mais de ${instagram.LIMITE_DA_LEGENDA} caracteres.`,
      );
    const hashtags = instagram.contarHashtags(legenda);
    if (hashtags > instagram.LIMITE_DE_HASHTAGS)
      throw new Error(`Mais de ${instagram.LIMITE_DE_HASHTAGS} hashtags.`);
    const imagem = await imagemVerticalDoPost(post);
    if (imagem.byteLength > 8_000_000)
      throw new Error("Imagem maior que 8 MB.");
    return [
      `Legenda (${legenda.length}/${instagram.LIMITE_DA_LEGENDA}, ${hashtags} hashtags): ${legenda}`,
      `Imagem: 1080×1350 JPEG, ${Math.round(imagem.byteLength / 1024)} KB`,
    ];
  },
  async entrar() {
    const conta = await instagram.entrarNoInstagram({
      token: env("INSTAGRAM_ACCESS_TOKEN"),
    });
    return {
      jaPublicado: (post) =>
        conta.publicacaoDaLegenda(textoDe(post, "instagram")),
      async publicar(post, link) {
        const imagem = imagemDoInstagram(post, link);
        // O Instagram baixa a imagem pelo endereço: ela precisa estar no ar
        const resposta = await fetch(imagem, { method: "HEAD" });
        if (!resposta.ok)
          throw new Error(`A imagem ${imagem} respondeu ${resposta.status}.`);
        return conta.publicar({
          legenda: textoDe(post, "instagram"),
          imagem,
        });
      },
    };
  },
};

export const DESTINOS: Destino[] = [
  destinoBluesky,
  destinoThreads,
  destinoFacebook,
  destinoInstagram,
];
