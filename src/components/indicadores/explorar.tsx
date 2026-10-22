"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatarInteiro,
  formatarMoeda,
  formatarMoedaCurta,
  formatarPercentual,
  UFS,
} from "@/lib/formatar";
import {
  type ChaveIndicador,
  INDICADORES,
  type ResumoPessoa,
} from "@/lib/tipos-indicadores";
import { useIndicadores } from "./use-indicadores";

const POR_PAGINA = 60;

export function formatarIndicador(chave: ChaveIndicador, valor: number | null) {
  if (valor === null) return "—";
  const { formato } = INDICADORES[chave];
  if (formato === "percentual") return formatarPercentual(valor);
  if (formato === "moeda") return formatarMoeda(valor);
  if (formato === "moedaCurta") return formatarMoedaCurta(valor);
  return formatarInteiro(valor);
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
}

interface Filtros {
  casa: "camara" | "senado";
  situacao: "exercicio" | "todos";
  uf: string;
  partido: string;
  indicador: ChaveIndicador;
  ordem: "desc" | "asc";
}

const PADRAO: Filtros = {
  casa: "camara",
  situacao: "exercicio",
  uf: "",
  partido: "",
  indicador: "presenca",
  ordem: "desc",
};

/** Lê e grava os filtros no endereço, para o link poder ser compartilhado. */
function useFiltrosNoEndereco(): [Filtros, (f: Partial<Filtros>) => void] {
  const [filtros, setFiltros] = useState<Filtros>(PADRAO);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setFiltros((atual) => ({
      ...atual,
      ...(p.get("casa") === "senado" ? { casa: "senado" } : {}),
      ...(p.get("situacao") === "todos" ? { situacao: "todos" } : {}),
      ...(p.get("uf") ? { uf: p.get("uf") ?? "" } : {}),
      ...(p.get("partido") ? { partido: p.get("partido") ?? "" } : {}),
      ...((p.get("indicador") ?? "") in INDICADORES
        ? { indicador: p.get("indicador") as ChaveIndicador }
        : {}),
      ...(p.get("ordem") === "asc" ? { ordem: "asc" } : {}),
    }));
  }, []);
  const atualizar = (mudanca: Partial<Filtros>) => {
    setFiltros((atual) => {
      const novo = { ...atual, ...mudanca };
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(novo)) {
        if (v !== PADRAO[k as keyof Filtros]) p.set(k, String(v));
      }
      const busca = p.toString();
      window.history.replaceState(
        null,
        "",
        busca ? `?${busca}` : window.location.pathname,
      );
      return novo;
    });
  };
  return [filtros, atualizar];
}

