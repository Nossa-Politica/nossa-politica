/**
 * Ranking em barras horizontais feitas em CSS: legível no celular, com o valor
 * escrito ao lado (a cor nunca carrega a informação sozinha) e sem JavaScript.
 */
export function BarrasHorizontais({
  itens,
  formatar,
  rotulo,
}: {
  itens: Array<{ nome: string; valor: number; titulo?: string }>;
  formatar: (valor: number) => string;
  rotulo: string;
}) {
  const maximo = Math.max(...itens.map((i) => i.valor), 0);
  return (
    <ul className="flex flex-col gap-2.5" aria-label={rotulo}>
      {itens.map((item) => (
        <li key={item.nome} className="flex flex-col gap-1" title={item.titulo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{item.nome}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatar(item.valor)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-contexto-fraco">
            <div
              className="h-2 rounded-full bg-serie"
              style={{
                width: `${maximo > 0 ? Math.max((item.valor / maximo) * 100, 1) : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
