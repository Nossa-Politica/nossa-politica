import { autorPorSlug, postsPublicados, URL_DO_SITE } from "@/lib/blog";

// Gerado no build como arquivo estático
export const dynamic = "force-static";

const escapar = (texto: string) =>
  texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function GET() {
  const posts = postsPublicados().slice(0, 30);
  const itens = posts
    .map((post) => {
      const url = `${URL_DO_SITE}${post.url}`;
      return `    <item>
      <title>${escapar(post.titulo)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.data.slice(0, 10)}T12:00:00-03:00`).toUTCString()}</pubDate>
      <dc:creator>${escapar(autorPorSlug(post.autor).nome)}</dc:creator>
      <description>${escapar(post.resumo)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nossa Política</title>
    <link>${URL_DO_SITE}/blog</link>
    <atom:link href="${URL_DO_SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>O que os dados públicos do Congresso mostram, sempre com a fonte.</description>
    <language>pt-BR</language>
${itens}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
