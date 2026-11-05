import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "xiaozao-v1";

test("simple soup is recommended without stock, pepper or starch", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText(/管理常备调料/).click();
  for (const name of ["番茄", "鸡蛋", "食用油", "盐"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "汤羹", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /番茄蛋花汤.*可以做，必需食材齐全/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /番茄蛋花汤.*可以做，必需食材齐全/ })
    .click();
  await expect(
    page.locator(".ingredient-tile").filter({ hasText: "白胡椒" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".ingredient-tile").filter({ hasText: "鸡高汤" }),
  ).toHaveCount(0);
});
test("few ingredient filter can be toggled and reset", async ({ page }) => {
  await page.goto("/#search");
  await page.getByRole("button", { name: "汤羹", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /番茄豆腐蛋花羹.*分钟/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "少配料 · 5 样以内", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /番茄豆腐蛋花羹.*分钟/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /番茄蛋花汤.*分钟/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "重置筛选", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /番茄豆腐蛋花羹.*分钟/ }),
  ).toBeVisible();
});

test("timer is icon only, draggable, persistent, and long press hides without cancelling", async ({
  page,
}) => {
  await page.goto("/#search");
  let handle = page.getByRole("button", {
    name: "打开厨房计时器",
    exact: true,
  });
  await expect(handle).toHaveText("");
  const before = await handle.boundingBox();
  await page.mouse.move(before.x + 28, before.y + 28);
  await page.mouse.down();
  await page.mouse.move(before.x - 120, before.y - 150, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  let moved = await handle.boundingBox();
  expect(moved.x).toBeLessThan(before.x - 70);
  expect(moved.y).toBeLessThan(before.y - 70);
  await handle.click();
  await page.getByRole("button", { name: "3 分钟", exact: true }).click();
  handle = page.getByRole("button", { name: /打开厨房计时器/ });
  const pos = await handle.boundingBox();
  await page.mouse.move(pos.x + 28, pos.y + 28);
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
  await expect(handle).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)).timer !== null,
      key,
    ),
  ).toBe(true);
  await expect(handle).toHaveCount(0);
  await page.goto("/#settings");
  await page
    .getByRole("button", { name: "显示计时器图标", exact: true })
    .click();
  await expect(handle).toBeVisible();
  await page.setViewportSize({ width: 320, height: 600 });
  const resized = await handle.boundingBox();
  expect(resized.x).toBeGreaterThanOrEqual(12);
  expect(resized.x + resized.width).toBeLessThanOrEqual(320);
  expect(resized.y + resized.height).toBeLessThan(530);
});
test("ending a timer closes the modal and stays in cooking without a new timer form", async ({
  page,
}) => {
  await page.goto("/#recipe/cn-cauliflower");
  await page.getByRole("button", { name: /看看备料，开始做/ }).click();
  await page.getByRole("button", { name: "开始做这道菜", exact: true }).click();
  await page.getByRole("button", { name: /^启动计时：焯花菜/ }).click();
  await page.getByRole("button", { name: /打开厨房计时器/ }).click();
  await page.getByRole("button", { name: "结束当前计时", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("时长（分钟，最多 180）")).not.toBeVisible();
  await expect(page).toHaveURL(/#cook\/cn-cauliflower$/);
  await expect(
    page.getByRole("heading", { name: "焯花菜", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^启动计时：焯花菜/ }),
  ).toBeEnabled();
});
test("basket supports selecting, reordering, combined prep, and a complete two dish meal", async ({
  page,
}) => {
  await page.goto("/#search");
  await page
    .getByRole("button", { name: "加入菜篮番茄炒鸡蛋", exact: true })
    .click();
  await page
    .getByRole("button", { name: "加入菜篮家常蒸蛋", exact: true })
    .click();
  await page.getByRole("link", { name: /菜篮/ }).click();
  await expect(page.locator(".basket-dishes > li")).toHaveCount(2);
  await page
    .getByRole("button", { name: "提前做家常蒸蛋", exact: true })
    .click();
  await expect(page.locator(".basket-dishes > li").first()).toContainText(
    "家常蒸蛋",
  );
  await page
    .getByRole("button", { name: "提前做番茄炒鸡蛋", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".basket-dishes > li").first()).toContainText(
    "番茄炒鸡蛋",
  );
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await expect(page).toHaveURL(/#cook\/tomato-eggs$/);
  await expect(page.locator(".cooking-overview > li")).toHaveCount(4);
  await page.getByRole("button", { name: "完成这道菜", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "下一道：家常蒸蛋", exact: true })
    .click();
  await expect(page).toHaveURL(/#cook\/steamed-eggs$/);
  await page.getByRole("button", { name: "完成这道菜", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "辛苦啦，开饭吧。" }),
  ).toBeVisible();
  await expect(
    page.getByText("这餐已完成 2 / 2 道", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "回到菜篮", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /一键开始做饭/ }),
  ).toBeVisible();
});
test("basket respects later allergy changes and allows removing blocked dishes", async ({
  page,
}) => {
  await page.goto("/#recipe/tomato-eggs");
  await page
    .getByRole("button", { name: "加入今天的菜篮", exact: true })
    .click();
  await page.goto("/#settings");
  await page.getByRole("button", { name: "蛋类", exact: true }).click();
  await page.goto("/#basket");
  await expect(
    page.getByRole("button", { name: /一键开始做饭/ }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "今天想吃点什么？" }),
  ).toBeVisible();
});
test("prep tiles basket and cooking overview are accessible on narrow phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ["recipe/tomato-eggs", "basket", "settings"]) {
    await page.goto("/#" + path);
    if (path === "recipe/tomato-eggs")
      await page
        .getByRole("button", { name: "加入今天的菜篮", exact: true })
        .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: "test-results/new-" + path.replace("/", "-") + "-320.png",
      fullPage: true,
    });
  }
  await page.goto("/#basket");
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/cooking-overview-320.png",
    fullPage: true,
  });
});
