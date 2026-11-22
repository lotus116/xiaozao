import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });

const button = (page, name) => page.getByRole("button", { name, exact: typeof name === "string" });
async function navigate(page, hash) {
  if (hash === "favorites") {
    await page.locator('nav a[href="#profile"]').tap();
    return page.locator('main a[href="#favorites"]').tap();
  }
  await page.locator(`${hash === "settings" ? "header" : "nav"} a[href="#${hash}"]`).tap();
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1")));
async function onFirstScreen(page, control) {
  const box = await control.boundingBox();
  const nav = await page.locator(await page.locator(".step-actions").isVisible() ? ".step-actions" : "nav").boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
}

test("small phone taps the first basket and clears a query inside the selected category", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#search");
  const add = button(page, "加入菜篮番茄炒鸡蛋");
  await expect(add).toBeVisible();
  const box = await add.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button(page, "移出菜篮番茄炒鸡蛋")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await button(page, "汤羹").tap();
  const query = page.getByRole("textbox", { name: "搜索菜谱" });
  await query.fill("不存在的菜");
  await button(page, "清空搜索关键词").tap();
  await expect(query).toBeFocused();
  await expect(query).toHaveValue("");
  await expect(button(page, "汤羹")).toHaveAttribute("aria-pressed", "true");
});

test("touching the second heart saves the dish; search and favorites remember separate filters", async ({ page }) => {
  await page.goto("/#search");
  const favorite = button(page, "收藏家常蒸蛋");
  const box = await favorite.boundingBox();
  const clock = await page.locator(".timer-handle").boundingBox();
  const nav = await page.locator("nav").boundingBox();
  expect(clock.y + clock.height).toBeLessThanOrEqual(nav.y);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button(page, "取消收藏家常蒸蛋")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.getByLabel("搜索菜谱").fill("茄子");
  await navigate(page, "favorites");
  await expect(page.getByLabel("搜索菜谱")).toHaveValue("");
  await expect(button(page, "全部")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".recipe-open")).toContainText("家常蒸蛋");
  await page.getByLabel("搜索菜谱").fill("鸡蛋");
  await navigate(page, "search");
  await expect(page.getByLabel("搜索菜谱")).toHaveValue("茄子");
  await page.reload();
  await navigate(page, "favorites");
  await expect(page.getByLabel("搜索菜谱")).toHaveValue("鸡蛋");
});

test("meal starts above the fold; cancelling an exit keeps the exact step and timer across reload", async ({ page }) => {
  await page.goto("/#search");
  await button(page, "加入菜篮家常蒸蛋").tap();
  await button(page, "加入菜篮番茄炒鸡蛋").tap();
  await navigate(page, "basket");
  const start = button(page, /一键开始做饭/);
  await onFirstScreen(page, start);
  await start.tap();
  await button(page, /^启动计时/).first().tap();
  const before = await saved(page);
  await navigate(page, "basket");
  await button(page, "结束本次跟做").tap();
  const dialog = page.getByRole("dialog", { name: "结束这顿饭的跟做？" });
  await expect(dialog).toContainText("家常蒸蛋");
  await expect(dialog).toContainText("盖盘蒸蛋");
  await button(page, "取消，保留进度").tap();
  await page.reload();
  const preserved = await saved(page);
  expect(preserved.timer).toEqual(before.timer);
  expect(preserved.cooking).toEqual(before.cooking);
  expect(preserved.meal).toEqual(before.meal);
  await button(page, "结束本次跟做").tap();
  await button(page, "确认结束跟做及计时").tap();
  const ended = await saved(page);
  expect(ended.timer).toBeNull();
  expect(ended.meal).toBeNull();
  expect(ended.basket).toEqual(before.basket);
});

