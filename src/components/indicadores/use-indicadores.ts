"use client";

import { useEffect, useState } from "react";
import type { Indicadores } from "@/lib/tipos-indicadores";

/** Carrega /api/indicadores (gerado no build) uma vez por página. */
export function useIndicadores() {
  const [dados, setDados] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch("/api/indicadores")
      .then((r) => r.json() as Promise<Indicadores>)
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return { dados, erro };
}
