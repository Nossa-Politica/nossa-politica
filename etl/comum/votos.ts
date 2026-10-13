import { join } from "node:path";
import { escreverJson, recriarPasta } from "../lib/arquivos";
import { type VotoNaVotacao, VotosDoAno } from "./saida";

/** Grava `{pasta}/votos/AAAA.json`, um arquivo por ano da votação. */
export async function escreverVotosPorAno(
  pastaCasa: string,
  votos: Map<string, { data: string; votos: VotoNaVotacao[] }>,
  atualizadoEm: string,
): Promise<void> {
  const porAno = new Map<number, Record<string, VotoNaVotacao[]>>();
  for (const [id, v] of votos) {
    const ano = Number(v.data.slice(0, 4));
    const doAno = porAno.get(ano) ?? {};
    doAno[id] = v.votos;
    porAno.set(ano, doAno);
  }
  const pasta = join(pastaCasa, "votos");
  await recriarPasta(pasta);
  for (const [ano, votacoes] of porAno) {
    await escreverJson(
      join(pasta, `${ano}.json`),
      VotosDoAno.parse({ versao: 1, ano, atualizadoEm, votacoes }),
    );
  }
}
