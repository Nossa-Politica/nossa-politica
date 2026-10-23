/*
 * Consentimento de cookies (LGPD). Hoje o site não usa cookies próprios nem
 * guarda nada no navegador, então o banner fica desligado. Quando os anúncios
 * (AdSense) entrarem:
 *   1. mude ANUNCIOS_ATIVOS para true (o banner e o link do rodapé aparecem);
 *   2. carregue o script de anúncios só quando `useConsentimento()` devolver
 *      `{ publicidade: true }`;
 *   3. libere os domínios do Google na CSP (next.config.ts) e atualize a
 *      página /privacidade.
 */

export const ANUNCIOS_ATIVOS = false;

export interface Consentimento {
  publicidade: boolean;
  /** Quando a pessoa decidiu (ISO), para saber se vale pedir de novo */
  decididoEm: string;
}

/** Versão no nome da chave: se as categorias mudarem, pergunta de novo. */
const CHAVE = "nossa-politica:consentimento:v1";
export const EVENTO = "nossa-politica:consentimento";

export function lerConsentimento(): Consentimento | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    if (!valor) return null;
    const dados = JSON.parse(valor) as Partial<Consentimento>;
    return typeof dados.publicidade === "boolean" &&
      typeof dados.decididoEm === "string"
      ? { publicidade: dados.publicidade, decididoEm: dados.decididoEm }
      : null;
  } catch {
    // Navegação privada ou armazenamento bloqueado: trata como sem decisão
    return null;
  }
}

export function salvarConsentimento(publicidade: boolean): Consentimento {
  const consentimento = { publicidade, decididoEm: new Date().toISOString() };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(consentimento));
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: consentimento }));
  return consentimento;
}

/** Pede ao banner para abrir de novo (link "Preferências de cookies"). */
export function abrirPreferencias() {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: "abrir" }));
}
