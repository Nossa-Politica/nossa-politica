"use client";

import { useEffect, useState } from "react";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

interface Dia {
  data: string;
  presentes: number;
  total: number;
}

/** Agrupa o calendário (uma entrada por sessão) em dias. */
function porDia(calendario: Array<[string, 0 | 1]>): Map<string, Dia> {
  const dias = new Map<string, Dia>();
  for (const [data, presente] of calendario) {
    const dia = dias.get(data) ?? { data, presentes: 0, total: 0 };
    dia.total++;
    dia.presentes += presente;
    dias.set(data, dia);
  }
  return dias;
}

/** Semanas (colunas) do ano inteiro, de domingo a sábado, para os anos ficarem alinhados. */
function semanasDoAno(ano: number, dias: Map<string, Dia>) {
  const datas = [...dias.keys()]
    .filter((d) => d.startsWith(String(ano)))
    .sort();
  if (datas.length === 0) return [];
  const inicio = new Date(`${ano}-01-01T12:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - inicio.getUTCDay());
  const fim = new Date(`${ano}-12-31T12:00:00Z`);
  const semanas: Array<Array<{ data: string; dia?: Dia }>> = [];
  for (const d = new Date(inicio); d <= fim; d.setUTCDate(d.getUTCDate() + 7)) {
    const semana = [];
    for (let i = 0; i < 7; i++) {
      const atual = new Date(d);
      atual.setUTCDate(d.getUTCDate() + i);
      const data = atual.toISOString().slice(0, 10);
      semana.push({ data, dia: dias.get(data) });
    }
    semanas.push(semana);
  }
  return semanas;
}

function classeDoDia(dia?: Dia) {
  if (!dia) return "bg-transparent";
  if (dia.presentes === dia.total) return "bg-serie";
  if (dia.presentes === 0) return "bg-contexto";
  return "bg-serie-fraca";
}

/**
 * Calendário de presença: cada quadrado é um dia com sessão. Presente em azul,
 * ausente em cinza (sem vermelho: ausência não é julgada aqui, só registrada).
 *
 * Desenhado só no navegador: são milhares de quadrados, que pesariam no HTML de
 * cada página. Os números estão na tabela logo abaixo, que vem no HTML.
 */
export function Calendario({
  calendario,
}: {
  calendario: Array<[string, 0 | 1]>;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) {
    const anos = new Set(calendario.map(([data]) => data.slice(0, 4))).size;
    return <div style={{ minHeight: anos * 80 + 24 }} aria-hidden="true" />;
  }
  const dias = porDia(calendario);
  const anos = [
    ...new Set([...dias.keys()].map((d) => Number(d.slice(0, 4)))),
  ].sort();
  return (
    <div className="flex flex-col gap-4">
      {anos.map((ano) => {
        const semanas = semanasDoAno(ano, dias);
        return (
          <figure key={ano} className="flex flex-col gap-1">
            <figcaption className="text-xs font-medium text-muted-foreground">
              {ano}
            </figcaption>
            {/* As semanas dividem a largura toda: o ano inteiro cabe na tela do celular */}
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `1.5rem repeat(${semanas.length}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(7, auto)",
                gridAutoFlow: "column",
              }}
              aria-hidden="true"
            >
              {DIAS.map((d, i) => (
                <span
                  key={d}
                  className="text-[9px] leading-none text-muted-foreground"
                >
                  {i % 2 === 1 ? d : ""}
                </span>
              ))}
              {semanas.flatMap((semana) =>
                semana.map(({ data, dia }) => (
                  <span
                    key={data}
                    className={`aspect-square w-full rounded-[2px] ${classeDoDia(dia)}`}
                    title={
                      dia
                        ? `${data.split("-").reverse().join("/")}: ${
                            dia.presentes === dia.total
                              ? "presente"
                              : dia.presentes === 0
                                ? "ausente"
                                : `presente em ${dia.presentes} de ${dia.total}`
                          }`
                        : undefined
                    }
                  />
                )),
              )}
            </div>
          </figure>
        );
      })}
      <ul
        className="flex flex-wrap gap-4 text-xs text-muted-foreground"
        aria-label="Legenda"
      >
        <li className="flex items-center gap-1.5">
          <span className="size-[11px] rounded-[2px] bg-serie" /> Presente
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-[11px] rounded-[2px] bg-serie-fraca" /> Presente
          em parte
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-[11px] rounded-[2px] bg-contexto" /> Ausente
        </li>
      </ul>
    </div>
  );
}
