import "server-only";
import type { Medianas } from "@etl/comum/saida";
import {
  type Casa,
  lerAgregados,
  lerEmendas,
  lerFontes,
  lerParlamentar,
  lerPessoas,
} from "./dados";
import { cargo } from "./formatar";
import type {
  Indicadores,
  MedianasResumo,
  ResumoPessoa,
} from "./tipos-indicadores";

function medianasAtuais(casa: Casa): MedianasResumo {
  const legislaturas = lerAgregados(casa)?.legislaturas ?? [];
  const atual: Medianas | undefined =
    legislaturas[legislaturas.length - 1]?.casa;
  return {
    presenca: atual?.presencaPercentual ?? null,
    primeiroAutor: atual?.proposicoesComoPrimeiroAutor ?? null,
    viraramNorma: atual?.viraramNorma ?? null,
    gastoMensal: atual?.despesaMediaMensal ?? null,
  };
}

/** Um resumo por pessoa, do mandato mais recente (na casa principal). */
export function montarIndicadores(): Indicadores {
  const pessoas: ResumoPessoa[] = [];
  for (const p of lerPessoas()) {
    const registro =
      p.registros.find((r) => r.casa === p.casa) ?? p.registros[0];
    const parlamentar = lerParlamentar(registro.casa, registro.id);
    const mandato = parlamentar?.legislaturas.at(-1);
    if (!mandato) continue;
    const emendas = p.registros
      .map((r) => lerEmendas(r.casa, r.id)?.total.empenhado ?? 0)
      .reduce((s, v) => s + v, 0);
    const titulo = cargo(p.casa, p.sexo);
    pessoas.push({
      slug: p.slug,
      nome: p.nome,
      foto: p.urlFoto,
      cargo: p.emExercicio
        ? titulo
        : `Ex-${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`,
      casa: p.casa,
      partido: p.partido,
      uf: p.uf,
      emExercicio: p.emExercicio,
      legislatura: mandato.idLegislatura,
      presenca: mandato.presenca.percentual,
      primeiroAutor: mandato.proposicoes.comoPrimeiroAutor,
      viraramNorma: mandato.proposicoes.viraramNorma,
      gastoMensal: mandato.despesas.mediaMensal,
      comPartido: mandato.votacoes.alinhamentoPartido.percentual,
      comGoverno: mandato.votacoes.alinhamentoGoverno.percentual,
      emendas: emendas > 0 ? Math.round(emendas) : null,
    });
  }
  return {
    atualizadoEm: lerFontes()?.camara?.atualizadoEm,
    medianas: {
      camara: medianasAtuais("camara"),
      senado: medianasAtuais("senado"),
    },
    pessoas,
  };
}
