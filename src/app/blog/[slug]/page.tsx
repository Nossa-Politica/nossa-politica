import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConteudoMdx } from "@/components/blog/conteudo-mdx";
import { DadosEstruturados } from "@/components/dados-estruturados";
import { Compartilhar } from "@/components/perfil/compartilhar";
import { minutosDeLeitura, postPorSlug, postsPublicados } from "@/lib/blog";
import { formatarData } from "@/lib/formatar";
import { ORGANIZACAO, URL_DO_SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return postsPublicados().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = postPorSlug(slug);
  if (!post) return {};
  const imagem = `/og/blog/${post.slug}.png`;
  return {
    title: `${post.titulo} · Nossa Política`,
    description: post.resumo,
    alternates: { canonical: post.url },
    openGraph: {
      type: "article",
      title: post.titulo,
      description: post.resumo,
      publishedTime: post.data,
      images: [{ url: imagem, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [imagem] },
  };
}

export default async function PaginaPost({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = postPorSlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.titulo,
          description: post.resumo,
          datePublished: post.data,
          url: `${URL_DO_SITE}${post.url}`,
          image: `${URL_DO_SITE}/og/blog/${post.slug}.png`,
          inLanguage: "pt-BR",
          author: ORGANIZACAO,
          publisher: ORGANIZACAO,
        }}
      />
      <article className="flex flex-col">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/blog" className="underline underline-offset-2">
              Blog
            </Link>{" "}
            · {formatarData(post.data)} · {minutosDeLeitura(post)} min de
            leitura
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight">
            {post.titulo}
          </h1>
          <p className="text-lg text-muted-foreground">{post.resumo}</p>
        </header>
        <div className="text-[1.0625rem]">
          <ConteudoMdx codigo={post.corpo} />
        </div>
      </article>
      <footer className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Compartilhar titulo={post.titulo} />
        <Link href="/blog" className="text-sm underline underline-offset-2">
          Mais posts
        </Link>
      </footer>
    </main>
  );
}
