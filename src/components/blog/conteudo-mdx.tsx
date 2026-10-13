import * as runtime from "react/jsx-runtime";
import { componentesMdx } from "./componentes-mdx";

/**
 * Renderiza o MDX compilado pelo Velite. Roda só no build (as páginas do blog
 * são estáticas), por isso pode avaliar o código compilado.
 */
export function ConteudoMdx({ codigo }: { codigo: string }) {
  const Componente = new Function(codigo)({ ...runtime }).default;
  return <Componente components={componentesMdx} />;
}
