import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "xiaozao-v1";
const readState = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const input = (page) => page.getByLabel("添加厨房里已有的食材");
const clear = (page) => page.getByRole("button", { name: "清空本次食材，保留调料", exact: true });
const undo = (page) => page.getByRole("button", { name: "撤销清空", exact: true });
async function seed(page, value, hash = "basket") {
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify({ version: 3, ...value })), { key, value });
  await page.goto("/#" + hash);
  await page.reload();
}
async function add(page, text) {
  await input(page).fill(text);
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
}

test("basket replaces settings reset and preserves selected dishes, progress and personal settings", async ({ page }) => {
  await seed(page, {
    pantry: ["番茄", "鸡蛋", "食用油", "盐"], basket: ["tomato-eggs", "steamed-eggs"],
    meal: { ids: ["tomato-eggs", "steamed-eggs"], done: [] }, cooking: { id: "tomato-eggs", step: 1 },
    favorites: ["tomato-eggs"], frequentIngredients: ["鸡蛋", "土豆"],
    preferences: { allergens: [], avoid: ["香菜"], avoidMode: "warn" },
  });
  const before = await readState(page);
  await expect(page.getByRole("heading", { name: "今天重新选食材", exact: true })).toBeVisible();
  await expect(page.locator(".basket-pantry-reset")).toContainText("保留常备调料、已选菜和跟做进度");
  await clear(page).click();
  await expect(clear(page)).toBeDisabled();
  await expect(page.locator(".basket-dishes > li")).toHaveCount(2);
  expect(await readState(page)).toEqual({ ...before, pantry: ["食用油", "盐"] });
  await page.getByRole("link", { name: "设置", exact: true }).click();
  await expect(page.getByRole("heading", { name: "今天重新选食材", exact: true })).toHaveCount(0);
  await expect(clear(page)).toHaveCount(0);
  await page.getByRole("link", { name: /^菜篮/ }).click();
  await undo(page).click();
  expect((await readState(page)).pantry).toEqual(["食用油", "盐", "番茄", "鸡蛋"]);
  await page.reload();
  const after = await readState(page);
  expect(after).toEqual({ ...before, pantry: ["食用油", "盐", "番茄", "鸡蛋"] });
});

test("undo is shared across pantry and basket, retaining newer ingredients and repeated clears", async ({ page }) => {
  await seed(page, { pantry: ["鸡蛋", "食用油", "盐"] });
  await clear(page).click();
  await page.getByRole("button", { name: "去选今天的食材", exact: true }).click();
  await add(page, "黄瓜");
  await expect(page.locator(".pantry-reset-status")).toContainText("本次记录了 1 样食材");
  await clear(page).click();
  await add(page, "土豆、糖");
  await page.getByRole("link", { name: /^菜篮/ }).click();
  await undo(page).click();
  expect((await readState(page)).pantry).toEqual(["食用油", "盐", "土豆", "糖", "鸡蛋", "黄瓜"]);
  await expect(undo(page)).toHaveCount(0);
});

test("empty basket still offers ingredient reset but empty pantry cannot clear", async ({ page }) => {
  await seed(page, { pantry: ["盐"], basket: [] });
  await expect(clear(page)).toBeDisabled();
  await expect(page.locator(".pantry-reset-status")).toContainText("本次还没有食材");
  await page.getByRole("button", { name: "去选今天的食材", exact: true }).click();
  await add(page, "鸡蛋");
  await page.getByRole("link", { name: /^菜篮/ }).click();
  await clear(page).click();
  await expect(undo(page)).toBeVisible();
});

