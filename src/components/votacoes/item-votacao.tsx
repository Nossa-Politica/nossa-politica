import type { ResumoVotacao } from "@etl/comum/saida";
import Link from "next/link";
import { formatarData } from "@/lib/formatar";

/** Votação em uma linha de lista, com link para a página dela. */
export function ItemVotacao({
  casa,
  votacao,
}: {
  casa: "camara" | "senado";
  votacao: ResumoVotacao;
}) {
  const { placar } = votacao;
  return (
    <li className="py-3">
      <Link
        href={`/votacoes/${casa}/${encodeURIComponent(votacao.id)}`}
        className="flex flex-col gap-1 rounded-lg hover:bg-muted"
      >
        <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">
            {votacao.proposicao?.titulo || "Votação no Plenário"}
          </span>
          <span className="text-muted-foreground">
            {formatarData(votacao.data)}
          </span>
        </span>
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {votacao.proposicao?.ementa || votacao.descricao}
        </span>
        <span className="text-xs text-muted-foreground">
          {votacao.aprovada === null
            ? ""
            : votacao.aprovada
              ? "Aprovada · "
              : "Rejeitada · "}
          Sim {placar.sim} · Não {placar.nao}
          {votacao.secreta ? " · secreta" : ""}
        </span>
      </Link>
    </li>
  );
}
