import type { Parlamentar } from "../comum/saida";
import { normalizarNome, slugificar } from "../lib/texto";
import type { Pessoa } from "./saida";

export interface ParlamentarComCasa {
  casa: "camara" | "senado";
  parlamentar: Parlamentar;
}

const ultimaLegislatura = (p: Parlamentar) =>
  Math.max(...p.legislaturas.map((l) => l.idLegislatura));

/**
 * Junta registros da Câmara e do Senado da mesma pessoa: mesmo nome civil e
 * pelo menos uma UF em comum (para não juntar homônimos de estados diferentes).
 */
export function agruparPorPessoa(
  todos: ParlamentarComCasa[],
): ParlamentarComCasa[][] {
  const grupos: ParlamentarComCasa[][] = [];
  const porNomeCivil = new Map<string, ParlamentarComCasa[][]>();

  for (const item of todos) {
    const civil = item.parlamentar.nomeCivil
      ? normalizarNome(item.parlamentar.nomeCivil)
      : "";
    const ufs = new Set(item.parlamentar.legislaturas.map((l) => l.uf));
    const candidatos = civil ? (porNomeCivil.get(civil) ?? []) : [];
    const grupo = candidatos.find(
      (g) =>
        g.every((x) => x.casa !== item.casa) &&
        g.some((x) => x.parlamentar.legislaturas.some((l) => ufs.has(l.uf))),
    );
    if (grupo) {
      grupo.push(item);
      continue;
    }
    const novo = [item];
    grupos.push(novo);
    if (civil) porNomeCivil.set(civil, [...candidatos, novo]);
  }
  return grupos;
}

/**
 * Uma entrada por pessoa. O registro principal é o que está em exercício ou,
 * se nenhum estiver, o da legislatura mais recente (no empate, o Senado, que
 * costuma vir depois da Câmara na carreira).
 *
 * O slug vem do nome. Homônimos ganham a UF e, se ainda empatar, o id, sempre
 * na mesma ordem (casa e id), para o endereço não mudar entre cargas.
 */
export function montarPessoas(todos: ParlamentarComCasa[]): Pessoa[] {
  const pessoas = agruparPorPessoa(todos).map((grupo): Omit<Pessoa, "slug"> => {
    const ordenado = [...grupo].sort(
      (a, b) =>
        Number(b.parlamentar.emExercicio) - Number(a.parlamentar.emExercicio) ||
        ultimaLegislatura(b.parlamentar) - ultimaLegislatura(a.parlamentar) ||
        (a.casa === "senado" ? -1 : 1),
    );
    const { casa, parlamentar: p } = ordenado[0];
    const outrosNomes = [
      ...new Set(
        grupo.flatMap((g) => [
          g.parlamentar.nome,
          ...(g.parlamentar.outrosNomes ?? []),
        ]),
      ),
    ].filter((n) => normalizarNome(n) !== normalizarNome(p.nome));
    return {
      nome: p.nome,
      nomeCivil: p.nomeCivil,
      outrosNomes: outrosNomes.length > 0 ? outrosNomes : undefined,
      sexo: p.sexo ?? grupo.find((g) => g.parlamentar.sexo)?.parlamentar.sexo,
      casa,
      partido: p.partido,
      uf: p.uf,
      urlFoto: p.urlFoto,
      emExercicio: grupo.some((g) => g.parlamentar.emExercicio),
      registros: ordenado.map((g) => ({
        casa: g.casa,
        id: g.parlamentar.id,
        legislaturas: g.parlamentar.legislaturas.map((l) => l.idLegislatura),
      })),
    };
  });

  // Slugs: ordem estável para desempate
  const chave = (p: Omit<Pessoa, "slug">) =>
    `${p.registros[0].casa}-${String(p.registros[0].id).padStart(9, "0")}`;
  const porBase = new Map<string, Array<Omit<Pessoa, "slug">>>();
  for (const p of [...pessoas].sort((a, b) =>
    chave(a).localeCompare(chave(b)),
  )) {
    const base = slugificar(p.nome) || chave(p);
    porBase.set(base, [...(porBase.get(base) ?? []), p]);
  }
  const resultado: Pessoa[] = [];
  const usados = new Set<string>();
  for (const [base, grupo] of porBase) {
    for (const p of grupo) {
      let slug = base;
      if (grupo.length > 1) slug = `${base}-${p.uf.toLowerCase()}`;
      if (usados.has(slug)) slug = `${base}-${p.registros[0].id}`;
      usados.add(slug);
      resultado.push({ slug, ...p });
    }
  }
  return resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