test("ingredient typing and focus never open suggestions; only the arrow toggles them", async ({ page }) => {
  await page.goto("/");
  await input(page).click();
  await expect(input(page)).toHaveAttribute("aria-expanded", "false");
  await expect(input(page)).not.toHaveAttribute("list", /.+/);
  await input(page).fill("西红");
  await input(page).press("ArrowDown");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await expect(page.getByRole("option", { name: "番茄", exact: true })).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("button", { name: "收起食材建议", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await page.getByRole("option", { name: "番茄", exact: true }).click();
  await expect(input(page)).toHaveValue("番茄");
  await expect(input(page)).toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  expect((await readState(page)).pantry).toEqual([]);
  await input(page).press("Enter");
  expect((await readState(page)).pantry).toEqual(["番茄"]);
});

test("suggestions support keyboard toggle, navigation, selection, Escape and outside/Tab dismissal", async ({ page }) => {
  await page.goto("/");
  await input(page).fill("豆");
  const toggle = page.getByRole("button", { name: "展开食材建议", exact: true });
  await toggle.focus();
  await toggle.press("Enter");
  await expect(input(page)).toBeFocused();
  await input(page).press("ArrowDown");
  await expect(input(page)).toHaveAttribute("aria-activedescendant", "ingredient-option-0");
  const first = await page.getByRole("option").first().textContent();
  await input(page).press("Enter");
  await expect(input(page)).toHaveValue(first);
  expect((await readState(page)).pantry).toEqual([]);
  await toggle.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await input(page).press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await toggle.click();
  await page.getByRole("heading", { name: "我的食材", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await toggle.focus();
  await toggle.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await input(page).press("Tab");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(toggle).toBeFocused();
});

test("suggestion selection preserves surrounding batch ingredients and custom entry", async ({ page }) => {
  await page.goto("/");
  await input(page).fill("鸡蛋、马铃，黄瓜");
  await input(page).press("Home");
  for (let i = 0; i < 4; i++) await input(page).press("ArrowRight");
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await page.getByRole("option", { name: "土豆", exact: true }).click();
  await expect(input(page)).toHaveValue("鸡蛋、土豆，黄瓜");
  await input(page).press("Enter");
  expect((await readState(page)).pantry).toEqual(["鸡蛋", "土豆", "黄瓜"]);
  await input(page).fill("我家的新食材");
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await expect(page.getByText("暂无匹配建议，可以直接添加自定义食材。")).toBeVisible();
  await input(page).press("Enter");
  expect((await readState(page)).pantry).toContain("我家的新食材");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("composition Enter cannot pick a suggestion or submit incomplete Chinese input", async ({ page }) => {
  await page.goto("/");
  await input(page).fill("蛋");
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await input(page).press("ArrowDown");
  await input(page).dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true, keyCode: 229 });
  await expect(input(page)).toHaveValue("蛋");
  expect((await readState(page)).pantry).toEqual([]);
  await expect(page.getByRole("listbox")).toBeVisible();
});

test("suggestions close when navigating away and do not reopen on browser Back", async ({ page }) => {
  await page.goto("/");
  await input(page).fill("鸡蛋");
  await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
  await page.getByRole("link", { name: /^菜篮/ }).click();
  await page.goBack();
  await expect(input(page)).toHaveValue("鸡蛋");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("ingredient controls and basket reset fit phones through desktop and pass automated accessibility", async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#pantry");
    await input(page).fill("豆");
    await page.getByRole("button", { name: "展开食材建议", exact: true }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    const box = await page.getByRole("button", { name: "收起食材建议", exact: true }).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 320) {
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: "test-results/ingredient-dropdown-320.png", fullPage: true });
    }
    await page.getByRole("link", { name: /^菜篮/ }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 320) {
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: "test-results/basket-reset-320.png", fullPage: true });
    }
  }
});


test("suggestions stay above bottom navigation on short screens and support touch selection", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 600 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5187/");
  await input(page).fill("西红");
  await page.getByRole("button", { name: "展开食材建议", exact: true }).tap();
  const panel = await page.locator(".ingredient-suggestions-panel").boundingBox();
  const nav = await page.getByRole("navigation", { name: "主要导航" }).boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.y + panel.height).toBeLessThanOrEqual(nav.y);
  await page.getByRole("option", { name: "番茄", exact: true }).tap();
  await expect(input(page)).toHaveValue("番茄");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await context.close();
});
