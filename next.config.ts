import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Endereços antigos ou alternativos que levam ao domínio principal
const HOSTS_REDIRECIONADOS = [
  "www.nossapolitica.com.br",
  "nossa-politica.guilhermemunizcardoso.workers.dev",
];

/*
 * Cabeçalhos de segurança de todas as páginas. Os arquivos estáticos
 * (`/_next/static`, imagens) recebem os mesmos em `public/_headers`.
 *
 * A política de conteúdo (CSP) só permite scripts do próprio site. O
 * 'unsafe-inline' é necessário porque as páginas são estáticas e o Next.js
 * embute scripts nelas (não há como gerar um nonce por visita). Fotos vêm dos
 * sites da Câmara e do Senado. O Cloudflare Web Analytics (sem cookies) é
 * injetado pela própria Cloudflare. Analytics ou anúncios novos precisam
 * entrar aqui, senão o navegador os bloqueia.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CABECALHOS_DE_SEGURANCA = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    // No `next dev`, a CSP quebraria a recarga automática (que usa eval)
    const csp =
      process.env.NODE_ENV === "production"
        ? [{ key: "Content-Security-Policy", value: CSP }]
        : [];
    return [
      { source: "/:caminho*", headers: [...CABECALHOS_DE_SEGURANCA, ...csp] },
      // Previews dos PRs e endereços antigos não entram nos buscadores
      {
        source: "/:caminho*",
        missing: [{ type: "host" as const, value: "nossapolitica.com.br" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
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
