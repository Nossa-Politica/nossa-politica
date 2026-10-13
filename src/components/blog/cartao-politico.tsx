import Image from "next/image";
import Link from "next/link";
import { formatarMoeda, formatarPercentual } from "@/lib/formatar";
import type { ResumoPessoa } from "@/lib/tipos-indicadores";

/** Cartão de um parlamentar para usar dentro de posts. */
export function CartaoPolitico({ pessoa }: { pessoa: ResumoPessoa }) {
  return (
    <Link
      href={`/politicos/${pessoa.slug}`}
      className="my-6 flex items-center gap-4 rounded-xl border p-4 hover:bg-muted"
    >
      <Image
        src={pessoa.foto}
        alt=""
        width={56}
        height={74}
        unoptimized
        className="h-18 w-14 shrink-0 rounded-md bg-muted object-cover"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{pessoa.nome}</span>
        <span className="text-sm text-muted-foreground">
          {pessoa.cargo} · {pessoa.partido}-{pessoa.uf}
        </span>
        <span className="text-sm">
          Presença{" "}
          {pessoa.presenca === null ? "—" : formatarPercentual(pessoa.presenca)}{" "}
          · gasto da cota{" "}
          {pessoa.gastoMensal === null
            ? "—"
            : `${formatarMoeda(pessoa.gastoMensal)}/mês`}
        </span>
      </span>
    </Link>
  );
}
