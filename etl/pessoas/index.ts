/**
 * Lista de pessoas (`dados/pessoas.json`) a partir das cargas da Câmara e do
 * Senado, que precisam ter rodado antes na mesma pasta.
 *
 *   pnpm etl:pessoas [--dados pasta]
 */
import { join } from "node:path";
import { parseArgs } from "node:util";
import { Parlamentar } from "../comum/saida";
import { escreverJson, lerJson, listarArquivos } from "../lib/arquivos";
import { montarPessoas, type ParlamentarComCasa } from "./consolidar";
import { ListaPessoas } from "./saida";

const PASTAS = {
  camara: join("camara", "deputados"),
  senado: join("senado", "senadores"),
} as const;

async function main() {
  const { values } = parseArgs({
    options: { dados: { type: "string", default: "dados" } },
  });

  const todos: ParlamentarComCasa[] = [];
  for (const casa of ["camara", "senado"] as const) {
    const pasta = join(values.dados, PASTAS[casa]);
    for (const arquivo of await listarArquivos(pasta)) {
      if (!arquivo.endsWith(".json")) continue;
      todos.push({
        casa,
        parlamentar: Parlamentar.parse(await lerJson(join(pasta, arquivo))),
      });
    }
  }
  if (todos.length === 0) {
    throw new Error(`Nenhum parlamentar em ${values.dados}.`);
  }

  const pessoas = montarPessoas(todos);
  await escreverJson(
    join(values.dados, "pessoas.json"),
    ListaPessoas.parse({
      versao: 1,
      atualizadoEm: new Date().toISOString(),
      pessoas,
    }),
  );
  const nasDuas = pessoas.filter((p) => p.registros.length > 1).length;
  console.log(
    `Pronto: ${pessoas.length} pessoas (${nasDuas} passaram pelas duas casas).`,
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
