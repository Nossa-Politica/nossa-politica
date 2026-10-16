import { imagemDoPost } from "../og/imagem";
import * as bluesky from "./bluesky";
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
  publicacaoDoLink(link: string): Promise<Publicado | undefined>;
  publicar(post: PostSocial, link: string): Promise<Publicado>;
  apagar(id: string): Promise<void>;
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
      async publicacaoDoLink(link) {
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
      publicacaoDoLink: (link) => conta.publicacaoDoLink(link),
      publicar: (post, link) =>
        conta.publicar({ texto: textoDe(post, "threads"), link }),
      apagar: (id) => conta.apagar(id),
    };
  },
};

export const DESTINOS: Destino[] = [destinoBluesky, destinoThreads];
