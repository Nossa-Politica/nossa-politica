import Image from "next/image";
import Link from "next/link";
import type { ItemBusca } from "@/lib/busca";

export function ItemPessoa({
  item,
  comoLink = true,
}: {
  item: ItemBusca;
  /** false quando o item fica dentro de um botão (não pode ter link dentro) */
  comoLink?: boolean;
}) {
  const classe =
    "flex items-center gap-3 rounded-lg p-2 hover:bg-muted focus-visible:bg-muted";
  const conteudo = (
    <>
      <Image
        src={item.f}
        alt=""
        width={40}
        height={52}
        unoptimized
        loading="lazy"
        className="h-13 w-10 shrink-0 rounded-md bg-muted object-cover"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{item.n}</span>
        <span className="truncate text-sm text-muted-foreground">
          {item.c} · {item.p}-{item.u}
        </span>
      </span>
    </>
  );
  return comoLink ? (
    <Link href={`/politicos/${item.s}`} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <span className={classe}>{conteudo}</span>
  );
}
