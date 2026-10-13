import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { postsPublicados, todosOsAutores } from "@/lib/blog";
import { formatarData } from "@/lib/formatar";

export const dynamicParams = false;

export function generateStaticParams() {
  return todosOsAutores().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/autores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const autor = todosOsAutores().find((a) => a.slug === slug);
  return autor
    ? { title: `${autor.nome} · Nossa Política`, description: autor.bio }
    : {};
}

export default async function PaginaAutor({
  params,
}: PageProps<"/blog/autores/[slug]">) {
  const { slug } = await params;
  const autor = todosOsAutores().find((a) => a.slug === slug);
  if (!autor) notFound();
  const posts = postsPublicados().filter((p) => p.autor === autor.slug);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/blog" className="underline underline-offset-2">
            Blog
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {autor.nome}
        </h1>
        <p className="text-muted-foreground">{autor.bio}</p>
        {autor.url && (
          <a
            href={autor.url}
            className="text-sm underline underline-offset-2"
            rel="noopener"
          >
            {autor.url.replace(/^https?:\/\//, "")}
          </a>
        )}
      </header>
      <ol className="flex flex-col divide-y">
        {posts.map((post) => (
          <li key={post.slug} className="py-4">
            <Link
              href={post.url}
              className="flex flex-col gap-1 hover:opacity-80"
            >
              <span className="text-sm text-muted-foreground">
                {formatarData(post.data)}
              </span>
              <span className="font-heading text-lg font-semibold">
                {post.titulo}
              </span>
              <span className="text-muted-foreground">{post.resumo}</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