function Seletor({
  rotulo,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: Array<[string, string]>;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-10 rounded-lg border bg-background px-2 text-base"
      >
        {opcoes.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Lista de todos os parlamentares num indicador, com filtros. A mediana do
 * grupo filtrado aparece marcada em cada barra: a lista serve para comparar
 * com os pares, não para eleger o "pior".
 */
export function Explorar() {
  const { dados, erro } = useIndicadores();
  const [filtros, atualizar] = useFiltrosNoEndereco();
  const [limite, setLimite] = useState(POR_PAGINA);

  const partidos = useMemo(
    () =>
      [
        ...new Set(
          (dados?.pessoas ?? [])
            .filter((p) => p.casa === filtros.casa)
            .map((p) => p.partido),
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [dados, filtros.casa],
  );

  const { lista, semDado, med, maximo } = useMemo(() => {
    const grupo = (dados?.pessoas ?? []).filter(
      (p) =>
        p.casa === filtros.casa &&
        (filtros.situacao === "todos" || p.emExercicio) &&
        (!filtros.uf || p.uf === filtros.uf) &&
        (!filtros.partido || p.partido === filtros.partido),
    );
    const valor = (p: ResumoPessoa) => p[filtros.indicador];
    const comDado = grupo.filter((p) => valor(p) !== null);
    comDado.sort((a, b) => {
      const d = (valor(a) as number) - (valor(b) as number);
      return (
        (filtros.ordem === "desc" ? -d : d) ||
        a.nome.localeCompare(b.nome, "pt-BR")
      );
    });
    const valores = comDado.map((p) => valor(p) as number);
    return {
      lista: comDado,
      semDado: grupo.length - comDado.length,
      med: mediana(valores),
      maximo: Math.max(...valores, 0),
    };
  }, [dados, filtros]);

  const indicador = INDICADORES[filtros.indicador];
  const posicaoMediana =
    med !== null && maximo > 0 ? (med / maximo) * 100 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Seletor
          rotulo="Casa"
          valor={filtros.casa}
          aoMudar={(v) => {
            atualizar({ casa: v as Filtros["casa"], partido: "" });
            setLimite(POR_PAGINA);
          }}
          opcoes={[
            ["camara", "Câmara"],
            ["senado", "Senado"],
          ]}
        />
        <Seletor
          rotulo="Quem"
          valor={filtros.situacao}
          aoMudar={(v) => atualizar({ situacao: v as Filtros["situacao"] })}
          opcoes={[
            ["exercicio", "Em exercício"],
            ["todos", "Todos desde 2019"],
          ]}
        />
        <Seletor
          rotulo="Indicador"
          valor={filtros.indicador}
          aoMudar={(v) => atualizar({ indicador: v as ChaveIndicador })}
          opcoes={Object.entries(INDICADORES).map(([k, i]) => [k, i.rotulo])}
        />
        <Seletor
          rotulo="Estado"
          valor={filtros.uf}
          aoMudar={(v) => atualizar({ uf: v })}
          opcoes={[
            ["", "Todos"],
            ...Object.entries(UFS).sort(([, a], [, b]) =>
              a.localeCompare(b, "pt-BR"),
            ),
          ]}
        />
        <Seletor
          rotulo="Partido"
          valor={filtros.partido}
          aoMudar={(v) => atualizar({ partido: v })}
          opcoes={[
            ["", "Todos"],
            ...partidos.map((p): [string, string] => [p, p]),
          ]}
        />
        <Seletor
          rotulo="Ordem"
          valor={filtros.ordem}
          aoMudar={(v) => atualizar({ ordem: v as Filtros["ordem"] })}
          opcoes={[
            ["desc", "Do maior para o menor"],
            ["asc", "Do menor para o maior"],
          ]}
        />
      </div>

      {erro && (
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados.
        </p>
      )}
      {!dados && !erro && (
        // Ocupa a altura da tela enquanto carrega, para o rodapé não pular
        // quando a lista chega (CLS)
        <p className="min-h-svh text-sm text-muted-foreground">Carregando…</p>
      )}

      {dados && (
        <section aria-live="polite" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold">
              {indicador.rotulo}: mediana de{" "}
              {formatarIndicador(filtros.indicador, med)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lista.length}{" "}
              {lista.length === 1 ? "parlamentar" : "parlamentares"}
              {semDado > 0 && ` (${semDado} sem dado suficiente)`}.{" "}
              {indicador.explicacao} A linha cinza em cada barra marca a mediana
              deste grupo.
            </p>
          </div>
          <ol className="flex flex-col divide-y">
            {lista.slice(0, limite).map((p) => {
              const v = p[filtros.indicador] as number;
              return (
                <li key={p.slug} className="flex items-center gap-3 py-2">
                  <Image
                    src={p.foto}
                    alt=""
                    width={32}
                    height={42}
                    unoptimized
                    loading="lazy"
                    className="h-10 w-8 shrink-0 rounded bg-muted object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <Link
                        href={`/politicos/${p.slug}`}
                        className="truncate font-medium underline-offset-2 hover:underline"
                      >
                        {p.nome}
                      </Link>
                      <span className="shrink-0 tabular-nums">
                        {formatarIndicador(filtros.indicador, v)}
                      </span>
                    </div>
                    <div
                      className="relative h-1.5 rounded-full bg-contexto-fraco"
                      aria-hidden="true"
                    >
                      <div
                        className="h-1.5 rounded-full bg-serie"
                        style={{
                          width: `${maximo > 0 ? (v / maximo) * 100 : 0}%`,
                        }}
                      />
                      {posicaoMediana !== null && (
                        <span
                          className="absolute -top-1 h-3.5 w-0.5 bg-foreground/40"
                          style={{ left: `${posicaoMediana}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.partido}-{p.uf}
                      {!p.emExercicio && " · fora do cargo"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
          {lista.length > limite && (
            <button
              type="button"
              onClick={() => setLimite((l) => l + POR_PAGINA)}
              className="h-11 rounded-lg border text-sm"
            >
              Mostrar mais ({lista.length - limite} restantes)
            </button>
          )}
        </section>
      )}
    </div>
  );
}
