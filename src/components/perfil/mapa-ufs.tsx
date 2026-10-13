import { formatarMoedaCurta, UFS } from "@/lib/formatar";

/**
 * Mapa do Brasil em quadrados (um por UF, na posição aproximada), colorido do
 * mais claro ao mais escuro conforme o valor. Não precisa de arquivo de
 * geometria e cabe na largura do celular.
 */
const POSICOES: Record<string, [coluna: number, linha: number]> = {
  RR: [2, 0],
  AP: [3, 0],
  AM: [1, 1],
  PA: [2, 1],
  MA: [3, 1],
  CE: [4, 1],
  RN: [5, 1],
  AC: [0, 2],
  RO: [1, 2],
  TO: [2, 2],
  PI: [3, 2],
  PE: [4, 2],
  PB: [5, 2],
  MT: [1, 3],
  GO: [2, 3],
  BA: [3, 3],
  SE: [4, 3],
  AL: [5, 3],
  MS: [1, 4],
  DF: [2, 4],
  MG: [3, 4],
  ES: [4, 4],
  PR: [1, 5],
  SP: [2, 5],
  RJ: [3, 5],
  SC: [1, 6],
  RS: [1, 7],
};

const DEGRAUS = 6;
const LEGENDA = Array.from({ length: DEGRAUS }, (_, i) => i + 1);

export function MapaUfs({ valores }: { valores: Record<string, number> }) {
  const maximo = Math.max(...Object.values(valores), 0);
  const degrau = (v: number) =>
    v <= 0 || maximo === 0
      ? 0
      : Math.min(DEGRAUS, Math.ceil((v / maximo) * DEGRAUS));

  return (
    <figure className="flex flex-col gap-2">
      <div
        className="grid w-full max-w-64 gap-1"
        style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
        aria-hidden="true"
      >
        {Object.entries(POSICOES).map(([uf, [coluna, linha]]) => {
          const valor = valores[uf] ?? 0;
          const d = degrau(valor);
          return (
            <div
              key={uf}
              className="flex aspect-square items-center justify-center rounded-md border text-[11px] font-medium"
              style={{
                gridColumn: coluna + 1,
                gridRow: linha + 1,
                background: d === 0 ? "var(--muted)" : `var(--sequencial-${d})`,
              }}
              title={`${UFS[uf]}: ${formatarMoedaCurta(valor)}`}
            >
              <span className="rounded bg-background/80 px-1">{uf}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="flex items-center gap-2 text-xs text-muted-foreground">
        Menos
        {LEGENDA.map((d) => (
          <span
            key={d}
            className="size-3 rounded-sm"
            style={{ background: `var(--sequencial-${d})` }}
          />
        ))}
        Mais
      </figcaption>
    </figure>
  );
}
