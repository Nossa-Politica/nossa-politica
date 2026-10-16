import { describe, expect, it } from "vitest";
import { hoje, type PostSocial, pendentes } from "./posts";

const post = (dados: Partial<PostSocial> & { slug: string }): PostSocial => ({
  titulo: "Título",
  resumo: "Resumo",
  data: "2026-10-13T00:00:00.000Z",
  rascunho: false,
  url: `/blog/${dados.slug}`,
  social: { bluesky: "Texto para o Bluesky" },
  ...dados,
});

describe("pendentes", () => {
  it("deixa de fora rascunhos, posts sem texto e os já publicados", () => {
    const fila = pendentes(
      [
        post({ slug: "novo" }),
        post({ slug: "rascunho", rascunho: true }),
        post({ slug: "sem-texto", social: {} }),
        post({ slug: "em-branco", social: { bluesky: "  " } }),
        post({ slug: "publicado" }),
      ],
      {
        bluesky: {
          publicado: {
            url: "https://bsky.app/profile/x/post/1",
            id: "at://x/app.bsky.feed.post/1",
            publicadoEm: "2026-10-13T12:00:00.000Z",
          },
        },
      },
      "bluesky",
      "2026-10-16",
    );
    expect(fila.map((p) => p.slug)).toEqual(["novo"]);
  });

  it("ignora posts com mais de 14 dias e ordena do mais antigo", () => {
    const fila = pendentes(
      [
        post({ slug: "c", data: "2026-10-16T00:00:00.000Z" }),
        post({ slug: "antigo", data: "2026-10-01T00:00:00.000Z" }),
        post({ slug: "b", data: "2026-10-02T00:00:00.000Z" }),
      ],
      {},
      "bluesky",
      "2026-10-16",
    );
    expect(fila.map((p) => p.slug)).toEqual(["b", "c"]);
  });
});

describe("hoje", () => {
  it("usa o horário de Brasília", () => {
    // 01h em UTC ainda é o dia anterior em Brasília
    expect(hoje(new Date("2026-10-17T01:00:00Z"))).toBe("2026-10-16");
  });
});
