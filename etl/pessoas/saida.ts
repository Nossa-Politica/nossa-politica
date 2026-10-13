import { z } from "zod";

/*
 * `dados/pessoas.json`: uma entrada por pessoa, juntando os registros da
 * Câmara e do Senado de quem passou pelas duas casas. É o que o site usa para
 * a busca e para os endereços `/politicos/[slug]`.
 */

export const Registro = z.object({
  casa: z.enum(["camara", "senado"]),
  id: z.number(),
  legislaturas: z.array(z.number()),
});
export type Registro = z.infer<typeof Registro>;

export const Pessoa = z.object({
  /** Único entre todas as pessoas; estável enquanto o nome não mudar */
  slug: z.string(),
  nome: z.string(),
  nomeCivil: z.string().optional(),
  outrosNomes: z.array(z.string()).optional(),
  sexo: z.enum(["F", "M"]).optional(),
  /** Casa do registro principal: o em exercício ou, senão, o mais recente */
  casa: z.enum(["camara", "senado"]),
  partido: z.string(),
  uf: z.string(),
  urlFoto: z.string(),
  emExercicio: z.boolean(),
  /** Do mais recente para o mais antigo */
  registros: z.array(Registro).min(1),
});
export type Pessoa = z.infer<typeof Pessoa>;

export const ListaPessoas = z.object({
  versao: z.literal(1),
  atualizadoEm: z.string(),
  pessoas: z.array(Pessoa),
});
export type ListaPessoas = z.infer<typeof ListaPessoas>;
