import type { Pessoa } from "@etl/pessoas/saida";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cargo, nomeLegislatura, UFS } from "@/lib/formatar";
import type { MandatoDoPerfil } from "@/lib/perfil";
import { Compartilhar } from "./compartilhar";

export function Cabecalho({
  pessoa,
  mandatos,
}: {
  pessoa: Pessoa;
  mandatos: MandatoDoPerfil[];
}) {
  const titulo = cargo(pessoa.casa, pessoa.sexo);
  const situacao = pessoa.emExercicio
    ? `${titulo} em exercício`
    : `Ex-${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}`;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Image
          src={pessoa.urlFoto}
          alt={`Foto de ${pessoa.nome}`}
          width={96}
          height={128}
          unoptimized
          priority
          className="h-32 w-24 shrink-0 rounded-lg bg-muted object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight">
            {pessoa.nome}
          </h1>
          <p className="text-muted-foreground">
            {situacao} · {pessoa.partido} · {UFS[pessoa.uf] ?? pessoa.uf}
          </p>
          {pessoa.nomeCivil && (
            <p className="text-xs text-muted-foreground">
              Nome civil: {pessoa.nomeCivil}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {mandatos.map((m) => (
          <Badge key={m.chave} variant="secondary">
            {m.casa === "camara" ? "Câmara" : "Senado"} ·{" "}
            {nomeLegislatura(m.mandato.idLegislatura)}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Compartilhar titulo={`${pessoa.nome} · Nossa Política`} />
        <Link
          href={`/comparar?p=${pessoa.slug}`}
          className="text-sm underline underline-offset-2"
        >
          Comparar com outro parlamentar
        </Link>
        <a
          href={
            (mandatos.find((m) => m.casa === pessoa.casa) ?? mandatos[0])
              ?.urlFonte
          }
          target="_blank"
          rel="noopener"
          className="text-sm underline underline-offset-2"
        >
          {pessoa.casa === "camara"
            ? "Página oficial na Câmara"
            : "Página oficial no Senado"}
        </a>
      </div>
    </header>
  );
}
