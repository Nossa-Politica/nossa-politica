import "server-only";
import {
  type Casa,
  lerAgregados,
  lerEmendasPorUf,
  lerParlamentar,
  lerPessoas,
  pessoaDoRegistro,
} from "./dados";
import { montarIndicadores } from "./indicadores";
import type { ResumoPessoa } from "./tipos-indicadores";

export interface EstadoCompleto {
  uf: string;
  senadores: ResumoPessoa[];
  deputados: ResumoPessoa[];
  /** Soma do gasto da cota de todos que exerceram mandato pela UF na legislatura atual */
  gastos: Record<
    Casa,
    { total: number; parlamentares: number; legislatura?: number }
  >;
  medianaPresenca: Record<Casa, number | null>;
  emendas?: {
    empenhado: number;
    pago: number;
    porAno: Array<{ ano: number; empenhado: number }>;
    porTipo: Array<{ tipo: string; empenhado: number }>;
    /** Parlamentares que mais indicaram emendas para a UF (podem ser de outros estados) */
    porParlamentar: Array<{
      slug: string;
      nome: string;
      uf: string;
      empenhado: number;
    }>;
  };
}

function gastosDaUf(casa: Casa, uf: string) {
  const legislaturas = lerAgregados(casa)?.legislaturas ?? [];
  const atual = legislaturas[legislaturas.length - 1]?.idLegislatura;
  let total = 0;
  let parlamentares = 0;
  for (const pessoa of lerPessoas()) {
    for (const r of pessoa.registros.filter((x) => x.casa === casa)) {
      const mandato = lerParlamentar(casa, r.id)?.legislaturas.find(
        (l) => l.idLegislatura === atual && l.uf === uf,
      );
      if (!mandato) continue;
      total += mandato.despesas.total;
      parlamentares++;
    }
  }
  return { total, parlamentares, legislatura: atual };
}

function medianaPresenca(casa: Casa, uf: string) {
  const legislaturas = lerAgregados(casa)?.legislaturas ?? [];
  return (
    legislaturas[legislaturas.length - 1]?.ufs[uf]?.presencaPercentual ?? null
  );
}

export function carregarEstado(uf: string): EstadoCompleto {
  const atuais = montarIndicadores().pessoas.filter(
    (p) => p.emExercicio && p.uf === uf,
  );
  const porNome = (a: ResumoPessoa, b: ResumoPessoa) =>
    a.nome.localeCompare(b.nome, "pt-BR");
  const emendasUf = lerEmendasPorUf()?.ufs[uf];

  return {
    uf,
    senadores: atuais.filter((p) => p.casa === "senado").sort(porNome),
    deputados: atuais.filter((p) => p.casa === "camara").sort(porNome),
    gastos: {
      camara: gastosDaUf("camara", uf),
      senado: gastosDaUf("senado", uf),
    },
    medianaPresenca: {
      camara: medianaPresenca("camara", uf),
      senado: medianaPresenca("senado", uf),
    },
    emendas: emendasUf && {
      empenhado: emendasUf.empenhado,
      pago: emendasUf.pago,
      porAno: emendasUf.porAno.map((a) => ({
        ano: a.ano,
        empenhado: a.empenhado,
      })),
      porTipo: emendasUf.porTipo.map((t) => ({
        tipo: t.tipo,
        empenhado: t.empenhado,
      })),
      porParlamentar: emendasUf.porParlamentar.slice(0, 10).flatMap((p) => {
        const pessoa = pessoaDoRegistro(p.casa, p.id);
        return pessoa
          ? [
              {
                slug: pessoa.slug,
                nome: pessoa.nome,
                uf: pessoa.uf,
                empenhado: p.empenhado,
              },
            ]
          : [];
      }),
    },
  };
}
