import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "xiaozao-v1";
const readState = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
async function seed(page, value, hash = "basket") {
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify({ version: 3, ...value })), { key, value });
  await page.goto("/#" + hash);
  await page.reload();
}

test("batch add normalizes foods, ignores duplicates and undo keeps newer ingredients and seasonings", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("添加厨房里已有的食材").fill("西红柿、鸡蛋，油 盐");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  expect((await readState(page)).pantry).toEqual(["番茄", "鸡蛋", "食用油", "盐"]);
  await page.getByLabel("添加厨房里已有的食材").fill("番茄 土豆");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  await expect(page.locator(".live-message")).toContainText("番茄已经在清单里了");
  await page.getByRole("button", { name: "清空本次食材，保留调料", exact: true }).click();
  expect((await readState(page)).pantry).toEqual(["食用油", "盐"]);
  await page.getByLabel("添加厨房里已有的食材").fill("黄瓜");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  await page.getByRole("button", { name: "撤销清空", exact: true }).click();
  expect((await readState(page)).pantry).toEqual(["食用油", "盐", "黄瓜", "番茄", "鸡蛋", "土豆"]);
  await page.reload();
  await expect(page.getByRole("button", { name: "移除鸡蛋", exact: true })).toBeVisible();
});

test("recipe return preserves original list, filters and scroll, and browser history remains useful", async ({ page }) => {
  await page.goto("/#search");
  await page.getByRole("button", { name: "汤羹", exact: true }).click();
  const row = page.locator(".recipe-open").nth(7);
  await row.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await row.click();
  await expect(page.locator(".detail h1")).toBeVisible();
  await page.getByRole("button", { name: "返回菜谱", exact: true }).click();
  await expect(page).toHaveURL(/#search$/);
  await expect(page.getByRole("button", { name: "汤羹", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await page.goForward();
  await expect(page.locator(".detail h1")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#search$/);
});

test("returning from a pantry recommendation restores pantry rather than search", async ({ page }) => {
  await seed(page, { pantry: ["番茄", "鸡蛋", "食用油", "盐"] }, "pantry");
  await page.getByRole("button", { name: /番茄炒鸡蛋.*可以做/ }).click();
  await page.getByRole("button", { name: "返回菜谱", exact: true }).click();
  await expect(page).toHaveURL(/#pantry$/);
});

test("cooking transitions start at visible focused content and preserve the meal when switching its dishes", async ({ page }) => {
  await seed(page, { basket: ["tomato-eggs", "steamed-eggs"], meal: { ids: ["tomato-eggs", "steamed-eggs"], done: ["tomato-eggs"] }, cooking: { id: "tomato-eggs", step: 4 } });
  await page.getByRole("button", { name: "家常蒸蛋", exact: true }).click();
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  expect((await readState(page)).meal.done).toEqual(["tomato-eggs"]);
  await page.getByRole("button", { name: "开始做这道菜", exact: true }).click();
  await expect(page.locator(".cook h1")).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: "分步看", exact: true }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await expect(page.locator(".focused-step")).toBeFocused();
  await page.reload();
  expect((await readState(page)).meal.done).toEqual(["tomato-eggs"]);
});

test("starting an unrelated dish asks before replacing progress and cancellation is safe", async ({ page }) => {
  await seed(page, { basket: ["tomato-eggs"], meal: { ids: ["tomato-eggs"], done: [] }, cooking: { id: "tomato-eggs", step: 1 } }, "recipe/steamed-eggs");
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  const modal = page.getByRole("dialog", { name: "换一道菜开始？" });
  await expect(modal).toBeVisible();
  await page.getByRole("button", { name: "保留当前进度", exact: true }).click();
  expect((await readState(page)).cooking).toEqual({ id: "tomato-eggs", step: 1 });
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.getByRole("button", { name: "确认，开始家常蒸蛋", exact: true }).click();
  expect((await readState(page)).meal).toBeNull();
  expect((await readState(page)).basket).toEqual(["tomato-eggs"]);
  await expect(page).toHaveURL(/#cook\/steamed-eggs$/);
});

test("browser navigation closes a timer dialog without cancelling the timer", async ({ page }) => {
  await page.goto("/#recipe/tomato-eggs");
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.getByRole("button", { name: /打开厨房计时器/ }).click();
  await page.getByRole("button", { name: "3 分钟", exact: true }).click();
  await page.getByRole("button", { name: /打开厨房计时器/ }).click();
  await page.goBack();
  await expect(page).toHaveURL(/#recipe\/tomato-eggs$/);
  await expect(page.getByRole("dialog", { name: "厨房计时器", exact: true })).not.toBeVisible();
  expect((await readState(page)).timer).not.toBeNull();
  await page.goForward();
  await page.getByRole("button", { name: /打开厨房计时器/ }).click();
  await expect(page.getByRole("dialog", { name: "厨房计时器", exact: true })).toBeVisible();
});

test("hidden expired timer gives a visible non-modal reminder, persists on refresh and can be acknowledged", async ({ page }) => {
  await seed(page, { timer: { id: null, step: null, label: "煮面", deadline: Date.now() - 1000 }, timerDock: { hidden: true, position: null } }, "search");
  await expect(page.locator(".timer-handle")).toHaveCount(0);
  const notice = page.getByRole("complementary", { name: "计时到点提醒" });
  await expect(notice).toContainText("煮面");
  await expect(page.getByRole("dialog", { name: "厨房计时器", exact: true })).not.toBeVisible();
  await page.reload();
  await expect(notice).toBeVisible();
  await page.getByRole("button", { name: "知道了，结束计时", exact: true }).click();
  await expect(notice).toHaveCount(0);
  expect((await readState(page)).timer).toBeNull();
  expect((await readState(page)).timerDock.hidden).toBe(true);
});

test("starting a basket cannot silently erase a standalone cooking session", async ({ page }) => {
  await seed(page, { basket: ["steamed-eggs"], cooking: { id: "tomato-eggs", step: 1 }, timer: { id: null, step: null, label: "独立计时", deadline: Date.now() + 300000 } });
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await expect(page.getByRole("dialog", { name: "从这份菜篮重新开始？", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "保留当前跟做", exact: true }).click();
  expect((await readState(page)).cooking).toEqual({ id: "tomato-eggs", step: 1 });
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await page.getByRole("button", { name: "确认，开始这顿饭", exact: true }).click();
  expect((await readState(page)).meal.ids).toEqual(["steamed-eggs"]);
  expect((await readState(page)).timer.label).toBe("独立计时");
});

test("multiline paste adds separate foods rather than merging the line breaks", async ({ page }) => {
  await page.goto("/");
  const field = page.getByLabel("添加厨房里已有的食材");
  await field.evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text", "西红柿\n鸡蛋\n油 盐");
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(field).toHaveValue("西红柿、鸡蛋、油 盐");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  expect((await readState(page)).pantry).toEqual(["番茄", "鸡蛋", "食用油", "盐"]);
});


test("refreshing a recipe preserves the exact category and filters on return", async ({ page }) => {
  await page.goto("/#search");
  await page.getByRole("button", { name: "汤羹", exact: true }).click();
  await page.getByLabel("用时").selectOption("15");
  await page.getByRole("textbox", { name: "搜索菜谱" }).fill("鸡蛋");
  await page.locator(".recipe-open").first().click();
  await page.reload();
  await page.getByRole("button", { name: "返回菜谱", exact: true }).click();
  await expect(page.getByRole("button", { name: "汤羹", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("用时")).toHaveValue("15");
  await expect(page.getByRole("textbox", { name: "搜索菜谱" })).toHaveValue("鸡蛋");
  await page.reload();
  await expect(page.getByRole("button", { name: "汤羹", exact: true })).toHaveAttribute("aria-pressed", "true");
});


test("expanded quantities do not hide the focused step when switching or advancing", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await seed(page, { cooking: { id: "tomato-eggs", step: 0 } }, "cook/tomato-eggs");
  await page.getByText("用量放手边 · 2 人份", { exact: true }).click();
  await page.getByRole("button", { name: "分步看", exact: true }).click();
  await expect(page.locator(".focused-step")).toBeInViewport();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await expect(page.locator(".focused-step")).toBeFocused();
  await expect(page.locator(".focused-step")).toBeInViewport();
  await expect(page.locator(".cook-ingredients")).toHaveAttribute("open", "");
});


test("new completion, interruption and cooking controls remain accessible on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const audit = async () => {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  };
  await seed(page, { timer: { id: null, step: null, label: "煮面", deadline: Date.now() - 1000 }, timerDock: { hidden: true } }, "search");
  await audit();
  await page.screenshot({ path: "test-results/timer-complete-320.png" });
  await seed(page, { cooking: { id: "tomato-eggs", step: 1 } }, "recipe/steamed-eggs");
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await audit();
  await page.screenshot({ path: "test-results/switch-cooking-320.png" });
  await page.getByRole("button", { name: "保留当前进度", exact: true }).click();
  await seed(page, { cooking: { id: "cn-cauliflower", step: 0 } }, "cook/cn-cauliflower");
  await audit();
  const button = await page.locator(".step-timer").first().boundingBox();
  expect(button.height).toBeGreaterThanOrEqual(52);
  await page.screenshot({ path: "test-results/low-touch-cooking-320.png", fullPage: true });
});
