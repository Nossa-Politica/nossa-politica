import type { ReactNode } from "react";
import { formatarData } from "@/lib/formatar";
import { type ChaveGlossario, GLOSSARIO } from "@/lib/glossario";
import { Termo } from "./termo";

/** Título de bloco: a frase-conclusão em destaque e o nome do dado acima. */
export function TituloBloco({
  id,
  rotulo,
  conclusao,
}: {
  id: string;
  rotulo: string;
  conclusao: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
      <h2 id={id} className="font-heading text-xl font-semibold leading-snug">
        {conclusao}
      </h2>
    </header>
  );
}

/** Seção do perfil, com âncora para o índice. */
export function Bloco({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={`${id}-titulo`}
      id={id}
      className="flex scroll-mt-20 flex-col gap-4 border-t pt-8"
    >
      {children}
    </section>
  );
}

/** Fonte e data de atualização, embaixo de cada bloco. */
export function Fonte({
  nome,
  url,
  atualizadoEm,
}: {
  nome: string;
  url: string;
  atualizadoEm?: string;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      Fonte:{" "}
      <a
        href={url}
        className="underline underline-offset-2"
        rel="noopener"
        target="_blank"
      >
        {nome}
      </a>
      {atualizadoEm && <> · Atualizado em {formatarData(atualizadoEm)}</>}
    </p>
  );
}

/** Termo do glossário com explicação ao tocar. */
export function TermoGlossario({
  chave,
  children,
}: {
  chave: ChaveGlossario;
  children?: ReactNode;
}) {
  const { termo, explicacao } = GLOSSARIO[chave];
  return (
    <Termo termo={termo} explicacao={explicacao}>
      {children ?? termo}
    </Termo>
  );
}

/** Tabela alternativa ao gráfico, recolhida por padrão (acessibilidade). */
export function VerTabela({ children }: { children: ReactNode }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground underline underline-offset-2">
        Ver os números em tabela
      </summary>
      <div className="mt-2 max-h-80 overflow-auto">{children}</div>
    </details>
  );
}
