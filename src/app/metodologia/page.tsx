import type { Metadata } from "next";
import { metodologia } from "#conteudo";

export const metadata: Metadata = {
  title: "Metodologia · Nossa Política",
  description:
    "Como cada número do site é calculado a partir dos dados oficiais da Câmara, do Senado, do Portal da Transparência e do TSE.",
  alternates: { canonical: "/metodologia" },
};

/*
 * O texto vem de `docs/METODOLOGIA.md`, convertido em HTML pelo Velite no
 * build. O estilo de cada elemento fica aqui, já que o HTML não tem classes.
 */
const estilo = [
  "[&_h1]:mt-12 [&_h1]:mb-3 [&_h1]:scroll-mt-6 [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
  "[&_h1:first-child]:mt-0 [&_h1:first-child]:text-3xl",
  "[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:scroll-mt-6 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_p]:my-3 [&_p]:leading-relaxed",
  "[&_ul]:my-3 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-6",
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.875em]",
  "[&_table]:my-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:text-sm",
  "[&_th]:border-b [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
  "[&_td]:border-b [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top",
].join(" ");

export default function PaginaMetodologia() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8">
      <article
        className={estilo}
        // HTML gerado no build a partir de um arquivo do próprio repositório
        // biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo nosso, compilado no build
        dangerouslySetInnerHTML={{ __html: metodologia.conteudo }}
      />
    </main>
  );
}
