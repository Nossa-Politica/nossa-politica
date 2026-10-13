import type { MandatoNaLegislatura, Medianas } from "@etl/comum/saida";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CasaLegislativa,
  colegas,
  comparar,
  formatarInteiro,
  formatarMes,
  formatarPercentual,
  frasePontos,
} from "@/lib/formatar";
import { Calendario } from "./calendario";
import { Bloco, Fonte, TermoGlossario, TituloBloco, VerTabela } from "./comum";

export function BlocoPresenca({
  id,
  casa,
  mandato,
  medianaCasa,
  atualizadoEm,
}: {
  id: string;
  casa: CasaLegislativa;
  mandato: MandatoNaLegislatura;
  medianaCasa?: Medianas;
  atualizadoEm?: string;
}) {
  const { presenca } = mandato;
  const m = medianaCasa?.presencaPercentual;
  const unidade =
    casa === "camara" ? "das sessões com votação" : "das votações nominais";
  const conclusao =
    presenca.percentual === null
      ? "Sem sessões no período em exercício"
      : `Esteve presente em ${formatarPercentual(presenca.percentual)} ${unidade}${
          m != null
            ? `, ${frasePontos(comparar(presenca.percentual, m))} dos ${colegas(casa)}`
            : ""
        }`;

  // Resumo por mês, para a tabela alternativa
  const meses = new Map<string, { presentes: number; total: number }>();
  for (const [data, presente] of presenca.calendario) {
    const mes = data.slice(0, 7);
    const m = meses.get(mes) ?? { presentes: 0, total: 0 };
    m.total++;
    m.presentes += presente;
    meses.set(mes, m);
  }

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Presença"
        conclusao={conclusao}
      />
      <p className="text-sm text-muted-foreground">
        {casa === "camara" ? (
          <>
            Conta as{" "}
            <TermoGlossario chave="sessaoDeliberativa">
              sessões deliberativas
            </TermoGlossario>{" "}
            do Plenário nos períodos em que estava no cargo. A Câmara não
            informa quais faltas foram justificadas.
          </>
        ) : (
          <>
            O Senado não publica presença por sessão; contamos as{" "}
            <TermoGlossario chave="votacaoNominal">
              votações nominais
            </TermoGlossario>{" "}
            do período no cargo.{" "}
            {formatarInteiro(presenca.ausenciasJustificadas ?? 0)} ausências
            tiveram motivo oficial (licença, missão ou atividade parlamentar).
          </>
        )}
      </p>
      {presenca.calendario.length > 0 && (
        <Calendario calendario={presenca.calendario} />
      )}
      <VerTabela>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Presente</TableHead>
              <TableHead className="text-right">
                {casa === "camara" ? "Sessões" : "Votações"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...meses].map(([mes, m]) => (
              <TableRow key={mes}>
                <TableCell>{formatarMes(mes)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.presentes}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </VerTabela>
      <Fonte
        nome={casa === "camara" ? "Presenças da Câmara" : "Votações do Senado"}
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
