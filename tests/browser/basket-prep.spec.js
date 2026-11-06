import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const key = "xiaozao-v1";
const expectedShoppingText = [
  "小灶 · 采购清单",
  "清单未记的必需食材，请先核对家中用量。",
  "",
  "鸡蛋",
  "  番茄炒鸡蛋：3 个，大小不必挑得一样",
  "  家常蒸蛋：2 个",
  "",
  "盐",
  "  番茄炒鸡蛋：先备约 1/4 茶匙，熟后尝味再补",
  "  家常蒸蛋：一小撮；要淋生抽就再少些",
].join("\n");

// Never touch the user's clipboard, even in the successful-copy tests.
async function openBasket(page, { clipboard = "success", ...state } = {}) {
  await page.addInitScript(
    ({ key, clipboard, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify({
          version: 3,
          basket: ["tomato-eggs", "steamed-eggs"],
          pantry: ["西红柿", "植物油"],
          ...state,
        }));
      window.clipboardWrites = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: clipboard === "unavailable" ? undefined : {
          writeText: async (text) => {
            window.clipboardWrites.push(text);
            if (clipboard === "denied") throw new DOMException("Denied", "NotAllowedError");
            if (clipboard === "pending")
              await new Promise((resolve) => { window.resolveClipboard = resolve; });
          },
        },
      });
    },
    { key, clipboard, state },
  );
  await page.goto("/#basket");
  await expect(page.getByRole("heading", { name: "今天的菜篮", exact: true })).toBeVisible();
}

async function clipboardWrites(page) {
  return page.evaluate(() => window.clipboardWrites);
}

test("basket summarizes required missing ingredients, toggles prep, and only copies on click", async ({ page }) => {
  await openBasket(page);
  await expect(page.getByRole("heading", { name: "清单未记 2 样", exact: true })).toBeVisible();
  await expect(page.locator(".basket-prep-names")).toHaveText("鸡蛋、盐");
  await expect(page.locator(".meal-ingredients > li")).toHaveCount(5);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "全部备料", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "只看缺料 · 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "只看缺料 · 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".meal-ingredients > li")).toHaveCount(2);
  await expect(page.locator(".meal-ingredients > li > div > strong")).toHaveText(["鸡蛋", "盐"]);
  expect(await clipboardWrites(page)).toEqual([]);
  await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
  expect(await clipboardWrites(page)).toEqual([expectedShoppingText]);
  await expect(page.locator("#basket-copy-status")).toContainText("已复制");
  await expect(page.getByRole("textbox", { name: "采购清单文本" })).toHaveCount(0);
  await page.getByRole("button", { name: "全部备料", exact: true }).click();
  await expect(page.locator(".meal-ingredients > li")).toHaveCount(5);
  expect(await clipboardWrites(page)).toHaveLength(1);
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await expect(page).toHaveURL(/#cook\/tomato-eggs$/);
});

test("copied feedback clears when the basket changes and the next copy uses current quantities", async ({ page }) => {
  await openBasket(page);
  await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
  await expect(page.locator("#basket-copy-status")).toContainText("已复制");
  await page.getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true }).click();
  await expect(page.locator("#basket-copy-status")).toBeEmpty();
  await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
  const writes = await clipboardWrites(page);
  expect(writes).toHaveLength(2);
  expect(writes[1]).toContain("家常蒸蛋：2 个");
  expect(writes[1]).not.toContain("番茄炒鸡蛋");
  await page.reload();
  await expect(page.locator(".basket-dishes > li")).toHaveCount(1);
  await expect(page.locator("#basket-copy-status")).toBeEmpty();
  expect(await clipboardWrites(page)).toEqual([]);
});

for (const clipboard of ["unavailable", "denied"])
  test(`clipboard ${clipboard} offers focused, selectable text without claiming success at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await openBasket(page, { clipboard });
    await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
    const fallback = page.getByRole("textbox", { name: "采购清单文本", exact: true });
    await expect(page.locator("#basket-copy-status")).toContainText("未能自动复制");
    await expect(page.locator("#basket-copy-status")).not.toContainText("已复制");
    await expect(fallback).toHaveValue(expectedShoppingText);
    await expect(fallback).toBeFocused();
    const fieldBox = await fallback.boundingBox();
    const navigationBox = await page.getByRole("navigation").boundingBox();
    expect(fieldBox.y).toBeGreaterThanOrEqual(0);
    expect(fieldBox.y + fieldBox.height).toBeLessThan(navigationBox.y);
    expect(await fallback.evaluate((field) => [field.selectionStart, field.selectionEnd])).toEqual([0, expectedShoppingText.length]);
    expect(await clipboardWrites(page)).toHaveLength(clipboard === "denied" ? 1 : 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/basket-copy-${clipboard}-320.png`, fullPage: true });
    await page.getByRole("button", { name: /一键开始做饭/ }).click();
    await expect(page).toHaveURL(/#cook\/tomato-eggs$/);
  });

