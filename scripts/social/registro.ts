import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

/*
 * Registro do que já foi publicado em cada rede, para nunca repetir um post.
 * Fica na branch `social` (a `main` é protegida e o workflow não pode gravar
 * nela) e é baixado para `.social/` antes de cada publicação.
 */

export const Publicacao = z.object({
  /** Endereço público da publicação na rede */
  url: z.string().url(),
  /** Identificador interno da rede (no Bluesky, o `at://`) */
  id: z.string(),
  publicadoEm: z.string(),
});
export type Publicacao = z.infer<typeof Publicacao>;

/** `{ rede: { slugDoPost: publicação } }` */
export const Registro = z.record(z.string(), z.record(z.string(), Publicacao));
export type Registro = z.infer<typeof Registro>;

export async function lerRegistro(caminho: string): Promise<Registro> {
  try {
    return Registro.parse(JSON.parse(await readFile(caminho, "utf8")));
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw erro;
  }
}

export async function salvarRegistro(caminho: string, registro: Registro) {
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, `${JSON.stringify(registro, null, 2)}\n`);
}
