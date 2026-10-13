"use client";

import Link from "next/link";
import { useState } from "react";
import { UFS } from "@/lib/formatar";
import { ItemPessoa } from "./item-pessoa";
import { useIndiceBusca } from "./use-indice-busca";

/** Escolhe o estado e lista os senadores e deputados federais em exercício. */
export function QuemMeRepresenta() {
  const { estado, itens, carregar } = useIndiceBusca();
  const [uf, setUf] = useState("");

  const doEstado = itens
    .filter((i) => i.e && i.u === uf)
    .sort((a, b) => a.n.localeCompare(b.n, "pt-BR"));
  const senadores = doEstado.filter((i) => i.c.startsWith("Senador"));
  const deputados = doEstado.filter((i) => i.c.startsWith("Deputad"));

  return (
    <section
      aria-labelledby="quem-me-representa"
      className="flex flex-col gap-3"
    >
      <h2
        id="quem-me-representa"
        className="font-heading text-xl font-semibold"
      >
        Quem me representa?
      </h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span>Escolha o seu estado</span>
        <select
          value={uf}
          onFocus={carregar}
          onChange={(e) => {
            carregar();
            setUf(e.target.value);
          }}
          className="h-11 rounded-lg border bg-background px-3 text-base"
        >
          <option value="">Selecione…</option>
          {Object.entries(UFS)
            .sort(([, a], [, b]) => a.localeCompare(b, "pt-BR"))
            .map(([sigla, nome]) => (
              <option key={sigla} value={sigla}>
                {nome}
              </option>
            ))}
        </select>
      </label>

      {uf && estado === "carregando" && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}
      {uf && estado === "pronto" && (
        <div className="flex flex-col gap-4">
          <Link
            href={`/estados/${uf.toLowerCase()}`}
            className="text-sm underline underline-offset-2"
          >
            Ver gastos e emendas de {UFS[uf]}
          </Link>
          <div>
            <h3 className="text-sm font-medium">Senado ({senadores.length})</h3>
            <ul>
              {senadores.map((i) => (
                <li key={i.s}>
                  <ItemPessoa item={i} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">
              Câmara dos Deputados ({deputados.length})
            </h3>
            <ul>
              {deputados.map((i) => (
                <li key={i.s}>
                  <ItemPessoa item={i} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
