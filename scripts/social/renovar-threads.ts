/**
 * Renova o token do Threads e escreve o novo na saída padrão, para ser
 * passado direto ao `gh secret set` (o token nunca aparece no log):
 *
 *   tsx scripts/social/renovar-threads.ts | gh secret set THREADS_ACCESS_TOKEN
 */
import { renovarToken } from "./threads";

const token = process.env.THREADS_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Falta a variável THREADS_ACCESS_TOKEN.");
  process.exit(1);
}

renovarToken(token)
  .then(({ access_token, expires_in }) => {
    const dias = Math.round(expires_in / 86_400);
    console.error(`Token do Threads renovado: vale por mais ${dias} dias.`);
    process.stdout.write(access_token);
  })
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
