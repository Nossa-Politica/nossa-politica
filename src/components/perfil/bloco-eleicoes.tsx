import type { EleicoesDoParlamentar } from "@etl/tse/saida";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarInteiro,
  formatarMoeda,
  formatarMoedaCurta,
} from "@/lib/formatar";
import { Bloco, Fonte, TermoGlossario, TituloBloco } from "./comum";
import { GraficoColunas } from "./grafico-colunas";

const resultadoSimples = (r: string) => {
  if (r.startsWith("ELEITO")) return "Eleito";
  if (r === "SUPLENTE") return "Suplente";
  if (r === "NÃO ELEITO") return "Não eleito";
  if (r === "2º TURNO") return "2º turno";
  return r ? r.charAt(0) + r.slice(1).toLowerCase() : "—";
};

export function BlocoEleicoes({
  id,
  eleicoes,
  atualizadoEm,
}: {
  id: string;
  eleicoes: EleicoesDoParlamentar["eleicoes"];
  atualizadoEm?: string;
}) {
  if (eleicoes.length === 0) {
    return (
      <Bloco id={id}>
        <TituloBloco
          id={`${id}-titulo`}
          rotulo="Eleições"
          conclusao="Nenhuma candidatura encontrada nos dados do TSE desde 2014"
        />
      </Bloco>
    );
  }

  const ultima = eleicoes[eleicoes.length - 1];
  const comBens = eleicoes.filter((e) => e.bens.total > 0);

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Eleições"
        conclusao={`Em ${ultima.ano}, ${formatarInteiro(ultima.votos)} votos para ${ultima.cargo.toLowerCase()} (${resultadoSimples(ultima.resultado).toLowerCase()})`}
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Votos</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="text-right">
                <TermoGlossario chave="bens">Bens</TermoGlossario>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...eleicoes].reverse().map((e) => (
              <TableRow key={`${e.ano}-${e.cargo}`}>
                <TableCell className="tabular-nums">{e.ano}</TableCell>
                <TableCell className="whitespace-normal">
                  {e.cargo}
                  <span className="block text-xs text-muted-foreground">
                    {e.partido} · {e.uf}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatarInteiro(e.votos)}
                </TableCell>
                <TableCell>{resultadoSimples(e.resultado)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {e.bens.total > 0 ? formatarMoedaCurta(e.bens.total) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {comBens.length > 1 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            Bens declarados a cada eleição
          </h3>
          <GraficoColunas
            dados={comBens.map((e) => ({
              chave: String(e.ano),
              valor: e.bens.total,
            }))}
            eixo="ano"
            rotulo="Bens declarados"
          />
          <p className="text-xs text-muted-foreground">
            Valores informados pelo próprio candidato ao TSE, sem correção pela
            inflação. Maior item em {ultima.ano}:{" "}
            {ultima.bens.porTipo[0]
              ? `${ultima.bens.porTipo[0].tipo} (${formatarMoeda(ultima.bens.porTipo[0].valor)})`
              : "—"}
            .
          </p>
        </div>
      )}

      <Fonte
        nome="Dados Abertos do TSE"
        url="https://dadosabertos.tse.jus.br/"
        atualizadoEm={atualizadoEm}
      />
    </Bloco>
  );
}