test("a pending copy ignores repeated clicks and does not show stale success after basket changes", async ({ page }) => {
  await openBasket(page, { clipboard: "pending" });
  await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
  const pending = page.getByRole("button", { name: "正在复制…", exact: true });
  await expect(pending).toBeDisabled();
  await pending.dispatchEvent("click");
  expect(await clipboardWrites(page)).toHaveLength(1);
  await page.getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true }).click();
  await page.evaluate(() => window.resolveClipboard());
  await expect(page.locator("#basket-copy-status")).toBeEmpty();
  await expect(page.getByRole("button", { name: "复制采购清单", exact: true })).toBeEnabled();
});

test("a pantry-complete basket has an honest empty missing view and still starts in one click", async ({ page }) => {
  await openBasket(page, { pantry: ["番茄", "鸡蛋", "食用油", "盐"] });
  await expect(page.getByRole("heading", { name: "必需食材都已记录", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制采购清单", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "只看缺料 · 0", exact: true }).click();
  await expect(page.locator(".meal-ingredients > li")).toHaveCount(0);
  await expect(page.locator(".basket-prep-empty")).toContainText("核对用量");
  await expect(page.getByRole("button", { name: /一键开始做饭/ })).toBeEnabled();
  expect(await clipboardWrites(page)).toEqual([]);
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await expect(page).toHaveURL(/#cook\/tomato-eggs$/);
});

test("optional allergens still prevent shopping export and cooking until the blocked dish is removed", async ({ page }) => {
  await openBasket(page, {
    basket: ["steamed-eggs", "cn-steamed-pumpkin"],
    pantry: [],
    preferences: { allergens: ["芝麻"], avoid: [], avoidMode: "hide" },
  });
  await expect(page.getByText("过敏设置：芝麻。请移出这道菜后再开始。", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制采购清单", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: /一键开始做饭/ })).toBeDisabled();
  expect(await clipboardWrites(page)).toEqual([]);
  await page.getByRole("button", { name: "移出菜篮家常蒸蛋", exact: true }).click();
  await page.getByRole("button", { name: "复制采购清单", exact: true }).click();
  const [text] = await clipboardWrites(page);
  expect(text).toContain("南瓜\n  清蒸南瓜：300 克");
  expect(text).not.toContain("家常蒸蛋");
  expect(text).not.toContain("水");
  await expect(page.getByRole("button", { name: /一键开始做饭/ })).toBeEnabled();
});

test("prep controls and fallback-free summary fit narrow and wide screens with keyboard access", async ({ page }) => {
  await openBasket(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const missing = page.getByRole("button", { name: "只看缺料 · 2", exact: true });
    await missing.focus();
    await page.keyboard.press("Enter");
    await expect(missing).toHaveAttribute("aria-pressed", "true");
    const all = page.getByRole("button", { name: "全部备料", exact: true });
    await all.focus();
    await page.keyboard.press("Space");
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: `test-results/basket-prep-${width}.png`, fullPage: true });
  }
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await clipboardWrites(page)).toEqual([]);
});

test("changing allergies mid-meal can continue a safe dish without resetting or completing the blocked dish", async ({ page }) => {
  const ids = ["tomato-eggs", "cn-steamed-pumpkin"];
  await openBasket(page, {
    basket: ids,
    meal: { ids, done: [] },
    cooking: { id: "tomato-eggs", step: 1 },
  });
  await page.goto("/#settings");
  await page.getByRole("button", { name: "蛋类", exact: true }).click();
  await page.goto("/#basket");
  await expect(page.locator(".meal-progress")).toContainText("跳过的菜不会计为完成");
  await expect(page.getByRole("button", { name: "继续这顿饭", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "继续可做的下一道：清蒸南瓜", exact: true }).click();
  await expect(page).toHaveURL(/#cook\/cn-steamed-pumpkin$/);
  await expect(page.getByRole("heading", { name: "清蒸南瓜", exact: true })).toBeVisible();
  await page.reload();
  expect(await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return { meal: state.meal, cooking: state.cooking };
  }, key)).toEqual({ meal: { ids, done: [] }, cooking: { id: "cn-steamed-pumpkin", step: 0 } });
  await page.goto("/#basket");
  await expect(page.locator(".basket-dishes > li")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "继续这顿饭", exact: true })).toBeEnabled();
});

test("a fully blocked current meal offers settings and ending without a broken resume link", async ({ page }) => {
  await openBasket(page, {
    basket: ["tomato-eggs"],
    meal: { ids: ["tomato-eggs"], done: [] },
    cooking: { id: "tomato-eggs", step: 1 },
    preferences: { allergens: ["蛋类"], avoid: [], avoidMode: "hide" },
  });
  await expect(page.locator(".meal-progress")).toContainText("暂无符合厨房设置的未完成菜谱");
  await expect(page.getByRole("button", { name: /继续这顿饭|继续可做的下一道/ })).toHaveCount(0);
  await page.getByRole("button", { name: "查看厨房设置", exact: true }).click();
  await expect(page).toHaveURL(/#settings$/);
  await page.goto("/#basket");
  await page.getByRole("button", { name: "结束本次跟做", exact: true }).click();
  await expect(page.locator(".meal-progress")).toHaveCount(0);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).meal, key)).toBeNull();
  await expect(page.locator(".basket-dishes > li")).toHaveCount(1);
});
