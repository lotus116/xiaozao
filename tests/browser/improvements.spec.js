import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const KEY = "xiaozao-v1";
test("remember pantry seasonings independently of fresh ingredients", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText(/管理常备调料/).click();
  for (const name of ["食用油", "盐", "糖", "鸡蛋"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "清空本次食材，保留调料" }).click();
  await page.reload();
  await page.getByText(/管理常备调料/).click();
  await expect(
    page.getByRole("button", { name: "盐", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "食用油", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "鸡蛋", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "设置", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "✓ 盐", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("category tabs separate dishes staples and soup", async ({ page }) => {
  await page.goto("/#search");
  await expect(
    page.getByRole("button", { name: /葱香蛋炒饭.*分钟/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "主食", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /葱香蛋炒饭.*分钟/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /番茄炒鸡蛋.*分钟/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "汤羹", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /番茄蛋花汤.*分钟/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /葱香蛋炒饭.*分钟/ }),
  ).toHaveCount(0);
});
test("allergy filter persists and blocks direct cooking links; ordinary dislikes warn", async ({
  page,
}) => {
  await page.goto("/#settings");
  await page.getByRole("button", { name: "蛋类", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "✓ 蛋类", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/#search");
  await expect(
    page.getByRole("button", { name: /番茄炒鸡蛋.*分钟/ }),
  ).toHaveCount(0);
  await page.goto("/#recipe/tomato-eggs");
  await expect(
    page.getByRole("heading", { name: "这道菜已被饮食设置排除" }),
  ).toBeVisible();
  await page.goto("/#cook/tomato-eggs");
  await expect(
    page.getByRole("button", { name: /进入备料|开始跟做/ }),
  ).toHaveCount(0);
  await page.goto("/#settings");
  await page.getByRole("button", { name: "✓ 蛋类", exact: true }).click();
  await page.getByLabel("添加忌口食材").fill("西红柿");
  await page.getByRole("button", { name: "添加忌口", exact: true }).click();
  await page.getByLabel("忌口菜谱的处理").selectOption("warn");
  await page.goto("/#recipe/tomato-eggs");
  await expect(
    page.locator(".warning").filter({ hasText: "忌口：番茄" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /准备食材/ })).toBeEnabled();
});
test("custom timer can pause resume extend expire and survive refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开厨房计时器" }).click();
  await page.getByLabel("计时名称").fill("煮面");
  await page.getByLabel("时长（分钟，最多 180）").fill("2");
  await page.getByRole("button", { name: "开始计时", exact: true }).click();
  await expect(page.locator(".floating-timer")).toContainText("煮面");
  await page.getByRole("link", { name: "找菜谱", exact: true }).click();
  await page.reload();
  await expect(page.locator(".floating-timer")).toContainText("煮面");
  await page.getByRole("button", { name: "打开厨房计时器" }).click();
  await page.getByRole("button", { name: "暂停计时" }).click();
  await expect(page.locator(".floating-timer")).toContainText("已暂停");
  await page.getByRole("button", { name: "加 1 分钟" }).click();
  await page.reload();
  await page.getByRole("button", { name: "打开厨房计时器" }).click();
  await expect(page.getByRole("button", { name: "继续计时" })).toBeVisible();
  await page.getByRole("button", { name: "继续计时" }).click();
  await page.getByRole("button", { name: "收起计时器" }).click();
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.timer.deadline = Date.now() - 1000;
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await page.reload();
  await expect(page.locator(".floating-timer")).toContainText("时间到了");
  await page.getByRole("button", { name: "关闭计时器" }).click();
  await expect(page.locator(".floating-timer")).toContainText("随手计时");
});
test("settings and timer modal remain accessible and mobile sized", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#settings");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/settings-320.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "打开厨房计时器" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/timer-320.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "打开厨房计时器" }),
  ).toBeFocused();
});

test("recipe step timer survives step changes and reload", async ({ page }) => {
  await page.goto("/#recipe/cn-cauliflower");
  await page.getByRole("button", { name: /准备食材，开始做/ }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(5);
  for (const cb of await page.getByRole("checkbox").all()) await cb.check();
  await page.getByRole("button", { name: /我准备好了/ }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("button", { name: "启动计时", exact: true }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "炒香", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".floating-timer")).toContainText("清炒花菜");
  await expect(
    page.getByRole("button", { name: "已有计时进行中" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "关闭计时器" }).click();
  await expect(
    page.getByRole("button", { name: "启动计时", exact: true }),
  ).toBeEnabled();
});
