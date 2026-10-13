"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizarTermo } from "@/lib/busca";
import { UFS } from "@/lib/formatar";

const VISIVEIS = 30;

/** [nome, slug, partido no dia, UF, voto] */
type VotoNominal = [string, string, string, string, string];

/**
 * Como cada um votou, com filtro por estado, voto e nome. Montada no
 * navegador: são centenas de linhas por votação, que pesariam em cada página.
 */
export function ListaNominal({ votos }: { votos: VotoNominal[] }) {
  const [uf, setUf] = useState("");
  const [voto, setVoto] = useState("");
  const [nome, setNome] = useState("");
  const [montado, setMontado] = useState(false);
  const [todos, setTodos] = useState(false);
  useEffect(() => setMontado(true), []);

  const tiposDeVoto = useMemo(
    () =>
      [...new Set(votos.map((v) => v[4]))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [votos],
  );
  const filtrados = votos.filter(
    (v) =>
      (!uf || v[3] === uf) &&
      (!voto || v[4] === voto) &&
      (!nome || normalizarTermo(v[0]).includes(normalizarTermo(nome))),
  );

  if (!montado) {
    return <p className="text-sm text-muted-foreground">Carregando a lista…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="h-10 rounded-lg border bg-background px-2 text-base"
          >
            <option value="">Todos</option>
            {Object.entries(UFS)
              .sort(([, a], [, b]) => a.localeCompare(b, "pt-BR"))
              .map(([sigla, n]) => (
                <option key={sigla} value={sigla}>
                  {n}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Voto</span>
          <select
            value={voto}
            onChange={(e) => setVoto(e.target.value)}
            className="h-10 rounded-lg border bg-background px-2 text-base"
          >
            <option value="">Todos</option>
            {tiposDeVoto.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
          <span className="text-muted-foreground">Nome</span>
          <input
            type="search"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-10 rounded-lg border bg-background px-2 text-base"
          />
        </label>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtrados.length} de {votos.length}
      </p>
      <ul className="flex flex-col divide-y text-sm">
        {(todos ? filtrados : filtrados.slice(0, VISIVEIS)).map(
          ([n, slug, partido, ufVoto, v]) => (
            <li
              key={`${slug}-${n}`}
              className="flex items-baseline justify-between gap-3 py-2"
            >
              <span className="min-w-0">
                {slug ? (
                  <Link
                    href={`/politicos/${slug}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {n}
                  </Link>
                ) : (
                  n
                )}
                <span className="text-muted-foreground">
                  {" "}
                  · {partido}-{ufVoto}
                </span>
              </span>
              <span className="shrink-0 font-medium">{v}</span>
            </li>
          ),
        )}
      </ul>
      {!todos && filtrados.length > VISIVEIS && (
        <button
          type="button"
          onClick={() => setTodos(true)}
          className="h-11 rounded-lg border text-sm"
        >
          Mostrar todos ({filtrados.length})
        </button>
      )}
    </div>
  );
}
