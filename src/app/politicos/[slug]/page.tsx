import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DadosEstruturados } from "@/components/dados-estruturados";
import { BlocoEleicoes } from "@/components/perfil/bloco-eleicoes";
import { BlocoEmendas } from "@/components/perfil/bloco-emendas";
import { BlocoGastos } from "@/components/perfil/bloco-gastos";
import { BlocoPresenca } from "@/components/perfil/bloco-presenca";
import { BlocoProjetos } from "@/components/perfil/bloco-projetos";
import { BlocoVotacoes } from "@/components/perfil/bloco-votacoes";
import { Cabecalho } from "@/components/perfil/cabecalho";
import { CartoesResumo } from "@/components/perfil/cartoes-resumo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cargo,
  formatarInteiro,
  NOME_DA_CASA,
  nomeLegislatura,
  UFS,
} from "@/lib/formatar";
import {
  carregarPerfil,
  type MandatoDoPerfil,
  slugsDosPerfis,
} from "@/lib/perfil";
import { URL_DO_SITE } from "@/lib/site";

// Todas as páginas são geradas no build; endereço fora da lista é 404
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsDosPerfis().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/politicos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const perfil = carregarPerfil(slug);
  if (!perfil) return {};
  const { pessoa } = perfil;
  const descricao = `${cargo(pessoa.casa, pessoa.sexo)} (${pessoa.partido}-${pessoa.uf}): gastos, projetos, votações, presença, emendas e eleições, com dados oficiais.`;
  // Imagem própria gerada no build (scripts/og/gerar.tsx); sem ela, a padrão
  const imagem = `/og/politicos/${slug}.png`;
  const temImagem = existsSync(join(process.cwd(), "public", imagem));
  return {
    title: `${pessoa.nome} · Nossa Política`,
    description: descricao,
    alternates: { canonical: `/politicos/${slug}` },
    openGraph: {
      title: pessoa.nome,
      description: descricao,
      type: "profile",
      ...(temImagem && {
        images: [{ url: imagem, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      ...(temImagem && { images: [imagem] }),
    },
  };
}

function rotuloAba(m: MandatoDoPerfil) {
  return `${m.casa === "camara" ? "Câmara" : "Senado"} ${m.mandato.idLegislatura}ª`;
}

/** Os blocos de um mandato (uma legislatura numa casa). */
function Mandato({
  m,
  atualizadoEm,
}: {
  m: MandatoDoPerfil;
  atualizadoEm?: string;
}) {
  const id = (bloco: string) => `${bloco}-${m.chave}`;
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        {nomeLegislatura(m.mandato.idLegislatura)} · {m.mandato.partido} ·{" "}
        {UFS[m.mandato.uf] ?? m.mandato.uf} ·{" "}
        {formatarInteiro(m.mandato.diasEmExercicio)} dias no cargo
      </p>
      <CartoesResumo casa={m.casa} mandato={m.mandato} medianas={m.medianas} />
      <BlocoGastos
        id={id("gastos")}
        casa={m.casa}
        mandato={m.mandato}
        medianaUf={m.medianas.uf}
        atualizadoEm={atualizadoEm}
      />
      <BlocoProjetos
        id={id("projetos")}
        casa={m.casa}
        mandato={m.mandato}
        medianaCasa={m.medianas.casa}
        atualizadoEm={atualizadoEm}
      />
      <BlocoVotacoes
        id={id("votacoes")}
        casa={m.casa}
        mandato={m.mandato}
        recentes={m.votosRecentes}
        atualizadoEm={atualizadoEm}
      />
      <BlocoPresenca
        id={id("presenca")}
        casa={m.casa}
        mandato={m.mandato}
        medianaCasa={m.medianas.casa}
        atualizadoEm={atualizadoEm}
      />
    </div>
  );
}

export default async function PaginaPolitico({
  params,
}: PageProps<"/politicos/[slug]">) {
  const { slug } = await params;
  const perfil = carregarPerfil(slug);
  if (!perfil) notFound();
  const { pessoa, mandatos, emendas, eleicoes, atualizadoEm } = perfil;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <DadosEstruturados
        dados={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: pessoa.nome,
          ...(pessoa.nomeCivil && { alternateName: pessoa.nomeCivil }),
          image: pessoa.urlFoto,
          url: `${URL_DO_SITE}/politicos/${pessoa.slug}`,
          ...(pessoa.emExercicio && {
            jobTitle: cargo(pessoa.casa, pessoa.sexo),
            worksFor: {
              "@type": "GovernmentOrganization",
              name: NOME_DA_CASA[pessoa.casa],
            },
          }),
          affiliation: { "@type": "Organization", name: pessoa.partido },
        }}
      />
      <Cabecalho pessoa={pessoa} mandatos={mandatos} />

      {mandatos.length === 1 ? (
        <Mandato
          m={mandatos[0]}
          atualizadoEm={atualizadoEm[mandatos[0].casa]}
        />
      ) : (
        <Tabs defaultValue={mandatos[0].chave} className="gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Escolha o mandato:</p>
            <TabsList className="flex-wrap">
              {mandatos.map((m) => (
                <TabsTrigger key={m.chave} value={m.chave}>
                  {rotuloAba(m)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {mandatos.map((m) => (
            <TabsContent key={m.chave} value={m.chave}>
              <Mandato m={m} atualizadoEm={atualizadoEm[m.casa]} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <BlocoEmendas
        id="emendas"
        emendas={emendas}
        ufDoParlamentar={pessoa.uf}
        atualizadoEm={atualizadoEm.emendas}
      />
      <BlocoEleicoes
        id="eleicoes"
        eleicoes={eleicoes}
        atualizadoEm={atualizadoEm.tse}
      />

      <p className="border-t pt-6 text-xs text-muted-foreground">
        Como calculamos cada número:{" "}
        <Link href="/metodologia" className="underline underline-offset-2">
          metodologia
        </Link>
        . Todos os parlamentares são avaliados pelos mesmos critérios.
      </p>
    </main>
  );
}
