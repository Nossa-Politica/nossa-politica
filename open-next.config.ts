import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// As páginas só mudam a cada deploy (depois da carga diária de dados), então
// o cache de páginas fica nos arquivos estáticos do próprio deploy: não expira
// e não ocupa o R2.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  // Páginas já geradas saem direto do cache, sem carregar o servidor do
  // Next.js: menos tempo de resposta, principalmente com o Worker "frio".
  // Não serve com PPR, que o projeto não usa.
  enableCacheInterception: true,
});
