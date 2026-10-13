"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatarMes, formatarMoeda, formatarValorEixo } from "@/lib/formatar";

/** Como escrever o eixo X: "mar/25" para meses, o próprio valor para anos. */
const FORMATOS_EIXO = {
  mes: (chave: string) => formatarMes(chave),
  ano: (chave: string) => chave,
};

/**
 * Colunas de uma série só, em azul, com uma linha de referência cinza opcional
 * (a mediana). Usado para gasto por mês, emendas por ano e bens por eleição.
 */
export function GraficoColunas({
  dados,
  eixo,
  rotulo,
  mediana,
  rotuloMediana,
}: {
  dados: Array<{ chave: string; valor: number }>;
  eixo: keyof typeof FORMATOS_EIXO;
  rotulo: string;
  mediana?: number;
  rotuloMediana?: string;
}) {
  const formatarEixo = FORMATOS_EIXO[eixo];
  const config = {
    valor: { label: rotulo, color: "var(--serie)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart
        data={dados}
        margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
        barCategoryGap={2}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="chave"
          tickFormatter={formatarEixo}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tickFormatter={formatarValorEixo}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                formatarEixo(String(payload[0]?.payload?.chave ?? ""))
              }
              formatter={(valor) => formatarMoeda(Number(valor))}
            />
          }
        />
        {mediana !== undefined && (
          <ReferenceLine
            y={mediana}
            stroke="var(--contexto)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            label={{
              value: rotuloMediana ?? "mediana",
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
        )}
        <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
