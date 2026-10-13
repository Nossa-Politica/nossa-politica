"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CampoBusca } from "@/components/busca/campo-busca";
import { colegas } from "@/lib/formatar";
import {
  type ChaveIndicador,
  INDICADORES,
  type MedianasResumo,
  type ResumoPessoa,
} from "@/lib/tipos-indicadores";
import { formatarIndicador } from "./explorar";
import { useIndicadores } from "./use-indicadores";

const MAXIMO = 3;

const MEDIANA_DO_INDICADOR: Partial<
  Record<ChaveIndicador, keyof MedianasResumo>
> = {
  presenca: "presenca",
  primeiroAutor: "primeiroAutor",
  viraramNorma: "viraramNorma",
  gastoMensal: "gastoMensal",
};

/** Lê `?p=slug1,slug2` do endereço e o mantém atualizado. */
function useSlugsNoEndereco(): [string[], (s: string[]) => void] {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("p");
    if (p) setSlugs(p.split(",").filter(Boolean).slice(0, MAXIMO));
  }, []);
  const atualizar = (novos: string[]) => {
    setSlugs(novos);
    window.history.replaceState(
      null,
      "",
      novos.length > 0 ? `?p=${novos.join(",")}` : window.location.pathname,
    );
  };
  return [slugs, atualizar];
}

/** Dois ou três parlamentares lado a lado, cada número com a mediana da casa. */
export function Comparar() {
  const { dados, erro } = useIndicadores();
  const [slugs, setSlugs] = useSlugsNoEndereco();
  const pessoas = slugs
    .map((s) => dados?.pessoas.find((p) => p.slug === s))
    .filter((p): p is ResumoPessoa => p !== undefined);

  return (
    <div className="flex flex-col gap-6">
      {pessoas.length < MAXIMO && (
        <CampoBusca
          rotulo={
            pessoas.length === 0
              ? "Escolha quem comparar"
              : "Adicionar mais alguém"
          }
          aoEscolher={(item) => {
            if (!slugs.includes(item.s)) setSlugs([...slugs, item.s]);
          }}
        />
      )}

      {erro && (
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados.
        </p>
      )}

      {pessoas.length > 0 && dados && (
        <div className="flex flex-col gap-4">
          {/* Uma coluna por pessoa; cada indicador tem o nome numa linha e os
              valores lado a lado embaixo, para caber três no celular */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${pessoas.length}, minmax(0, 1fr))`,
            }}
          >
            {pessoas.map((p) => (
              <div key={p.slug} className="flex min-w-0 flex-col gap-1.5">
                <Image
                  src={p.foto}
                  alt=""
                  width={48}
                  height={64}
                  unoptimized
                  className="h-16 w-12 rounded-md bg-muted object-cover"
                />
                <Link
                  href={`/politicos/${p.slug}`}
                  className="text-sm font-medium leading-tight underline-offset-2 hover:underline"
                >
                  {p.nome}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {p.partido}-{p.uf} · {p.cargo}
                </span>
                <button
                  type="button"
                  onClick={() => setSlugs(slugs.filter((s) => s !== p.slug))}
                  className="flex w-fit items-center gap-1 text-xs text-muted-foreground underline underline-offset-2"
                >
                  <X className="size-3" aria-hidden="true" /> Remover
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col divide-y border-t">
            {(Object.keys(INDICADORES) as ChaveIndicador[]).map((chave) => {
              const chaveMediana = MEDIANA_DO_INDICADOR[chave];
              return (
                <div key={chave} className="flex flex-col gap-1.5 py-3">
                  <h3 className="text-sm font-normal text-muted-foreground">
                    {INDICADORES[chave].rotulo}
                  </h3>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${pessoas.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {pessoas.map((p) => {
                      const med = chaveMediana
                        ? dados.medianas[p.casa][chaveMediana]
                        : null;
                      return (
                        <div key={p.slug} className="min-w-0">
                          <span className="sr-only">{p.nome}: </span>
                          <span className="block font-heading text-lg font-semibold tabular-nums">
                            {formatarIndicador(chave, p[chave])}
                          </span>
                          {med !== null && (
                            <span className="block text-xs text-muted-foreground">
                              Mediana dos {colegas(p.casa)}:{" "}
                              {formatarIndicador(chave, med)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Números do mandato mais recente de cada um. O gasto da cota depende
            do estado: compare com cuidado parlamentares de estados diferentes.
            Detalhes na página de cada um.
          </p>
        </div>
      )}
    </div>
  );
}
