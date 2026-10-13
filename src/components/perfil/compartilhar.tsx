"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Usa o compartilhamento nativo do celular; no computador, copia o link. */
export function Compartilhar({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // Cancelado pela pessoa: nada a fazer
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Button variant="outline" size="lg" onClick={compartilhar}>
      <Share2 data-icon="inline-start" aria-hidden="true" />
      {copiado ? "Link copiado" : "Compartilhar"}
    </Button>
  );
}
