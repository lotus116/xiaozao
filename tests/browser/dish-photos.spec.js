import { test, expect } from "@playwright/test";

test("browse photos, open a credited full image on demand, return to filter, start cooking", async ({ page }) => {
  const requests = [];
  page.on("request", req => { if (req.url().includes("/dishes/")) requests.push(req.url()); });
  await page.goto("/#search");
  await page.getByRole("textbox", { name: "搜索菜谱" }).fill("番茄炒鸡蛋");
  const row = page.locator(".recipe-open").first();
  await expect.poll(() => row.locator("img").evaluate(im => im.naturalWidth)).toBe(224);
  await page.screenshot({path: "test-results/recipes-mobile.png"});
  await row.click();
  expect(requests.filter(url => url.endsWith("-view.webp"))).toEqual([]);
  await page.getByRole("button", { name: "看实拍，放大番茄炒鸡蛋" }).click();
  const dialog = page.getByRole("dialog", { name: "番茄炒鸡蛋成品实拍" });
  await expect.poll(() => dialog.locator("img").evaluate(im => im.naturalWidth)).toBeGreaterThan(224);
  await page.screenshot({path: "test-results/photo-mobile.png"});
  await dialog.getByRole("button", { name: "查看图片来源" }).click();
  const credit = page.locator(".detail > footer:last-child");
  await expect(credit).toBeFocused();
  await expect(credit.getByRole("link", { name: /Godofnanjing/ })).toBeVisible();
  await expect(credit.getByRole("link", { name: "CC BY-SA 3.0" })).toBeVisible();
  await page.getByRole("button", { name: "返回菜谱" }).click();
  await page.locator(".recipe-open").first().click();
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.getByRole("button", { name: "开始做这道菜", exact: true }).click();
  await expect(page.locator(".cooking-overview > li").first()).toBeVisible();
});

test("course photo opens offline with its author and domestic recipe link at the foot of the page", async ({ page, context }) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto("/#recipe/cold-tofu");
  const heading = page.locator(".dish-heading");
  await expect.poll(() => heading.locator("img").evaluate(im => im.naturalWidth)).toBeGreaterThan(200);
  await expect(page.locator(".detail > footer:last-child")).toContainText("来源于下厨房");
  await context.setOffline(true);
  await heading.getByRole("button", {name:/看实拍/}).click();
  const dialog = page.getByRole("dialog");
  await expect.poll(() => dialog.locator("img").evaluate(im => im.naturalWidth)).toBeGreaterThan(200);
  await expect(page.locator("#photo-credit").getByRole("link", {name:/来源于下厨房/})).toHaveAttribute("href", /xiachufang.com\/recipe\/./);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a photographed soup remains discoverable when searching the dish tab", async ({page}) => {
  await page.goto("/#search");
  const query = page.getByRole("textbox", {name:"搜索菜谱"});
  await query.fill("番茄蛋花汤");
  await page.getByRole("button", {name:/在汤羹中查看/}).click();
  await expect(query).toHaveValue("番茄蛋花汤");
  await expect(page.locator(".recipe-open").first()).toContainText("番茄蛋花汤");
});

test("mixed photo shapes share a square and text alignment on phone and desktop", async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height: 844});
    await page.goto("/#search");
    const tiles = page.locator(".recipe-row .dish-tile");
    await expect(tiles.first()).toBeVisible();
    const sizes = await tiles.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return [rect.x, rect.width, rect.height, getComputedStyle(node).borderRadius,
        node.nextElementSibling.getBoundingClientRect().x];
    }));
    expect(sizes.length).toBeGreaterThan(1);
    expect(sizes.every(size => JSON.stringify(size) === JSON.stringify(sizes[0]))).toBe(true);
    expect(Math.abs(sizes[0][1] - sizes[0][2])).toBeLessThan(1);
    await expect(page.locator(".recipe-row a")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width !== 320) {
      const example = page.locator(".recipe-row").filter({has: page.getByText("韭菜炒鸡蛋", {exact:true})});
      await example.evaluate(node => node.scrollIntoView({block:"start"}));
      await example.locator(".dish-thumbnail").evaluate(img => img.decode());
      await page.screenshot({path: `test-results/dish-tiles-${width}.png`});
    }
  }
});

test("narrow recipe rows keep both actions below the photo and leave the title tappable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 704 });
  await page.goto("/#search");
  const row = page.locator(".recipe-row").first();
  const photo = await row.locator(".dish-tile").boundingBox();
  const actions = await row.locator(".recipe-actions").boundingBox();
  const title = row.locator(".recipe-copy strong");
  expect(actions.y).toBeGreaterThanOrEqual(photo.y + photo.height);
  expect(actions.x + actions.width).toBeLessThanOrEqual((await title.boundingBox()).x);
  for (const action of await row.locator(".recipe-actions button").all()) {
    const size = await action.boundingBox();
    expect(Math.min(size.width, size.height)).toBeGreaterThanOrEqual(44);
  }
  const name = await title.innerText();
  await title.click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});
