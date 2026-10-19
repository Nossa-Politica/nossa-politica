import type { MetadataRoute } from "next";
import { postsPublicados } from "@/lib/blog";
import { lerPessoas } from "@/lib/dados";
import { UFS } from "@/lib/formatar";
import { URL_DO_SITE } from "@/lib/site";
import { todasAsVotacoes } from "@/lib/votacoes";

// Gerado no build, como as páginas: lista tudo o que o site publica
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (caminho: string) => `${URL_DO_SITE}${caminho}`;
  const fixas = [
    "/",
    "/explorar",
    "/comparar",
    "/votacoes",
    "/estados",
    "/blog",
    "/metodologia",
  ].map((caminho) => ({ url: url(caminho) }));

  return [
    ...fixas,
    ...lerPessoas().map((p) => ({ url: url(`/politicos/${p.slug}`) })),
    ...Object.keys(UFS).map((uf) => ({
      url: url(`/estados/${uf.toLowerCase()}`),
    })),
    ...todasAsVotacoes().map((v) => ({
      url: url(`/votacoes/${v.casa}/${encodeURIComponent(v.id)}`),
      lastModified: v.data.slice(0, 10),
    })),
    ...postsPublicados().map((p) => ({
      url: url(p.url),
      lastModified: p.data.slice(0, 10),
    })),
  ];
}
