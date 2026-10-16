import { expect, test } from "@playwright/test";

test("blog lista os posts e abre um post com dados do build", async ({
  page,
}) => {
  await page.goto("/blog");
  const post = page.getByRole("link", { name: /Como o Nossa Política mede/ });
  await expect(post).toBeVisible();
  await post.click();
  await expect(page).toHaveURL(/\/blog\/como-medimos$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Como o Nossa Política mede",
  );
  // O componente <Mediana> escreve o número lido dos dados no build
  await expect(
    page.getByText(/presença mediana dos deputados .* é de \d+,?\d*%/),
  ).toBeVisible();
});

test("RSS e imagem de compartilhamento estão publicados", async ({
  request,
  page,
}) => {
  const rss = await request.get("/rss.xml");
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
  expect(await rss.text()).toContain("<title>Como o Nossa Política mede");

  await page.goto("/blog/como-medimos");
  const imagem = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(imagem).toMatch(/\/og\/blog\/como-medimos\.png$/);
  const resposta = await request.get(new URL(imagem ?? "").pathname);
  expect(resposta.headers()["content-type"]).toBe("image/png");
});
