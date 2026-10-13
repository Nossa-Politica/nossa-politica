"use client";

import MiniSearch from "minisearch";
import { useCallback, useRef, useState } from "react";
import { type ItemBusca, normalizarTermo } from "@/lib/busca";

export type EstadoIndice = "vazio" | "carregando" | "pronto" | "erro";

/**
 * Carrega o índice de busca na primeira interação (não pesa no carregamento da
 * página) e monta o MiniSearch: busca por prefixo, tolera erro de digitação e
 * ignora acentos.
 */
export function useIndiceBusca() {
  const [estado, setEstado] = useState<EstadoIndice>("vazio");
  const [itens, setItens] = useState<ItemBusca[]>([]);
  const busca = useRef<MiniSearch<ItemBusca> | null>(null);

  const carregar = useCallback(async () => {
    if (estado !== "vazio") return;
    setEstado("carregando");
    try {
      const resposta = await fetch("/api/busca");
      const dados: ItemBusca[] = await resposta.json();
      const indice = new MiniSearch<ItemBusca>({
        idField: "s",
        fields: ["n", "o", "p", "u"],
        storeFields: ["s", "n", "p", "u", "c", "e", "f"],
        processTerm: (termo) => normalizarTermo(termo),
        searchOptions: {
          prefix: true,
          fuzzy: 0.2,
          boost: { n: 3, p: 1.5 },
          combineWith: "AND",
        },
      });
      indice.addAll(dados);
      busca.current = indice;
      setItens(dados);
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }, [estado]);

  const buscar = useCallback((termo: string, limite = 8): ItemBusca[] => {
    if (!busca.current || termo.trim().length < 2) return [];
    return busca.current
      .search(termo)
      .slice(0, limite)
      .map((r) => r as unknown as ItemBusca)
      .sort((a, b) => Number(b.e) - Number(a.e));
  }, []);

  return { estado, itens, carregar, buscar };
}
