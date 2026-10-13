import type { MandatoNaLegislatura, Medianas } from "@etl/comum/saida";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agruparCategorias, categoriaSimples } from "@/lib/categorias";
import {
  type CasaLegislativa,
  colegas,
  comparar,
  formatarData,
  formatarMes,
  formatarMoeda,
  fraseRelativa,
} from "@/lib/formatar";
import { BarrasHorizontais } from "./barras-horizontais";
import { Bloco, Fonte, TermoGlossario, TituloBloco, VerTabela } from "./comum";
import { GraficoColunas } from "./grafico-colunas";

const FONTE = {
  camara: {
    nome: "Cota parlamentar da Câmara",
    url: "https://www.camara.leg.br/cota-parlamentar/",
  },
  senado: {
    nome: "CEAPS do Senado",
    url: "https://www12.senado.leg.br/transparencia/sen/verba-indenizatoria-ceap",
  },
};

const CATEGORIAS_VISIVEIS = 7;

export function BlocoGastos({
  id,
  casa,
  mandato,
  medianaUf,
  atualizadoEm,
}: {
  id: string;
  casa: CasaLegislativa;
  mandato: MandatoNaLegislatura;
  medianaUf?: Medianas;
  atualizadoEm?: string;
}) {
  const { despesas, uf } = mandato;
  const mediana = medianaUf?.despesaMediaMensal ?? undefined;
  const conclusao =
    despesas.mediaMensal === null
      ? "Pouco tempo no cargo para calcular a média mensal"
      : mediana === undefined
        ? `Gastou em média ${formatarMoeda(despesas.mediaMensal)} por mês`
        : `Gastou ${formatarMoeda(despesas.mediaMensal)} por mês, ${fraseRelativa(
            comparar(despesas.mediaMensal, mediana),
          )} dos ${colegas(casa)} de ${uf}`;

  const categorias = agruparCategorias(despesas.porCategoria);
  const visiveis = categorias.slice(0, CATEGORIAS_VISIVEIS);
  const resto = categorias.slice(CATEGORIAS_VISIVEIS);
  if (resto.length > 0) {
    visiveis.push({
      nome: "Outras",
      valor: resto.reduce((s, c) => s + c.valor, 0),
      oficiais: resto.flatMap((c) => c.oficiais),
    });
  }

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Gastos da cota parlamentar"
        conclusao={conclusao}
      />
      <p className="text-sm text-muted-foreground">
        A <TermoGlossario chave="cota">cota parlamentar</TermoGlossario> paga
        despesas do mandato. Total no período: {formatarMoeda(despesas.total)}.
      </p>

      {despesas.porMes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Gasto por mês</h3>
          <GraficoColunas
            dados={despesas.porMes.map((m) => ({
              chave: m.mes,
              valor: m.valor,
            }))}
            eixo="mes"
            rotulo="Gasto no mês"
            mediana={mediana}
            rotuloMediana={`mediana de ${uf}`}
          />
          <VerTabela>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.porMes.map((m) => (
                  <TableRow key={m.mes}>
                    <TableCell>{formatarMes(m.mes)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(m.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </VerTabela>
        </div>
      )}

      {visiveis.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Com o que gastou</h3>
          <BarrasHorizontais
            rotulo="Gasto por categoria"
            formatar={formatarMoeda}
            itens={visiveis.map((c) => ({
              nome: c.nome,
              valor: c.valor,
              titulo: c.oficiais.join(" · "),
            }))}
          />
        </div>
      )}

      {despesas.maioresNotas.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Maiores notas fiscais</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.maioresNotas.map((n) => (
                  <TableRow key={`${n.data}-${n.fornecedor}-${n.valor}`}>
                    <TableCell className="align-top tabular-nums">
                      {formatarData(n.data)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="block">
                        {n.url ? (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener"
                            className="underline underline-offset-2"
                          >
                            {n.fornecedor}
                          </a>
                        ) : (
                          n.fornecedor
                        )}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {categoriaSimples(n.categoria)} · {n.documento}
                      </span>
                    </TableCell>
                    <TableCell className="text-right align-top tabular-nums">
                      {formatarMoeda(n.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Fonte {...FONTE[casa]} atualizadoEm={atualizadoEm} />
    </Bloco>
  );
}
