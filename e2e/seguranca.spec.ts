import { expect, test } from "@playwright/test";

// A CSP só vale no build de produção; no `next dev` não há o que conferir
test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Só roda contra uma URL publicada");

const PAGINAS = [
  "/",
  "/politicos/tabata-amaral",
  "/explorar",
  "/comparar?p=nikolas-ferreira,tabata-amaral",
  "/blog/como-medimos",
];

for (const caminho of PAGINAS) {
  test(`cabeçalhos de segurança e nada bloqueado pela CSP em ${caminho}`, async ({
    page,
  }) => {
    const bloqueios: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy|Content-Security-Policy/i.test(msg.text()))
        bloqueios.push(msg.text());
    });
    const resposta = await page.goto(caminho);
    await page.waitForLoadState("networkidle");

    const cabecalhos = resposta?.headers() ?? {};
    expect(cabecalhos["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(cabecalhos["strict-transport-security"]).toContain("max-age=");
    expect(cabecalhos["x-content-type-options"]).toBe("nosniff");
    expect(cabecalhos["x-powered-by"]).toBeUndefined();
    expect(bloqueios).toEqual([]);
  });
}
