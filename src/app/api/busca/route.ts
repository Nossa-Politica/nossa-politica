import type { ItemBusca } from "@/lib/busca";
import { lerPessoas } from "@/lib/dados";
import { cargo } from "@/lib/formatar";

// Gerado no build como arquivo estático
export const dynamic = "force-static";

export function GET() {
  const itens: ItemBusca[] = lerPessoas().map((p) => {
    const titulo = cargo(p.casa, p.sexo);
    return {
      s: p.slug,
      n: p.nome,
      o: [...(p.outrosNomes ?? []), p.nomeCivil ?? ""].join(" "),
      p: p.partido,
      u: p.uf,
      c: p.emExercicio
        ? titulo
        : `Ex-${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`,
      e: p.emExercicio,
      f: p.urlFoto,
    };
  });
  return Response.json(itens);
}
