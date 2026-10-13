import "server-only";
import type { MandatoNaLegislatura, Medianas } from "@etl/comum/saida";
import type { EmendasDoParlamentar } from "@etl/emendas/saida";
import type { Pessoa } from "@etl/pessoas/saida";
import type { EleicoesDoParlamentar } from "@etl/tse/saida";
import {
  type Casa,
  lerEleicoes,
  lerEmendas,
  lerFontes,
  lerParlamentar,
  lerPessoas,
  medianasDoMandato,
  type VotoRecente,
  votosRecentes,
} from "./dados";

export interface MandatoDoPerfil {
  /** "camara-57" */
  chave: string;
  casa: Casa;
  mandato: MandatoNaLegislatura;
  medianas: { casa?: Medianas; partido?: Medianas; uf?: Medianas };
  votosRecentes: VotoRecente[];
  urlFonte: string;
}

export interface Perfil {
  pessoa: Pessoa;
  /** Do mais recente para o mais antigo */
  mandatos: MandatoDoPerfil[];
  emendas?: EmendasDoParlamentar;
  eleicoes: EleicoesDoParlamentar["eleicoes"];
  atualizadoEm: {
    camara?: string;
    senado?: string;
    emendas?: string;
    tse?: string;
  };
}

export function slugsDosPerfis(): string[] {
  return lerPessoas().map((p) => p.slug);
}

/** Soma as emendas dos registros da mesma pessoa (deputado que virou senador). */
function juntarEmendas(
  lista: EmendasDoParlamentar[],
): EmendasDoParlamentar | undefined {
  if (lista.length <= 1) return lista[0];
  type Valores = { empenhado: number; pago: number };
  const somar = <T extends Valores>(
    itens: T[],
    chave: (i: T) => string,
  ): T[] => {
    const mapa = new Map<string, T>();
    for (const item of itens) {
      const k = chave(item);
      const atual = mapa.get(k);
      mapa.set(
        k,
        atual
          ? {
              ...atual,
              empenhado: atual.empenhado + item.empenhado,
              pago: atual.pago + item.pago,
            }
          : { ...item },
      );
    }
    return [...mapa.values()].sort((a, b) => b.empenhado - a.empenhado);
  };
  const [primeira] = lista;
  return {
    ...primeira,
    nomesNoPortal: [...new Set(lista.flatMap((e) => e.nomesNoPortal))],
    total: {
      empenhado: lista.reduce((s, e) => s + e.total.empenhado, 0),
      pago: lista.reduce((s, e) => s + e.total.pago, 0),
    },
    porAno: somar(
      lista.flatMap((e) => e.porAno),
      (a) => String(a.ano),
    ).sort((a, b) => a.ano - b.ano),
    porTipo: somar(
      lista.flatMap((e) => e.porTipo),
      (t) => t.tipo,
    ),
    porFuncao: somar(
      lista.flatMap((e) => e.porFuncao),
      (f) => f.funcao,
    ),
    porUf: somar(
      lista.flatMap((e) => e.porUf),
      (u) => u.uf,
    ),
    porMunicipio: somar(
      lista.flatMap((e) => e.porMunicipio),
      (m) => m.codigoIbge,
    ),
  };
}

export function carregarPerfil(slug: string): Perfil | undefined {
  const pessoa = lerPessoas().find((p) => p.slug === slug);
  if (!pessoa) return undefined;

  const mandatos: MandatoDoPerfil[] = [];
  const emendas: EmendasDoParlamentar[] = [];
  const eleicoes = new Map<string, EleicoesDoParlamentar["eleicoes"][number]>();

  for (const registro of pessoa.registros) {
    const parlamentar = lerParlamentar(registro.casa, registro.id);
    if (!parlamentar) continue;
    for (const mandato of parlamentar.legislaturas) {
      mandatos.push({
        chave: `${registro.casa}-${mandato.idLegislatura}`,
        casa: registro.casa,
        mandato,
        medianas: medianasDoMandato(registro.casa, mandato),
        votosRecentes: votosRecentes(registro.casa, mandato),
        urlFonte: parlamentar.urlFonte,
      });
    }
    const e = lerEmendas(registro.casa, registro.id);
    if (e) emendas.push(e);
    for (const eleicao of lerEleicoes(registro.casa, registro.id)?.eleicoes ??
      []) {
      eleicoes.set(`${eleicao.ano}-${eleicao.cargo}`, eleicao);
    }
  }

  const fontes = lerFontes();
  return {
    pessoa,
    mandatos: mandatos.sort(
      (a, b) =>
        b.mandato.idLegislatura - a.mandato.idLegislatura ||
        (a.casa === "senado" ? -1 : 1),
    ),
    emendas: juntarEmendas(emendas),
    eleicoes: [...eleicoes.values()].sort((a, b) => a.ano - b.ano),
    atualizadoEm: {
      camara: fontes?.camara?.atualizadoEm,
      senado: fontes?.senado?.atualizadoEm,
      emendas: fontes?.emendas?.atualizadoEm,
      tse: fontes?.tse?.atualizadoEm,
    },
  };
}
