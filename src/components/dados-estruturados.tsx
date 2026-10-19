/**
 * Dados estruturados (schema.org em JSON-LD) para buscadores. O `<` é
 * escapado para o texto nunca fechar a tag `<script>`. Não é JavaScript, então
 * a CSP não se aplica.
 */
export function DadosEstruturados({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON gerado no build a partir dos nossos dados
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
