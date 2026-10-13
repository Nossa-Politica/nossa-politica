"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { ItemBusca } from "@/lib/busca";
import { ItemPessoa } from "./item-pessoa";
import { useIndiceBusca } from "./use-indice-busca";

/**
 * Busca por nome, partido ou estado, com resultados enquanto digita. Sem
 * `aoEscolher`, cada resultado leva ao perfil; com ele, o resultado é
 * escolhido ali mesmo (usado em Comparar).
 */
export function CampoBusca({
  rotulo = "Busque um deputado ou senador",
  aoEscolher,
}: {
  rotulo?: string;
  aoEscolher?: (item: ItemBusca) => void;
} = {}) {
  const { estado, carregar, buscar } = useIndiceBusca();
  const [termo, setTermo] = useState("");
  const idResultados = useId();
  const resultados = buscar(termo);
  const digitou = termo.trim().length >= 2;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${idResultados}-campo`} className="text-sm font-medium">
        {rotulo}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={`${idResultados}-campo`}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Nome, partido ou estado (ex.: Maria, PT, SP)"
          value={termo}
          onFocus={carregar}
          onChange={(e) => {
            carregar();
            setTermo(e.target.value);
          }}
          aria-controls={idResultados}
          className="h-12 pl-10 text-base"
        />
      </div>
      <div id={idResultados} aria-live="polite">
        {digitou && estado === "carregando" && (
          <p className="p-2 text-sm text-muted-foreground">
            Carregando a lista de políticos…
          </p>
        )}
        {digitou && estado === "erro" && (
          <p className="p-2 text-sm text-muted-foreground">
            Não foi possível carregar a busca. Tente recarregar a página.
          </p>
        )}
        {digitou && estado === "pronto" && resultados.length === 0 && (
          <p className="p-2 text-sm text-muted-foreground">
            Nenhum político encontrado.
          </p>
        )}
        {resultados.length > 0 && (
          <ul className="flex flex-col">
            {resultados.map((item) => (
              <li key={item.s}>
                {aoEscolher ? (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      aoEscolher(item);
                      setTermo("");
                    }}
                  >
                    <ItemPessoa item={item} comoLink={false} />
                  </button>
                ) : (
                  <ItemPessoa item={item} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
