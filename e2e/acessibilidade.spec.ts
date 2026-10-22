import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Auditoria automática de acessibilidade (axe) nas principais páginas, contra
 * as regras WCAG 2.1 níveis A e AA. Roda no claro e no escuro, porque o
 * contraste das cores muda entre os temas.
 */

const PAGINAS = [
  "/",
  "/politicos/tabata-amaral",
  "/explorar",
  "/comparar?p=nikolas-ferreira,tabata-amaral",
  "/votacoes",
  "/estados",
  "/estados/sp",
  "/blog",
  "/blog/como-medimos",
  "/metodologia",
  "/privacidade",
];

for (const tema of ["light", "dark"] as const) {
  test.describe(`tema ${tema === "light" ? "claro" : "escuro"}`, () => {
    test.use({ colorScheme: tema });

    for (const caminho of PAGINAS) {
      test(`sem problemas de acessibilidade em ${caminho}`, async ({
        page,
      }) => {
        await page.goto(caminho);
        // Espera a página montar (no `next dev`, a primeira visita compila)
        await expect(page.locator("h1").first()).toBeVisible();
        await page.waitForLoadState("networkidle");
        const resultado = await new AxeBuilder({ page })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "best-practice",
          ])
          .analyze();
        const problemas = resultado.violations.map((v) => ({
          regra: v.id,
          impacto: v.impact,
          descricao: v.help,
          exemplos: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
        }));
        expect(problemas).toEqual([]);
      });
    }
  });
}

test.describe("teclado", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Navegação por Tab só faz sentido com teclado",
  );

  test("o primeiro Tab mostra o atalho que pula o menu", async ({ page }) => {
    await page.goto("/politicos/tabata-amaral");
    await page.keyboard.press("Tab");
    const atalho = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(atalho).toBeFocused();
    await expect(atalho).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#conteudo$/);
    await expect(page.locator("#conteudo")).toBeFocused();
  });

  test("termo do glossário abre com Enter e fecha com Esc", async ({
    page,
  }) => {
    await page.goto("/blog/como-medimos");
    const termo = page.getByRole("button", { name: "mediana" }).first();
    await termo.focus();
    await page.keyboard.press("Enter");
    const explicacao = page.getByRole("dialog");
    await expect(explicacao).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(explicacao).toBeHidden();
    await expect(termo).toBeFocused();
  });

  test("links focados têm contorno visível", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Explorar" }).first();
    await link.focus();
    const contorno = await link.evaluate((el) => {
      const estilo = getComputedStyle(el);
      return { estilo: estilo.outlineStyle, largura: estilo.outlineWidth };
    });
    expect(contorno.estilo).not.toBe("none");
    expect(contorno.largura).not.toBe("0px");
  });
});
