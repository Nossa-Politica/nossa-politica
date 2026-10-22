"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ANUNCIOS_ATIVOS,
  type Consentimento,
  EVENTO,
  lerConsentimento,
  salvarConsentimento,
} from "@/lib/consentimento";

/**
 * Banner de consentimento. "Aceitar" e "Recusar" têm o mesmo peso (recusar
 * precisa ser tão fácil quanto aceitar), e nada opcional carrega antes da
 * escolha. Desligado enquanto o site não tiver cookies opcionais.
 */
export function BannerConsentimento({
  ativo = ANUNCIOS_ATIVOS,
}: {
  ativo?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    // Só depois de montar: o HTML estático não sabe a escolha da pessoa
    setAberto(lerConsentimento() === null);
    const reabrir = (e: Event) => {
      if ((e as CustomEvent).detail === "abrir") setAberto(true);
    };
    window.addEventListener(EVENTO, reabrir);
    return () => window.removeEventListener(EVENTO, reabrir);
  }, [ativo]);

  if (!ativo || !aberto) return null;

  const decidir = (publicidade: boolean) => {
    salvarConsentimento(publicidade);
    setAberto(false);
  };

  return (
    <section
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          Usamos cookies de anúncios para manter o site gratuito, só se você
          aceitar. O site funciona igual nos dois casos.{" "}
          <Link href="/privacidade" className="underline underline-offset-2">
            Política de privacidade
          </Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => decidir(false)}>
            Recusar
          </Button>
          <Button variant="outline" onClick={() => decidir(true)}>
            Aceitar
          </Button>
        </div>
      </div>
    </section>
  );
}

/** A escolha atual, atualizada quando a pessoa decide ou muda de ideia. */
export function useConsentimento(): Consentimento | null {
  const [valor, setValor] = useState<Consentimento | null>(null);
  useEffect(() => {
    setValor(lerConsentimento());
    const atualizar = (e: Event) => {
      const detalhe = (e as CustomEvent).detail;
      if (detalhe && typeof detalhe === "object") setValor(detalhe);
    };
    window.addEventListener(EVENTO, atualizar);
    return () => window.removeEventListener(EVENTO, atualizar);
  }, []);
  return valor;
}
