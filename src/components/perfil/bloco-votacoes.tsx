import type { Alinhamento, MandatoNaLegislatura } from "@etl/comum/saida";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { VotoRecente } from "@/lib/dados";
import {
  type CasaLegislativa,
  formatarData,
  formatarInteiro,
  formatarPercentual,
} from "@/lib/formatar";
import { Bloco, Fonte, TermoGlossario, TituloBloco } from "./comum";

/** Medidor de proporção: trilho cinza, preenchimento azul, número escrito. */
function Medidor({
  rotulo,
  alinhamento,
}: {
  rotulo: ReactNode;
  alinhamento: Alinhamento;
}) {
  const { percentual, consideradas } = alinhamento;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{rotulo}</span>
        <span className="font-heading text-lg font-semibold tabular-nums">
          {percentual === null ? "—" : formatarPercentual(percentual)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-contexto-fraco" aria-hidden="true">
        <div
          className="h-2 rounded-full bg-serie"
          style={{ width: `${percentual ?? 0}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {consideradas === 0
          ? "Sem votações suficientes para calcular"
          : `Em ${formatarInteiro(consideradas)} votações`}
      </p>
    </div>
  );
}

function rotuloVoto(voto: string, secreta: boolean) {
  if (secreta) return "Votou (secreta)";
  return voto;
}

export function BlocoVotacoes({
  id,
  casa,
  mandato,
  recentes,
  atualizadoEm,
}: {
  id: string;
  casa: CasaLegislativa;
  mandato: MandatoNaLegislatura;
  recentes: VotoRecente[];
  atualizadoEm?: string;
}) {
  const { votacoes } = mandato;
  const { percentual: comPartido } = votacoes.alinhamentoPartido;
  const conclusao =
    comPartido === null
      ? `Votou em ${formatarInteiro(votacoes.votosRegistrados)} votações nominais`
      : `Votou como a maioria do partido em ${formatarPercentual(comPartido)} das votações`;

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Votações"
        conclusao={conclusao}
      />
      <p className="text-sm text-muted-foreground">
        Registrou voto em {formatarInteiro(votacoes.votosRegistrados)}{" "}
        <TermoGlossario chave="votacaoNominal">
          votações nominais
        </TermoGlossario>{" "}
        do Plenário.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Medidor
          rotulo={
            <TermoGlossario chave="alinhamentoPartido">
              Votou com o partido
            </TermoGlossario>
          }
          alinhamento={votacoes.alinhamentoPartido}
        />
        <Medidor
          rotulo={
            <TermoGlossario chave="alinhamentoGoverno">
              Votou com o governo
            </TermoGlossario>
          }
          alinhamento={votacoes.alinhamentoGoverno}
        />
      </div>

      {recentes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Votações mais recentes</h3>
          <ol className="flex flex-col divide-y">
            {recentes.map((v) => (
              <li key={v.id} className="flex flex-col gap-1 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{v.titulo}</span>
                  <span className="text-muted-foreground">
                    {formatarData(v.data)}
                  </span>
                  <Badge variant="outline">
                    {rotuloVoto(v.voto, v.secreta)}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {v.descricao}
                </p>
                {v.aprovada !== null && (
                  <p className="text-xs text-muted-foreground">
                    Resultado: {v.aprovada ? "aprovada" : "rejeitada"}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <Fonte
        nome={casa === "camara" ? "Votações da Câmara" : "Votações do Senado"}
        url={
          casa === "camara"
            ? "https://dadosabertos.camara.leg.br/arquivos"
            : "https://legis.senado.leg.br/dadosabertos/docs/"
        }
        atualizadoEm={atualizadoEm}
      />
    </Bloco>
  );
}
