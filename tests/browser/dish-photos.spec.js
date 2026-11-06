import { test, expect } from "@playwright/test";

test("browse photos, open a credited full image on demand, return to filter, start cooking", async ({ page }) => {
  const requests = [];
  page.on("request", req => { if (req.url().includes("/dishes/")) requests.push(req.url()); });
  await page.goto("/#search");
  await page.getByRole("button", { name: "有成品实拍" }).click();
  await page.getByRole("textbox", { name: "搜索菜谱" }).fill("番茄炒鸡蛋");
  const row = page.locator(".recipe-open").first();
  await expect.poll(() => row.locator("img").evaluate(im => im.naturalWidth)).toBe(224);
  await page.screenshot({path: "test-results/recipes-mobile.png"});
  await row.click();
  expect(requests.filter(url => url.endsWith("-view.webp"))).toEqual([]);
  await page.getByRole("button", { name: "看实拍，放大番茄炒鸡蛋" }).click();
  const dialog = page.getByRole("dialog", { name: "番茄炒鸡蛋成品实拍" });
  await expect.poll(() => dialog.locator("img").evaluate(im => im.naturalWidth)).toBeGreaterThan(224);
  await expect(dialog.getByRole("link", { name: /Godofnanjing/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "CC BY-SA 3.0" })).toBeVisible();
  await page.screenshot({path: "test-results/photo-mobile.png"});
  await dialog.getByRole("button", { name: "关闭实拍" }).click();
  await page.getByRole("button", { name: "返回菜谱" }).click();
  await expect(page.getByRole("button", { name: "有成品实拍" })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".recipe-open").first().click();
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.getByRole("button", { name: "开始做这道菜", exact: true }).click();
  await expect(page.locator(".cooking-overview > li").first()).toBeVisible();
});

test("missing photos offer a dish-specific reference without requesting an image", async ({ page }) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto("/#recipe/cold-tofu");
  await expect(page.locator(".dish-heading img")).toHaveCount(0);
  const link = page.locator(".dish-heading a");
  await expect(link).toHaveAttribute("href", "https://m.xiachufang.com/recipe/106603159/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a photographed soup remains discoverable when searching the dish tab", async ({page}) => {
  await page.goto("/#search");
  await page.getByRole("button", {name:"有成品实拍"}).click();
  const query = page.getByRole("textbox", {name:"搜索菜谱"});
  await query.fill("番茄蛋花汤");
  await page.getByRole("button", {name:/在汤羹中查看/}).click();
  await expect(query).toHaveValue("番茄蛋花汤");
  await expect(page.getByRole("button", {name:"有成品实拍"})).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".recipe-open").first()).toContainText("番茄蛋花汤");
});
