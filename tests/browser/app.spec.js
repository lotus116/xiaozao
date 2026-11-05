import AxeBuilder from "@axe-core/playwright";
import { recipes } from "../../src/recipes.js";
import { categoryOf } from "../../src/preferences.js";
import { test, expect } from "@playwright/test";
const key = "xiaozao-v1";
test("tomato eggs uses reminder tiles without checkboxes and cooking progress persists", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "先打开你的食材清单" }),
  ).toBeVisible();
  await page.getByLabel("添加厨房里已有的食材").fill("西红柿");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  await page.getByLabel("添加厨房里已有的食材").fill("番茄");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  await expect(page.locator(".live-message")).toContainText("已经在清单");
  await page.getByText(/管理常备调料/).click();
  for (const name of ["鸡蛋", "食用油", "盐"])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: /番茄炒鸡蛋.*可以做，必需食材齐全/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "番茄炒鸡蛋", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "开始做这道菜", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "开始做这道菜", exact: true }).click();
  await page.getByRole("button", { name: "分步看", exact: true }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "先炒鸡蛋" })).toBeVisible();
  await page.getByRole("button", { name: "上一步", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "准备食材", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("button", { name: "完成这道菜" }).click();
  await expect(
    page.getByRole("heading", { name: "辛苦啦，开饭吧。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "回到我的厨房" }).click();
  await page.getByRole("link", { name: "收藏", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /番茄炒鸡蛋.*可以做，必需食材齐全/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "取消收藏番茄炒鸡蛋" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});
test("search, missing seasoning, no results, filters, persistence and corruption", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "鸡蛋", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "移除鸡蛋" })).toBeVisible();
  await page.getByRole("link", { name: "找菜谱", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索菜谱" }).fill("西红柿");
  await expect(
    page.getByRole("button", { name: /番茄炒鸡蛋.*分钟/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /番茄蛋花汤.*分钟/ }),
  ).toHaveCount(0);
  await expect(page.locator(".recipe-row").first()).toContainText("食用油");
  await page.getByRole("textbox", { name: "搜索菜谱" }).fill("找不到");
  await expect(
    page.getByRole("heading", { name: "暂时没找到这道菜" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "浏览全部菜谱" }).click();
  await expect(page.locator(".recipe-row")).toHaveCount(
    recipes.filter((r) => categoryOf(r) === "dish").length,
  );
  await page.getByLabel("用时").selectOption("15");
  await expect(page.locator(".recipe-row")).toHaveCount(
    recipes.filter((r) => categoryOf(r) === "dish" && r.minutes <= 15).length,
  );
  await page.evaluate((k) => localStorage.setItem(k, "broken"), key);
  await page.goto("/#pantry");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "先打开你的食材清单" }),
  ).toBeVisible();
});
test("responsive layouts and visual evidence", async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/pantry-${width}.png`,
      fullPage: true,
    });
    await page.goto("/#recipe/tomato-eggs");
    await expect(page.locator("h1")).toContainText("番茄炒鸡蛋");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/detail-${width}.png`,
      fullPage: true,
    });
  }
});
test("unavailable storage stays usable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("denied");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("未允许保存");
  await page.getByRole("button", { name: "鸡蛋", exact: true }).click();
  await expect(page.getByRole("button", { name: "移除鸡蛋" })).toBeVisible();
});

for (const r of recipes)
  test("published recipe: " + r.name, async ({ page }) => {
    await page.goto("/#recipe/" + r.id);
    await expect(
      page.getByRole("heading", { name: r.name, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".ingredient-tile")).toHaveCount(
      r.ingredients.length,
    );
    await page.getByText("菜谱来源与验证说明", { exact: true }).click();
    await expect(
      page.getByRole("link", { name: "查看原作者菜谱" }),
    ).toHaveAttribute("href", r.source.url);
    await page.getByRole("button", { name: /看看备料，开始做/ }).click();
    await expect(page.locator(".ingredient-tile")).toHaveCount(
      r.ingredients.length,
    );
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await page
      .getByRole("button", { name: "开始做这道菜", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: r.steps[0].title, exact: true }),
    ).toBeVisible();
  });
test("key pages have no automated WCAG A/AA violations", async ({ page }) => {
  for (const path of [
    "pantry",
    "search",
    "recipe/tomato-eggs",
    "cook/tomato-eggs",
  ]) {
    await page.goto("/#" + path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
