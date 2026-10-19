/** Endereço público do site (RSS, imagens de compartilhamento, metadados). */
export const URL_DO_SITE =
  process.env.NEXT_PUBLIC_URL_DO_SITE ?? "https://nossapolitica.com.br";

/** O site como organização, nos dados estruturados (schema.org). */
export const ORGANIZACAO = {
  "@type": "Organization",
  name: "Nossa Política",
  url: URL_DO_SITE,
} as const;
