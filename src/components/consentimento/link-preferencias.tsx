"use client";

import { ANUNCIOS_ATIVOS, abrirPreferencias } from "@/lib/consentimento";

/** Link do rodapé para mudar a escolha a qualquer momento. */
export function LinkPreferencias() {
  if (!ANUNCIOS_ATIVOS) return null;
  return (
    <button
      type="button"
      onClick={abrirPreferencias}
      className="underline underline-offset-2"
    >
      Preferências de cookies
    </button>
  );
}