test("small phone exposes pantry input, full-width prep action and quantities with original notes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await onFirstScreen(page, page.locator("#ingredient"));
  await navigate(page, "search");
  await onFirstScreen(page, page.locator(".recipe-row").first());
  await page.locator(".recipe-open").first().tap();
  const action = button(page, "看备料");
  expect((await action.boundingBox()).width).toBe((await page.locator(".detail-actions").boundingBox()).width);
  await action.tap();
  await onFirstScreen(page, button(page, "开始做这道菜"));
  const quantities = page.locator(".ingredient-tile");
  await expect(quantities.filter({ hasText: "番茄" }).locator(".ingredient-amount")).toHaveText("2 个");
  await expect(quantities.filter({ hasText: "鸡蛋" }).locator(".ingredient-amount")).toHaveText("3 个");
  await page.locator(".amount-notes summary").first().tap();
  await expect(page.getByText(/中等大小 2 个，熟一点更易出汁/)).toBeVisible();
  await navigate(page, "settings");
  await onFirstScreen(page, button(page, "蛋类"));
  await expect(page.locator(".settings-seasonings")).not.toHaveAttribute("open", "");
});

test("pantry suggestions require food and can focus on one ingredient on a phone", async ({ page }) => {
  await page.goto("/");
  await page.getByText(/管理常备调料/).tap();
  await button(page, "食用油").tap();
  await button(page, "盐").tap();
  const recommendations = page.locator("#recommendations");
  await expect(recommendations.getByRole("heading", { name: "先加一样手边的食材" })).toBeVisible();
  await expect(recommendations.locator(".recipe-row")).toHaveCount(0);

  await page.getByLabel("添加厨房里已有的食材").fill("西红柿、鸡蛋");
  await button(page, "添加食材").tap();
  const tomatoEggs = recommendations.getByRole("button", { name: /番茄炒鸡蛋.*必需食材齐全/ });
  await expect(tomatoEggs).toContainText("用到已有食材：番茄、鸡蛋");
  const chiveEggs = recommendations.getByRole("button", { name: /韭菜炒鸡蛋.*还缺/ });
  await expect(chiveEggs).toBeVisible();
  await expect(recommendations.getByRole("button", { name: /清炒小白菜/ })).toHaveCount(0);

  await page.getByLabel("优先用掉").selectOption("番茄");
  await expect(tomatoEggs).toBeVisible();
  await expect(chiveEggs).toHaveCount(0);
  await button(page, "移除番茄").tap();
  await expect(chiveEggs).toBeVisible();
});

test("step guidance stays local to the step in both cooking views", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#recipe/tomato-eggs");
  await button(page, "看备料").tap();
  await button(page, "开始做这道菜").tap();
  const firstStep = page.locator(".cooking-overview > li").first();
  await expect(firstStep.locator(".step-guidance")).toContainText("番茄 2 个、鸡蛋 3 个");
  await expect(firstStep.locator(".step-guidance dt")).toHaveText(["用量", "看状态"]);
  await button(page, /^记住做到这里：第 2 步/).tap();
  await expect(page.locator(".cooking-overview > li[aria-current='step'] .step-guidance")).toContainText("大部分油");

  await button(page, "分步看").tap();
  const guide = page.locator(".step-guidance");
  await expect(guide.locator("dt")).toHaveText(["用量", "火力", "看状态"]);
  await expect(guide).toContainText("中火");
  await expect(guide).toContainText("柔软就先盛出");
  await onFirstScreen(page, guide.locator(".guide-amount"));
  await onFirstScreen(page, page.locator(".instruction"));
  await button(page, "下一步").tap();
  await expect(guide).toContainText("余油");
  await expect(guide).toContainText("铲子轻压就出汁");
  await page.reload();
  await expect(guide).toContainText("补水焖时调小火");
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
  await page.setViewportSize({ width: 320, height: 568 });
  const access = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(access.violations).toEqual([]);
});

test("pantry previews a real match above the fold and distinguishes missing ingredients", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("添加厨房里已有的食材");
  const match = page.locator(".pantry-match");
  await input.fill("番茄、鸡蛋");
  await button(page, "添加食材").tap();
  await expect(match).toContainText("还差");
  await input.fill("食用油、盐");
  await button(page, "添加食材").tap();
  await expect(match).toContainText("2 道可以做");
  await expect(match).toContainText("番茄炒鸡蛋");
  await onFirstScreen(page, match);
  await match.tap();
  await expect(page).toHaveURL(/#recipe\/tomato-eggs$/);
});
