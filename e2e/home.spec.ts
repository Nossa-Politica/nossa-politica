import { expect, test } from "@playwright/test";

test("a página inicial mostra o nome do site", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Nossa Política");
  await expect(
    page.getByRole("heading", { level: 1, name: "O que o seu político fez?" }),
  ).toBeVisible();
});

test("busca um político sem acento e abre o perfil", async ({ page }) => {
  await page.goto("/");
  const campo = page.getByLabel("Busque um deputado ou senador");
  test.skip(!(await campo.isVisible()), "Build sem dados");

  // "Acácio" escrito sem acento
  await campo.fill("acacio favacho");
  const resultado = page.getByRole("link", { name: /Acácio Favacho/ });
  await expect(resultado).toBeVisible();
  await resultado.click();

  await expect(page).toHaveURL(/\/politicos\/acacio-favacho$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Acácio Favacho" }),
  ).toBeVisible();
  for (const bloco of [
    "Gastos da cota parlamentar",
    "Projetos",
    "Votações",
    "Presença",
  ]) {
    await expect(page.getByText(bloco, { exact: true }).first()).toBeVisible();
  }
  await expect(
    page.getByText("Emendas parlamentares", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Eleições", { exact: true })).toBeVisible();
});

test("lista quem representa o estado", async ({ page }) => {
  await page.goto("/");
  const seletor = page.getByLabel("Escolha o seu estado");
  test.skip(!(await seletor.isVisible()), "Build sem dados");

  await seletor.selectOption("AC");
  await expect(
    page.getByRole("heading", { name: /Senado \(3\)/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Câmara dos Deputados \(8\)/ }),
  ).toBeVisible();
});

test("endereço de político que não existe dá 404", async ({ page }) => {
  const resposta = await page.goto("/politicos/ninguem-com-este-nome");
  expect(resposta?.status()).toBe(404);
});
