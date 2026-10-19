import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { encode as codificarJpeg } from "jpeg-js";
import satori from "satori";

/*
 * Imagens de compartilhamento desenhadas com o Satori, o mesmo motor do
 * `next/og`, mas no build: viram arquivos em `public/og/` e não pesam no
 * Worker. Dois formatos: o horizontal (1200×630, cartão de link em todas as
 * redes) e o vertical (1080×1350, post do Instagram, que só aceita JPEG).
 */

export interface Formato {
  largura: number;
  altura: number;
  margem: number;
  /** Tamanho do título conforme o comprimento: curto, médio e longo */
  titulo: [number, number, number];
  subtitulo: number;
  chapeu: number;
  rodape: number;
  /** Linhas máximas do título e do subtítulo */
  linhas: number;
}

export const HORIZONTAL: Formato = {
  largura: 1200,
  altura: 630,
  margem: 72,
  titulo: [72, 62, 54],
  subtitulo: 32,
  chapeu: 32,
  rodape: 30,
  linhas: 3,
};

export const VERTICAL: Formato = {
  largura: 1080,
  altura: 1350,
  margem: 88,
  titulo: [96, 84, 72],
  subtitulo: 44,
  chapeu: 40,
  rodape: 36,
  linhas: 6,
};

const PASTA_FONTES = join(
  process.cwd(),
  "node_modules/geist/dist/fonts/geist-sans",
);

// Lidas uma vez só: o build gera mais de mil imagens
let cacheDeFontes: ReturnType<typeof lerFontes> | undefined;
const fontes = () => {
  cacheDeFontes ??= lerFontes();
  return cacheDeFontes;
};

async function lerFontes() {
  const [regular, seminegrito] = await Promise.all([
    readFile(join(PASTA_FONTES, "Geist-Regular.ttf")),
    readFile(join(PASTA_FONTES, "Geist-SemiBold.ttf")),
  ]);
  return [
    {
      name: "Geist",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: seminegrito,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

export interface DadosDaImagem {
  /** Linha pequena acima do título ("Blog", "Deputada federal"…) */
  chapeu: string;
  titulo: string;
  subtitulo?: string;
}

async function desenhar(
  { chapeu, titulo, subtitulo }: DadosDaImagem,
  f: Formato,
): Promise<Resvg> {
  const conteudo = f.largura - 2 * f.margem;
  const tamanhoTitulo =
    titulo.length > 80
      ? f.titulo[2]
      : titulo.length > 50
        ? f.titulo[1]
        : f.titulo[0];
  const svg = await satori(
    <div
      style={{
        width: f.largura,
        height: f.altura,
        display: "flex",
        flexDirection: "column",
        padding: f.margem,
        background: "#ffffff",
        color: "#0b0b0b",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: f.chapeu * 0.75,
          width: conteudo,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: f.chapeu / 2,
              height: f.chapeu * 1.5,
              background: "#2a78d6",
              borderRadius: 4,
            }}
          />
          <div
            style={{ fontSize: f.chapeu, fontWeight: 600, color: "#52514e" }}
          >
            {chapeu}
          </div>
        </div>
        <div
          style={{
            display: "block",
            width: conteudo,
            fontSize: tamanhoTitulo,
            fontWeight: 600,
            lineHeight: 1.1,
            lineClamp: f.linhas,
          }}
        >
          {titulo}
        </div>
        {subtitulo && (
          <div
            style={{
              display: "block",
              width: conteudo,
              fontSize: f.subtitulo,
              color: "#52514e",
              lineHeight: 1.35,
              lineClamp: f.linhas,
            }}
          >
            {subtitulo}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: f.margem,
          bottom: f.margem,
          display: "flex",
          justifyContent: "space-between",
          width: conteudo,
          fontSize: f.rodape,
          color: "#52514e",
          borderTop: "2px solid #e1e0d9",
          paddingTop: f.rodape * 0.8,
        }}
      >
        <span style={{ fontWeight: 600, color: "#0b0b0b" }}>
          Nossa Política
        </span>
        <span>nossapolitica.com.br</span>
      </div>
    </div>,
    { width: f.largura, height: f.altura, fonts: await fontes() },
  );
  return new Resvg(svg, {
    fitTo: { mode: "width", value: f.largura },
    // O Satori já entrega o texto como contorno: carregar as fontes do sistema
    // a cada imagem só deixaria o build lento
    font: { loadSystemFonts: false },
  });
}

/** PNG no formato horizontal (cartão de link). */
export async function gerarImagem(dados: DadosDaImagem): Promise<Buffer> {
  return (await desenhar(dados, HORIZONTAL)).render().asPng();
}

/** JPEG no formato vertical (post do Instagram). */
export async function gerarImagemVertical(
  dados: DadosDaImagem,
): Promise<Buffer> {
  const imagem = (await desenhar(dados, VERTICAL)).render();
  return codificarJpeg(
    { data: imagem.pixels, width: imagem.width, height: imagem.height },
    90,
  ).data;
}

const dadosDoPost = (post: { titulo: string; resumo: string }) => ({
  chapeu: "Blog",
  titulo: post.titulo,
  subtitulo: post.resumo,
});

/** Imagem de um post do blog: a mesma no site e nos cartões das redes. */
export function imagemDoPost(post: { titulo: string; resumo: string }) {
  return gerarImagem(dadosDoPost(post));
}

/** Imagem vertical de um post, para o Instagram. */
export function imagemVerticalDoPost(post: { titulo: string; resumo: string }) {
  return gerarImagemVertical(dadosDoPost(post));
}
