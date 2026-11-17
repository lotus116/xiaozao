import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { recipes } from "../../src/recipes.js";
import photos from "../../src/dish-photos.json" with { type: "json" };

test.use({ isMobile: true, hasTouch: true });
const button = (page, name) => page.getByRole("button", { name, exact: typeof name === "string" });
const read = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1")));
async function seed(page, state, route = "pantry") {
  await page.goto("/");
  await page.evaluate((state) => localStorage.setItem("xiaozao-v1", JSON.stringify({ version: 3, ...state })), state);
  await page.goto("/#" + route);
  await page.reload();
}
async function unobscured(page, locator) {
  await expect(locator).toBeVisible();
  expect(await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit && el.contains(hit);
  })).toBeTruthy();
}

test("four destinations and header settings preserve inventory and independent list context", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav a")).toHaveCount(4);
  await expect(page.locator(".pantry-picker")).not.toHaveAttribute("open", "");
  await page.locator(".pantry-picker > summary").tap();
  await button(page, "鸡蛋").tap();
  await page.locator(".pantry-picker > summary").tap();
  await expect(button(page, "移除鸡蛋")).toBeVisible();
  await page.locator("header a[href='#settings']").tap();
  await expect(page.getByRole("heading", { name: "厨房设置" })).toBeVisible();
  await page.goBack();
  expect((await read(page)).pantry).toEqual(["鸡蛋"]);
  await expect(page.locator("#ingredient")).toBeVisible();
});

test("featured recommendation uses the existing food photo and independent save/basket actions", async ({ page }, info) => {
  await seed(page, { pantry: ["番茄", "鸡蛋", "食用油", "盐"] });
  const feature = page.locator(".featured-recipe");
  await expect(feature).toHaveCount(1);
  const photo = feature.locator("img").last();
  await expect(photo).toHaveAttribute("src", photos["tomato-eggs"].asset || "/dishes/tomato-eggs-view.webp");
  await expect.poll(() => photo.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await feature.getByRole("button", { name: "收藏番茄炒鸡蛋", exact: true }).tap();
  await feature.getByRole("button", { name: "加入菜篮番茄炒鸡蛋", exact: true }).tap();
  expect((await read(page)).favorites).toEqual(["tomato-eggs"]);
  expect((await read(page)).basket).toEqual(["tomato-eggs"]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("pantry-390.png") });
  await button(page, "看看能做什么").tap();
  await page.screenshot({ path: info.outputPath("recommendation-390.png") });
});

test("long basket keeps start reachable and every dish action above the fixed controls", async ({ page }, info) => {
  const ids = recipes.slice(0, 8).map((r) => r.id);
  await seed(page, { basket: ids }, "basket");
  const start = button(page, /一键开始做饭/);
  await unobscured(page, start);
  const last = page.locator(".basket-dishes > li").last();
  const later = last.getByRole("button", { name: /^延后做/ });
  await expect(later).toBeDisabled();
  const earlier = last.getByRole("button", { name: /^提前做/ });
  await earlier.scrollIntoViewIfNeeded();
  await unobscured(page, earlier);
  await earlier.tap();
  expect((await read(page)).basket.at(-2)).toBe(ids.at(-1));
  await unobscured(page, start);
  await start.tap();
  await expect(page).toHaveURL(new RegExp(`#cook/${ids[0]}$`));
  expect((await read(page)).meal.ids).toHaveLength(8);
  await button(page, "返回菜篮（进度保留）").tap();
  await expect(button(page, "继续这顿饭")).toBeVisible();
  // Two-dish design evidence uses real recipe photos and real missing ingredients.
  await seed(page, { basket: ["tomato-eggs", "steamed-eggs"], pantry: ["鸡蛋", "食用油", "盐"] }, "basket");
  await page.screenshot({ path: info.outputPath("basket-390.png") });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 844, height: 390 }]) {
  test(`step reading and return/timer controls stay reachable at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
        document.documentElement.style.setProperty("--safe-area-inset-bottom", "24px");
      });
    });
    await seed(page, { cooking: { id: "tomato-eggs", step: 1 }, cookView: "step" }, "cook/tomato-eggs");
    await expect(page.locator("nav")).not.toBeVisible();
    const back = button(page, "返回详情（进度保留）");
    const next = button(page, "下一步");
    const clock = button(page, "打开厨房计时器");
    await unobscured(page, back);
    await unobscured(page, next);
    await unobscured(page, clock);
    const nextBox = await next.boundingBox(), clockBox = await clock.boundingBox();
    expect(nextBox.x + nextBox.width).toBeLessThanOrEqual(clockBox.x);
    expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(viewport.height - 24);
    await page.screenshot({ path: info.outputPath(`cooking-${viewport.width}.png`) });
    await clock.tap();
    await expect(page.getByRole("dialog", { name: "厨房计时器", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await next.tap();
    expect((await read(page)).cooking.step).toBe(2);
    await expect(page.locator(".focused-step")).toBeFocused();
    await page.locator(".cooking-notes > summary").tap();
    const finalNote = page.locator(".cooking-notes .hint").last();
    await finalNote.scrollIntoViewIfNeeded();
    await unobscured(page, finalNote);
    await unobscured(page, back);
    await back.tap();
    expect((await read(page)).cooking.step).toBe(2);
    await button(page, "看备料").tap();
    await expect(page.locator(".focused-step")).toHaveText("炒软番茄");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    if (viewport.width === 390) {
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
    }
  });
}
