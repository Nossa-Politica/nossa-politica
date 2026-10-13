import { expect, test } from "@playwright/test";

/* Páginas da fase 5. Precisam de dados; num build sem dados, são puladas. */

test.beforeEach(async ({ request }) => {
  const resposta = await request.get("/api/indicadores");
  const { pessoas } = await resposta.json();
  test.skip(!pessoas?.length, "Build sem dados");
});

test("explorar filtra por estado e indicador e marca a mediana", async ({
  page,
}) => {
  await page.goto("/explorar?indicador=gastoMensal&uf=AC");
  await expect(
    page.getByRole("heading", {
      name: /Gasto da cota por mês: mediana de R\$/,
    }),
  ).toBeVisible();
  // Acre tem 8 deputados em exercício
  await expect(page.getByText(/^8 parlamentares/)).toBeVisible();
  await page.getByLabel("Casa").selectOption("senado");
  await expect(page.getByText(/^3 parlamentares/)).toBeVisible();
  await expect(page).toHaveURL(/casa=senado/);
});

test("comparar mostra as três pessoas na tela", async ({ page }) => {
  await page.goto("/comparar?p=nikolas-ferreira,tabata-amaral,alan-rick");
  for (const nome of ["Nikolas Ferreira", "Tabata Amaral", "Alan Rick"]) {
    await expect(page.getByRole("link", { name: nome })).toBeInViewport();
  }
  await page.getByRole("button", { name: "Remover" }).first().click();
  await expect(page).toHaveURL(/p=tabata-amaral,alan-rick$/);
  await expect(page.getByLabel("Adicionar mais alguém")).toBeVisible();
});

test("página de votação mostra placar e como cada um votou", async ({
  page,
}) => {
  await page.goto("/votacoes");
  await page.locator("main ol a").first().click();
  await expect(page).toHaveURL(/\/votacoes\/camara\//);
  await expect(
    page.getByRole("heading", { name: "O que foi votado" }),
  ).toBeVisible();
  await expect(page.getByText(/^Sim:/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Como cada um votou" }),
  ).toBeVisible();
  await page.getByLabel("Estado").selectOption("AC");
  await expect(page.getByText(/^\d+ de \d+$/)).toBeVisible();
});

test("página do estado mostra a bancada e as emendas recebidas", async ({
  page,
}) => {
  await page.goto("/estados/ac");
  await expect(
    page.getByRole("heading", { level: 1, name: "Acre" }),
  ).toBeVisible();
  await expect(
    page.getByText("3 senadores e 8 deputados federais em exercício."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /enviadas para o Acre/ }),
  ).toBeVisible();
});
