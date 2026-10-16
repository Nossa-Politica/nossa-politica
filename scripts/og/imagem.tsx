import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

/*
 * Imagens de compartilhamento (1200×630) desenhadas com o Satori, o mesmo
 * motor do `next/og`, mas no build: viram arquivos PNG em `public/og/` e não
 * pesam no Worker. A publicação nas redes (fase 7) usa a mesma função.
 */

export const LARGURA = 1200;
export const ALTURA = 630;
const MARGEM = 72;
const CONTEUDO = LARGURA - 2 * MARGEM;

const PASTA_FONTES = join(
  process.cwd(),
  "node_modules/geist/dist/fonts/geist-sans",
);

async function fontes() {
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

export async function gerarImagem({
  chapeu,
  titulo,
  subtitulo,
}: DadosDaImagem): Promise<Buffer> {
  const tamanhoTitulo = titulo.length > 80 ? 54 : titulo.length > 50 ? 62 : 72;
  const svg = await satori(
    <div
      style={{
        width: LARGURA,
        height: ALTURA,
        display: "flex",
        flexDirection: "column",
        padding: MARGEM,
        background: "#ffffff",
        color: "#0b0b0b",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: CONTEUDO,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 16,
              height: 48,
              background: "#2a78d6",
              borderRadius: 4,
            }}
          />
          <div style={{ fontSize: 32, fontWeight: 600, color: "#52514e" }}>
            {chapeu}
          </div>
        </div>
        <div
          style={{
            display: "block",
            width: CONTEUDO,
            fontSize: tamanhoTitulo,
            fontWeight: 600,
            lineHeight: 1.1,
            lineClamp: 3,
          }}
        >
          {titulo}
        </div>
        {subtitulo && (
          <div
            style={{
              display: "block",
              width: CONTEUDO,
              fontSize: 32,
              color: "#52514e",
              lineHeight: 1.35,
              lineClamp: 3,
            }}
          >
            {subtitulo}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          bottom: MARGEM,
          display: "flex",
          justifyContent: "space-between",
          width: CONTEUDO,
          fontSize: 30,
          color: "#52514e",
          borderTop: "2px solid #e1e0d9",
          paddingTop: 24,
        }}
      >
        <span style={{ fontWeight: 600, color: "#0b0b0b" }}>
          Nossa Política
        </span>
        <span>Dados oficiais do Congresso</span>
      </div>
    </div>,
    { width: LARGURA, height: ALTURA, fonts: await fontes() },
  );
  return new Resvg(svg, { fitTo: { mode: "width", value: LARGURA } })
    .render()
    .asPng();
}

/** Imagem de um post do blog: a mesma no site e nas redes. */
export function imagemDoPost(post: { titulo: string; resumo: string }) {
  return gerarImagem({
    chapeu: "Blog",
    titulo: post.titulo,
    subtitulo: post.resumo,
  });
}
