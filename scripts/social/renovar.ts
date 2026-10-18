/**
 * Renova o token de longa duração de uma rede (Threads ou Instagram) e
 * escreve o novo na saída padrão, para ser passado direto ao `gh secret set`
 * (o token nunca aparece no log):
 *
 *   tsx scripts/social/renovar.ts threads | gh secret set THREADS_ACCESS_TOKEN
 *   tsx scripts/social/renovar.ts instagram | gh secret set INSTAGRAM_ACCESS_TOKEN
 */
import * as instagram from "./instagram";
import * as threads from "./threads";

const REDES = {
  threads: { variavel: "THREADS_ACCESS_TOKEN", renovar: threads.renovarToken },
  instagram: {
    variavel: "INSTAGRAM_ACCESS_TOKEN",
    renovar: instagram.renovarToken,
  },
};

const rede = process.argv[2] as keyof typeof REDES;
const config = REDES[rede];
if (!config) {
  console.error(`Use: renovar.ts ${Object.keys(REDES).join(" | ")}`);
  process.exit(1);
}
const token = process.env[config.variavel]?.trim();
if (!token) {
  console.error(`Falta a variável ${config.variavel}.`);
  process.exit(1);
}

config
  .renovar(token)
  .then(({ access_token, expires_in }) => {
    const dias = Math.round(expires_in / 86_400);
    console.error(`Token de ${rede} renovado: vale por mais ${dias} dias.`);
    process.stdout.write(access_token);
  })
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
