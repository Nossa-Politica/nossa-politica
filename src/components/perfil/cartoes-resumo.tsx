import type { MandatoNaLegislatura, Medianas } from "@etl/comum/saida";
import type { ReactNode } from "react";
import {
  type CasaLegislativa,
  colegas,
  comparar,
  formatarInteiro,
  formatarMoeda,
  formatarPercentual,
  fraseContagem,
  frasePontos,
  fraseRelativa,
} from "@/lib/formatar";
import { TermoGlossario } from "./comum";

function Cartao({
  rotulo,
  valor,
  comparacao,
  detalhe,
}: {
  rotulo: ReactNode;
  valor: string;
  comparacao?: string;
  detalhe?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="font-heading text-3xl font-semibold">{valor}</p>
      {comparacao && <p className="text-sm">{comparacao}</p>}
      {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

/**
 * Os quatro números do mandato, cada um ao lado da mediana. Sem cores de
 * "bom" ou "ruim": a comparação é dita em palavras.
 */
export function CartoesResumo({
  casa,
  mandato,
  medianas,
}: {
  casa: CasaLegislativa;
  mandato: MandatoNaLegislatura;
  medianas: { casa?: Medianas; uf?: Medianas };
}) {
  const quem = colegas(casa);
  const { presenca, proposicoes, despesas } = mandato;
  const m = medianas.casa;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Cartao
        rotulo={
          <>
            Presença em{" "}
            {casa === "camara" ? (
              <TermoGlossario chave="sessaoDeliberativa">
                sessões com votação
              </TermoGlossario>
            ) : (
              <TermoGlossario chave="votacaoNominal">
                votações nominais
              </TermoGlossario>
            )}
          </>
        }
        valor={
          presenca.percentual === null
            ? "—"
            : formatarPercentual(presenca.percentual)
        }
        comparacao={
          presenca.percentual !== null && m?.presencaPercentual != null
            ? `${frasePontos(comparar(presenca.percentual, m.presencaPercentual))} dos ${quem} (${formatarPercentual(m.presencaPercentual)})`
            : undefined
        }
        detalhe={`${formatarInteiro(presenca.presencas)} de ${formatarInteiro(presenca.sessoes)}${
          presenca.ausenciasJustificadas
            ? ` · ${formatarInteiro(presenca.ausenciasJustificadas)} ausências com motivo oficial`
            : ""
        }`}
      />
      <Cartao
        rotulo={
          <>
            Projetos como{" "}
            <TermoGlossario chave="primeiroAutor">
              primeiro autor
            </TermoGlossario>
          </>
        }
        valor={formatarInteiro(proposicoes.comoPrimeiroAutor)}
        comparacao={
          m?.proposicoesComoPrimeiroAutor != null
            ? `${fraseContagem(proposicoes.comoPrimeiroAutor, m.proposicoesComoPrimeiroAutor)} dos ${quem} (${formatarInteiro(m.proposicoesComoPrimeiroAutor)})`
            : undefined
        }
        detalhe={`${formatarInteiro(proposicoes.apresentadas)} no total, contando coautorias`}
      />
      <Cartao
        rotulo={
          <>
            Projetos que{" "}
            <TermoGlossario chave="norma">viraram lei</TermoGlossario>
          </>
        }
        valor={formatarInteiro(proposicoes.viraramNorma)}
        comparacao={
          m?.viraramNorma != null
            ? `${fraseContagem(proposicoes.viraramNorma, m.viraramNorma)} dos ${quem} (${formatarInteiro(m.viraramNorma)})`
            : undefined
        }
        detalhe="Inclui coautorias"
      />
      <Cartao
        rotulo={
          <>
            Gasto da <TermoGlossario chave="cota">cota</TermoGlossario> por mês
          </>
        }
        valor={
          despesas.mediaMensal === null
            ? "—"
            : formatarMoeda(despesas.mediaMensal)
        }
        comparacao={
          despesas.mediaMensal !== null &&
          medianas.uf?.despesaMediaMensal != null
            ? `${fraseRelativa(comparar(despesas.mediaMensal, medianas.uf.despesaMediaMensal))} dos ${quem} de ${mandato.uf} (${formatarMoeda(medianas.uf.despesaMediaMensal)})`
            : undefined
        }
        detalhe={`Comparado com o mesmo estado, porque o limite da cota varia por UF · Total: ${formatarMoeda(despesas.total)}`}
      />
    </div>
  );
}
