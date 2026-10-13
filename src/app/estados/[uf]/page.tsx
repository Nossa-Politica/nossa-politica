import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarrasHorizontais } from "@/components/perfil/barras-horizontais";
import { TermoGlossario } from "@/components/perfil/comum";
import { GraficoColunas } from "@/components/perfil/grafico-colunas";
import { lerFontes } from "@/lib/dados";
import { carregarEstado } from "@/lib/estados";
import {
  deUf,
  formatarData,
  formatarMoeda,
  formatarMoedaCurta,
  formatarPercentual,
  nomeLegislatura,
  paraUf,
  UFS,
} from "@/lib/formatar";
import type { ResumoPessoa } from "@/lib/tipos-indicadores";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(UFS).map((uf) => ({ uf: uf.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: PageProps<"/estados/[uf]">): Promise<Metadata> {
  const { uf } = await params;
  const nome = UFS[uf.toUpperCase()];
  if (!nome) return {};
  return {
    title: `${nome} · Nossa Política`,
    description: `Senadores e deputados federais ${deUf(uf.toUpperCase())}, gastos da bancada e emendas enviadas para o estado.`,
  };
}

function Pessoa({ p }: { p: ResumoPessoa }) {
  return (
    <li>
      <Link
        href={`/politicos/${p.slug}`}
        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
      >
        <Image
          src={p.foto}
          alt=""
          width={36}
          height={48}
          unoptimized
          loading="lazy"
          className="h-12 w-9 shrink-0 rounded bg-muted object-cover"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{p.nome}</span>
          <span className="text-xs text-muted-foreground">
            {p.partido} · presença{" "}
            {p.presenca === null ? "—" : formatarPercentual(p.presenca)} ·{" "}
            {p.gastoMensal === null
              ? "—"
              : `${formatarMoedaCurta(p.gastoMensal)}/mês`}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default async function PaginaEstado({
  params,
}: PageProps<"/estados/[uf]">) {
  const { uf: ufMinusculo } = await params;
  const uf = ufMinusculo.toUpperCase();
  const nome = UFS[uf];
  if (!nome) notFound();
  const estado = carregarEstado(uf);
  const fontes = lerFontes();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/estados" className="underline underline-offset-2">
            Estados
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {nome}
        </h1>
        <p className="text-muted-foreground">
          {estado.senadores.length} senadores e {estado.deputados.length}{" "}
          deputados federais em exercício.
        </p>
      </header>

      <section className="flex flex-col gap-2" aria-labelledby="senadores">
        <h2 id="senadores" className="font-heading text-xl font-semibold">
          Senado
        </h2>
        <ul>
          {estado.senadores.map((p) => (
            <Pessoa key={p.slug} p={p} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="deputados">
        <h2 id="deputados" className="font-heading text-xl font-semibold">
          Câmara dos Deputados
        </h2>
        {estado.medianaPresenca.camara !== null && (
          <p className="text-sm text-muted-foreground">
            Presença mediana da bancada:{" "}
            {formatarPercentual(estado.medianaPresenca.camara)}.
          </p>
        )}
        <ul>
          {estado.deputados.map((p) => (
            <Pessoa key={p.slug} p={p} />
          ))}
        </ul>
      </section>

      <section
        className="flex flex-col gap-2 border-t pt-8"
        aria-labelledby="gastos"
      >
        <h2 id="gastos" className="font-heading text-xl font-semibold">
          Gastos da bancada com a{" "}
          <TermoGlossario chave="cota">cota parlamentar</TermoGlossario>
        </h2>
        <p className="text-sm">
          Na {nomeLegislatura(estado.gastos.camara.legislatura ?? 57)}, os
          deputados {deUf(uf)} gastaram{" "}
          <strong>{formatarMoeda(estado.gastos.camara.total)}</strong> (
          {estado.gastos.camara.parlamentares} pessoas, contando suplentes) e os
          senadores <strong>{formatarMoeda(estado.gastos.senado.total)}</strong>{" "}
          ({estado.gastos.senado.parlamentares} pessoas).
        </p>
      </section>

      {estado.emendas && (
        <section
          className="flex flex-col gap-4 border-t pt-8"
          aria-labelledby="emendas"
        >
          <div className="flex flex-col gap-1">
            <h2 id="emendas" className="font-heading text-xl font-semibold">
              <TermoGlossario chave="emenda">Emendas</TermoGlossario> enviadas{" "}
              {paraUf(uf)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Desde 2020: {formatarMoeda(estado.emendas.empenhado)} empenhados,
              dos quais {formatarMoeda(estado.emendas.pago)} pagos. Inclui
              emendas individuais, de bancada, de comissão e de relator.
            </p>
          </div>
          <GraficoColunas
            dados={estado.emendas.porAno.map((a) => ({
              chave: String(a.ano),
              valor: a.empenhado,
            }))}
            eixo="ano"
            rotulo="Empenhado"
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Por tipo de emenda</h3>
            <BarrasHorizontais
              rotulo="Emendas por tipo"
              formatar={formatarMoedaCurta}
              itens={estado.emendas.porTipo.map((t) => ({
                nome: t.tipo
                  .replace(/^Emenda Individual - /, "Individual: ")
                  .replace(/^Emenda de /, ""),
                valor: t.empenhado,
              }))}
            />
          </div>
          {estado.emendas.porParlamentar.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                Quem mais indicou emendas para o estado
              </h3>
              <BarrasHorizontais
                rotulo="Parlamentares que mais indicaram emendas para o estado"
                formatar={formatarMoedaCurta}
                itens={estado.emendas.porParlamentar.map((p) => ({
                  nome: p.uf === uf ? p.nome : `${p.nome} (${p.uf})`,
                  valor: p.empenhado,
                }))}
              />
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Fontes: Câmara dos Deputados, Senado Federal e Portal da Transparência
        {fontes?.camara?.atualizadoEm &&
          ` · Atualizado em ${formatarData(fontes.camara.atualizadoEm)}`}
      </p>
    </main>
  );
}
