import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Endereços antigos ou alternativos que levam ao domínio principal
const HOSTS_REDIRECIONADOS = [
  "www.nossapolitica.com.br",
  "nossa-politica.guilhermemunizcardoso.workers.dev",
];

const nextConfig: NextConfig = {
  async redirects() {
    return HOSTS_REDIRECIONADOS.map((host) => ({
      source: "/:caminho*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://nossapolitica.com.br/:caminho*",
      permanent: true,
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Disponibiliza os bindings da Cloudflare (R2, Images…) no `next dev`
initOpenNextCloudflareForDev();
