import { expect, test } from "@playwright/test";

test("sitemap e robots.txt", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/politicos/tabata-amaral</loc>");
  expect(sitemap).toContain("/blog/como-medimos</loc>");
  expect(sitemap).toContain("/estados/sp</loc>");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
});

/** Lê os blocos JSON-LD da página. */
async function dadosEstruturados(page: import("@playwright/test").Page) {
  const blocos = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  return blocos.map((b) => JSON.parse(b));
}

test("perfil tem dados estruturados, endereço canônico e imagem própria", async ({
  page,
}) => {
  await page.goto("/politicos/tabata-amaral");
  const [pessoa] = await dadosEstruturados(page);
  expect(pessoa["@type"]).toBe("Person");
  expect(pessoa.name).toBe("Tabata Amaral");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/politicos\/tabata-amaral$/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og\/politicos\/tabata-amaral\.png$/,
  );
});

test("post do blog tem BlogPosting", async ({ page }) => {
  await page.goto("/blog/como-medimos");
  const [post] = await dadosEstruturados(page);
  expect(post["@type"]).toBe("BlogPosting");
  expect(post.headline).toContain("Como o Nossa Política mede");
});

test("previews não entram nos buscadores", async ({ request, baseURL }) => {
  test.skip(
    new URL(baseURL ?? "http://localhost").hostname === "nossapolitica.com.br",
    "Só fora do domínio principal",
  );
  const resposta = await request.get("/");
  expect(resposta.headers()["x-robots-tag"]).toBe("noindex");
});
