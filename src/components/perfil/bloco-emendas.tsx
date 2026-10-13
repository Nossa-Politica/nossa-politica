import type { EmendasDoParlamentar } from "@etl/emendas/saida";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarMoeda,
  formatarMoedaCurta,
  formatarPercentual,
  UFS,
} from "@/lib/formatar";
import { BarrasHorizontais } from "./barras-horizontais";
import { Bloco, Fonte, TermoGlossario, TituloBloco, VerTabela } from "./comum";
import { GraficoColunas } from "./grafico-colunas";
import { MapaUfs } from "./mapa-ufs";

const MUNICIPIOS_VISIVEIS = 10;

export function BlocoEmendas({
  id,
  emendas,
  ufDoParlamentar,
  atualizadoEm,
}: {
  id: string;
  emendas?: EmendasDoParlamentar;
  ufDoParlamentar: string;
  atualizadoEm?: string;
}) {
  if (!emendas || emendas.total.empenhado <= 0) {
    return (
      <Bloco id={id}>
        <TituloBloco
          id={`${id}-titulo`}
          rotulo="Emendas parlamentares"
          conclusao="Nenhuma emenda individual encontrada desde 2020"
        />
        <Fonte
          nome="Portal da Transparência"
          url="https://portaldatransparencia.gov.br/emendas"
          atualizadoEm={atualizadoEm}
        />
      </Bloco>
    );
  }

  const { total } = emendas;
  const noProprioEstado =
    emendas.porUf.find((u) => u.uf === ufDoParlamentar)?.empenhado ?? 0;
  const fracaoEstado = (noProprioEstado / total.empenhado) * 100;
  const valoresUf = Object.fromEntries(
    emendas.porUf.filter((u) => u.uf !== "").map((u) => [u.uf, u.empenhado]),
  );
  const pix = emendas.porTipo.find(
    (t) => t.tipo === "Transferências Especiais",
  );

  return (
    <Bloco id={id}>
      <TituloBloco
        id={`${id}-titulo`}
        rotulo="Emendas parlamentares"
        conclusao={`Indicou ${formatarMoedaCurta(total.empenhado)} em emendas desde ${emendas.porAno[0]?.ano ?? 2020}; ${formatarPercentual(fracaoEstado)} para ${UFS[ufDoParlamentar] ?? ufDoParlamentar}`}
      />
      <p className="text-sm text-muted-foreground">
        <TermoGlossario chave="emenda">Emendas</TermoGlossario> individuais:
        valor reservado (empenhado) de {formatarMoeda(total.empenhado)}, dos
        quais {formatarMoeda(total.pago)} já foram pagos
        {pix && pix.empenhado > 0 && (
          <>
            . {formatarMoeda(pix.empenhado)} foram{" "}
            <TermoGlossario chave="emendaPix">
              transferências especiais
            </TermoGlossario>
          </>
        )}
        .
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Por ano</h3>
        <GraficoColunas
          dados={emendas.porAno.map((a) => ({
            chave: String(a.ano),
            valor: a.empenhado,
          }))}
          eixo="ano"
          rotulo="Empenhado"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Para onde foi</h3>
          <MapaUfs valores={valoresUf} />
          <VerTabela>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Empenhado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emendas.porUf.map((u) => (
                  <TableRow key={u.uf || "nacional"}>
                    <TableCell>
                      {u.uf ? UFS[u.uf] : "Nacional ou vários estados"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(u.empenhado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </VerTabela>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Áreas</h3>
          <BarrasHorizontais
            rotulo="Emendas por área"
            formatar={formatarMoedaCurta}
            itens={emendas.porFuncao
              .slice(0, 6)
              .map((f) => ({ nome: f.funcao, valor: f.empenhado }))}
          />
        </div>
      </div>

      {emendas.porMunicipio.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Municípios que mais receberam</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Município</TableHead>
                <TableHead className="text-right">Empenhado</TableHead>
                <TableHead className="text-right">Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emendas.porMunicipio.slice(0, MUNICIPIOS_VISIVEIS).map((m) => (
                <TableRow key={m.codigoIbge}>
                  <TableCell className="whitespace-normal">
                    {m.municipio} ({m.uf})
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoedaCurta(m.empenhado)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoedaCurta(m.pago)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">
            Parte das emendas indica só o estado de destino, sem o município.
          </p>
        </div>
      )}

      <Fonte
        nome="Portal da Transparência"
        url="https://portaldatransparencia.gov.br/emendas"
        atualizadoEm={atualizadoEm}
      />
    </Bloco>
  );
}
