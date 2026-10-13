import { formatarInteiro } from "@/lib/formatar";

/**
 * Placar em barra empilhada: Sim em azul, Não em laranja, o resto em cinza,
 * sempre com os números escritos (a cor nunca é a única pista).
 */
export function Placar({
  sim,
  nao,
  outros,
  rotuloOutros = "Outros",
}: {
  sim: number;
  nao: number;
  outros: number;
  rotuloOutros?: string;
}) {
  const total = sim + nao + outros;
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const partes = [
    { rotulo: "Sim", valor: sim, cor: "bg-voto-sim" },
    { rotulo: "Não", valor: nao, cor: "bg-voto-nao" },
    { rotulo: rotuloOutros, valor: outros, cor: "bg-contexto" },
  ];
  return (
    <figure className="flex flex-col gap-2">
      <div
        className="flex h-3 gap-[2px] overflow-hidden rounded-full"
        aria-hidden="true"
      >
        {partes
          .filter((p) => p.valor > 0)
          .map((p) => (
            <span
              key={p.rotulo}
              className={p.cor}
              style={{ width: `${pct(p.valor)}%` }}
            />
          ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {partes.map((p) => (
          <span key={p.rotulo} className="flex items-center gap-1.5">
            <span
              className={`size-2.5 rounded-full ${p.cor}`}
              aria-hidden="true"
            />
            {p.rotulo}:{" "}
            <strong className="tabular-nums">{formatarInteiro(p.valor)}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
