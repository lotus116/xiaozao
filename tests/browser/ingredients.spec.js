import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "xiaozao-v1";
const names = (page) =>
  page
    .locator(".frequent-editor li")
    .evaluateAll((rows) => rows.map((row) => row.dataset.frequentName));

test("frequent foods can be removed, added, reordered and remembered independently of inventory", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "鸡蛋", exact: true }).click();
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  await page.getByRole("button", { name: "取消常用鸡蛋", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "移除鸡蛋", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "肉类", exact: true }).click();
  await page.getByRole("button", { name: "设为常用排骨", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "移除排骨", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "上移土豆", exact: true }).click();
  expect((await names(page)).slice(0, 2)).toEqual(["土豆", "番茄"]);
  await page
    .getByRole("button", { name: "拖动排序番茄", exact: true })
    .press("ArrowUp");
  expect((await names(page))[0]).toBe("番茄");
  const ordered = await names(page);
  await page.getByRole("button", { name: "完成管理", exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  expect(saved.frequentIngredients).toEqual(ordered);
  expect(saved.pantry).toEqual(["鸡蛋"]);
  await page
    .getByRole("button", { name: "清空本次食材，保留调料", exact: true })
    .click();
  await expect(
    page
      .locator(".frequent-chips")
      .getByRole("button", { name: "排骨", exact: true }),
  ).toBeVisible();
});

test("drag sorting commits on release, cancellation preserves order", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  const first = page.getByRole("button", { name: "拖动排序番茄", exact: true });
  // Keep both the source and destination above the fixed mobile navigation.
  await page.locator(".frequent-editor").evaluate((list) => {
    list.scrollIntoView({ block: "start" });
    window.scrollBy(0, -120); // Keep pointer movement out of the auto-scroll edge bands.
  });
  const start = await first.boundingBox();
  const target = await page
    .getByRole("button", { name: "拖动排序土豆", exact: true })
    .boundingBox();
  const navigation = await page.getByRole("navigation", { name: "主要导航" }).boundingBox();
  expect(target.y + target.height).toBeLessThan(navigation.y);
  await page.mouse.move(start.x + 22, start.y + 22);
  await page.mouse.down();
  await page.mouse.move(target.x + 22, target.y + 22, { steps: 8 });
  await page.mouse.up();
  expect((await names(page)).slice(0, 3)).toEqual(["鸡蛋", "土豆", "番茄"]);
  const before = await names(page);
  const current = await first.boundingBox();
  await page.mouse.move(current.x + 22, current.y + 22);
  await page.mouse.down();
  await first.dispatchEvent("pointercancel", {
    pointerId: 1,
    pointerType: "mouse",
  });
  await page.mouse.up();
  expect(await names(page)).toEqual(before);
  await page.reload();
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  expect(await names(page)).toEqual(before);
});

test("mobile touch dragging does not toggle inventory or scroll the handle", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  const first = page.getByRole("button", { name: "拖动排序番茄", exact: true });
  await first.scrollIntoViewIfNeeded();
  const a = await first.boundingBox();
  const b = await page
    .getByRole("button", { name: "拖动排序鸡蛋", exact: true })
    .boundingBox();
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x + 22, y: a.y + 22 }],
  });
  for (let i = 1; i <= 6; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: a.x + 22, y: a.y + 22 + ((b.y - a.y) * i) / 6 }],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await names(page)).slice(0, 2)).toEqual(["鸡蛋", "番茄"]);
  expect(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).pantry, key),
  ).toEqual([]);
});

test("food categories and alias search locate fresh, soy and prepared foods", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("更多食材 · 按分类找", { exact: true }).click();
  for (const [category, food] of [
    ["肉类", "排骨"],
    ["鱼虾海鲜", "鲈鱼"],
    ["豆制品", "豆腐皮"],
    ["半成品", "速冻饺子"],
    ["米面主食", "小米"],
  ]) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await page
      .locator(".category-ingredients")
      .getByRole("button", { name: food, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `移除${food}`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("searchbox", { name: "查找食材" }).fill("西红柿");
  await expect(
    page
      .locator(".category-ingredients")
      .getByRole("button", { name: "番茄", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "查找食材" }).fill("不存在");
  await expect(
    page.getByText("没有找到，试试上方输入框添加自定义食材。", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("添加厨房里已有的食材").fill("龙眼");
  await page.getByRole("button", { name: "添加食材", exact: true }).click();
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  await page.getByRole("button", { name: "水果及其他", exact: true }).click();
  await page.getByRole("button", { name: "设为常用龙眼", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "取消常用龙眼", exact: true }),
  ).toBeVisible();
});

test("empty frequent list persists, management is accessible and fits a narrow phone", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("frequent-management.png"),
    fullPage: true,
  });
  while (await page.getByRole("button", { name: /^取消常用/ }).count())
    await page
      .getByRole("button", { name: /^取消常用/ })
      .first()
      .click();
  await page.reload();
  await expect(page.locator(".frequent-chips button")).toHaveCount(0);
  await page.getByRole("button", { name: "管理常用", exact: true }).click();
  await page
    .getByRole("button", { name: "恢复默认常用食材", exact: true })
    .click();
  await expect(page.locator(".frequent-editor li")).toHaveCount(12);
});

test("native insets keep navigation and the timer away from system bars", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-area-inset-top", "32px");
    document.documentElement.style.setProperty(
      "--safe-area-inset-bottom",
      "24px",
    );
  });
  expect((await page.locator("header").boundingBox()).y).toBe(32);
  expect(
    await page
      .locator("nav")
      .evaluate((el) => getComputedStyle(el).paddingBottom),
  ).toBe("32px");
  const timer = page.getByRole("button", {
    name: "打开厨房计时器",
    exact: true,
  });
  await timer.press("Home");
  expect((await timer.boundingBox()).y).toBeGreaterThanOrEqual(44);
  const box = await timer.boundingBox();
  expect(box.y + box.height).toBeLessThan(760);
});
