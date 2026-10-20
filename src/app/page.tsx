import type { Metadata } from "next";
import Link from "next/link";
import { CampoBusca } from "@/components/busca/campo-busca";
import { QuemMeRepresenta } from "@/components/busca/quem-me-representa";
import { DadosEstruturados } from "@/components/dados-estruturados";
import { ItemVotacao } from "@/components/votacoes/item-votacao";
import { postsPublicados } from "@/lib/blog";
import { existemDados, lerFontes, listarVotacoes } from "@/lib/dados";
import { formatarData } from "@/lib/formatar";
import { ORGANIZACAO, URL_DO_SITE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
};

export default function Home() {
  const atualizadoEm = lerFontes()?.camara?.atualizadoEm;
  const posts = postsPublicados().slice(0, 3);
  const ultimas = (["camara", "senado"] as const)
    .flatMap((casa) =>
      listarVotacoes(casa)
        .slice(0, 4)
        .map((votacao) => ({ casa, votacao })),
    )
    .sort((a, b) => b.votacao.data.localeCompare(a.votacao.data))
    .slice(0, 5);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-10">
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@graph": [
            { ...ORGANIZACAO, "@id": `${URL_DO_SITE}/#organizacao` },
            {
              "@type": "WebSite",
              name: "Nossa Política",
              url: URL_DO_SITE,
              inLanguage: "pt-BR",
              publisher: { "@id": `${URL_DO_SITE}/#organizacao` },
            },
          ],
        }}
      />
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          O que o seu político fez?
        </h1>
        <p className="text-lg text-muted-foreground">
          Gastos, projetos, votações, presença e emendas de deputados federais e
          senadores, com dados oficiais e comparados com os colegas.
        </p>
        {existemDados() ? (
          <CampoBusca />
        ) : (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            Os dados ainda não foram carregados nesta versão do site.
          </p>
        )}
      </section>

      {existemDados() && <QuemMeRepresenta />}

      {ultimas.length > 0 && (
        <section
          aria-labelledby="ultimas-votacoes"
          className="flex flex-col gap-2"
        >
          <h2
            id="ultimas-votacoes"
            className="font-heading text-xl font-semibold"
          >
            Últimas votações
          </h2>
          <ol className="flex flex-col divide-y">
            {ultimas.map(({ casa, votacao }) => (
              <ItemVotacao
                key={`${casa}-${votacao.id}`}
                casa={casa}
                votacao={votacao}
              />
            ))}
          </ol>
          <Link
            href="/votacoes"
            className="text-sm underline underline-offset-2"
          >
            Ver todas as votações
          </Link>
        </section>
      )}

      {posts.length > 0 && (
        <section
          aria-labelledby="ultimos-posts"
          className="flex flex-col gap-2"
        >
          <h2 id="ultimos-posts" className="font-heading text-xl font-semibold">
            No blog
          </h2>
          <ol className="flex flex-col divide-y">
            {posts.map((post) => (
              <li key={post.slug} className="py-3">
                <Link
                  href={post.url}
                  className="flex flex-col gap-1 hover:opacity-80"
                >
                  <span className="font-medium">{post.titulo}</span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {post.resumo}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {existemDados() && (
        <section aria-labelledby="mais" className="grid gap-3 sm:grid-cols-3">
          <h2 id="mais" className="sr-only">
            Mais formas de explorar
          </h2>
          {[
            [
              "/explorar",
              "Explorar",
              "Todos lado a lado em um indicador, com filtros",
            ],
            [
              "/comparar",
              "Comparar",
              "Dois ou três parlamentares nos mesmos números",
            ],
            ["/estados", "Estados", "A bancada e as emendas de cada estado"],
          ].map(([href, titulo, texto]) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-1 rounded-xl border p-4 hover:bg-muted"
            >
              <span className="font-medium">{titulo}</span>
              <span className="text-sm text-muted-foreground">{texto}</span>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <h2 className="font-heading text-base font-semibold text-foreground">
          De onde vêm os dados
        </h2>
        <p>
          Câmara dos Deputados, Senado Federal, Portal da Transparência e
          Tribunal Superior Eleitoral. Todos os números têm link para a fonte, e
          as mesmas regras valem para todos.
          {atualizadoEm && (
            <> Última atualização: {formatarData(atualizadoEm)}.</>
          )}
        </p>
      </section>
    </main>
  );
}
