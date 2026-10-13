import "server-only";
import { normalizarVoto } from "@etl/comum/alinhamento";
import type { ResumoVotacao } from "@etl/comum/saida";
import {
  type Casa,
  lerVotosDoAno,
  listarVotacoes,
  pessoaDoRegistro,
} from "./dados";

export type CategoriaVoto =
  | "Sim"
  | "Não"
  | "Abstenção"
  | "Obstrução"
  | "Outros";

/** Agrupa os votos em categorias para o placar. */
export function categoriaDoVoto(voto: string): CategoriaVoto {
  return normalizarVoto(voto) ?? "Outros";
}

/** [nome, slug, partido no dia, UF, voto como registrado] */
export type VotoNominal = [string, string, string, string, string];

export interface VotacaoCompleta {
  casa: Casa;
  votacao: ResumoVotacao & { idLegislatura: number };
  votos: VotoNominal[];
  porPartido: Array<{ partido: string } & Record<CategoriaVoto, number>>;
  contagem: Record<CategoriaVoto, number>;
}

export function todasAsVotacoes() {
  return (["camara", "senado"] as const).flatMap((casa) =>
    listarVotacoes(casa).map((v) => ({ casa, ...v })),
  );
}

const vazio = (): Record<CategoriaVoto, number> => ({
  Sim: 0,
  Não: 0,
  Abstenção: 0,
  Obstrução: 0,
  Outros: 0,
});

export function carregarVotacao(
  casa: Casa,
  id: string,
): VotacaoCompleta | undefined {
  const votacao = listarVotacoes(casa).find((v) => v.id === id);
  if (!votacao) return undefined;
  const brutos =
    lerVotosDoAno(casa, Number(votacao.data.slice(0, 4)))[id] ?? [];

  const contagem = vazio();
  const partidos = new Map<string, Record<CategoriaVoto, number>>();
  const votos: VotoNominal[] = [];
  for (const [idParlamentar, voto, partido] of brutos) {
    const pessoa = pessoaDoRegistro(casa, idParlamentar);
    const categoria = categoriaDoVoto(voto);
    contagem[categoria]++;
    const doPartido = partidos.get(partido) ?? vazio();
    doPartido[categoria]++;
    partidos.set(partido, doPartido);
    votos.push([
      pessoa?.nome ?? `Parlamentar ${idParlamentar}`,
      pessoa?.slug ?? "",
      partido,
      pessoa?.uf ?? "",
      voto,
    ]);
  }
  votos.sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));

  return {
    casa,
    votacao,
    votos,
    contagem,
    porPartido: [...partidos]
      .map(([partido, c]) => ({ partido, ...c }))
      .sort(
        (a, b) =>
          b.Sim +
            b.Não +
            b.Abstenção +
            b.Obstrução +
            b.Outros -
            (a.Sim + a.Não + a.Abstenção + a.Obstrução + a.Outros) ||
          a.partido.localeCompare(b.partido, "pt-BR"),
      ),
  };
}
