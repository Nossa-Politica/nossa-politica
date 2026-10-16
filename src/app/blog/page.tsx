import type { Metadata } from "next";
import Link from "next/link";
import { minutosDeLeitura, postsPublicados } from "@/lib/blog";
import { formatarData } from "@/lib/formatar";

export const metadata: Metadata = {
  title: "Blog · Nossa Política",
  description:
    "Análises sobre o que os dados públicos do Congresso mostram, sempre com a fonte.",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function PaginaBlog() {
  const posts = postsPublicados();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Blog
        </h1>
        <p className="text-muted-foreground">
          O que os dados públicos do Congresso mostram, sempre com link para a
          fonte.{" "}
          <a href="/rss.xml" className="underline underline-offset-2">
            Assine pelo RSS
          </a>
          .
        </p>
      </header>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Nenhum post publicado ainda.</p>
      ) : (
        <ol className="flex flex-col divide-y">
          {posts.map((post) => (
            <li key={post.slug} className="py-4">
              <Link
                href={post.url}
                className="flex flex-col gap-1 hover:opacity-80"
              >
                <span className="text-sm text-muted-foreground">
                  {formatarData(post.data)} · {minutosDeLeitura(post)} min de
                  leitura
                </span>
                <span className="font-heading text-xl font-semibold">
                  {post.titulo}
                </span>
                <span className="text-muted-foreground">{post.resumo}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
