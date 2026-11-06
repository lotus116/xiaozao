import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "xiaozao-v1";
const original = ["cucumber", "tomato-eggs", "easy-potato-rice"];
const suggested = ["easy-potato-rice", "tomato-eggs", "cucumber"];
async function openBasket(page, state = {}) {
  await page.addInitScript(({ key, original, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 3, basket: original, pantry: ["盐"], favorites: ["tomato-eggs"], ...state }));
  }, { key, original, state });
  await page.goto("/#basket");
  await expect(page.getByRole("heading", { name: "今天的菜篮", exact: true })).toBeVisible();
}
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const previewButton = (page) => page.getByRole("button", { name: "帮我排个顺序", exact: true });
const adoptButton = (page) => page.getByRole("button", { name: "采用这个顺序", exact: true });

test("preview explains each dish, prep and honest time but does not mutate anything until adoption", async ({ page }) => {
  await openBasket(page);
  const before = await saved(page);
  await previewButton(page).click();
  await expect(page.getByRole("heading", { name: "顺序建议 · 尚未采用", exact: true })).toBeFocused();
  await expect(page.locator(".meal-plan-dish-title strong")).toHaveText(["土豆焖饭", "番茄炒鸡蛋", "蒜香拍黄瓜"]);
  await expect(page.locator(".meal-time-estimate")).toContainText("菜谱标注合计约 80 分钟");
  await expect(page.locator(".meal-time-estimate")).toContainText("不是上桌倒计时");
  await expect(page.locator(".meal-advance-list")).toContainText("第 1–2 步");
  await page.getByText("为什么这样排 · 蒜香拍黄瓜", { exact: true }).click();
  await expect(page.locator(".meal-plan-dishes")).toContainText("现拌现吃");
  await page.getByText("为什么这样排 · 番茄炒鸡蛋", { exact: true }).click();
  await expect(page.locator(".meal-plan-dishes")).toContainText("没有足够明确的先后依据");
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "先不采用", exact: true }).click();
  await expect(page.locator("#meal-order-preview")).toHaveCount(0);
  await expect(previewButton(page)).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await previewButton(page).click();
  await adoptButton(page).click();
  const after = await saved(page);
  expect(after).toEqual({ ...before, basket: suggested });
  await expect(page.locator(".meal-plan-status")).toContainText("已采用");
  await page.reload();
  expect((await saved(page)).basket).toEqual(suggested);
  await page.getByRole("button", { name: /一键开始做饭/ }).click();
  await expect(page).toHaveURL(/#cook\/easy-potato-rice$/);
  expect((await saved(page)).meal.ids).toEqual(suggested);
});

test("adopt is reversible and later manual edits disable stale undo", async ({ page }) => {
  await openBasket(page);
  await previewButton(page).click();
  await adoptButton(page).click();
  await page.getByRole("button", { name: "撤销采用", exact: true }).click();
  expect((await saved(page)).basket).toEqual(original);
  await expect(page.locator(".meal-plan-status")).toContainText("已恢复");
  await previewButton(page).click();
  await adoptButton(page).click();
  await page.getByRole("button", { name: "提前做番茄炒鸡蛋", exact: true }).click();
  expect((await saved(page)).basket).toEqual(["tomato-eggs", "easy-potato-rice", "cucumber"]);
  await expect(page.getByRole("button", { name: "撤销采用", exact: true })).toHaveCount(0);
  await expect(page.locator(".meal-plan-status")).toBeEmpty();
  await page.reload();
  expect((await saved(page)).basket).toEqual(["tomato-eggs", "easy-potato-rice", "cucumber"]);
});

test("a changed basket invalidates the open preview and regeneration never resurrects a removed dish", async ({ page }) => {
  await openBasket(page);
  await previewButton(page).click();
  await page.getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("预览已过期");
  await expect(adoptButton(page)).toHaveCount(0);
  await page.getByRole("button", { name: "重新生成建议", exact: true }).click();
  await expect(page.locator(".meal-plan-dishes > li")).toHaveCount(2);
  await adoptButton(page).click();
  expect((await saved(page)).basket).toEqual(["easy-potato-rice", "cucumber"]);
  await page.getByRole("button", { name: "撤销采用", exact: true }).click();
  expect((await saved(page)).basket).toEqual(["cucumber", "easy-potato-rice"]);
});

test("preview catches manual reordering and repeated generation does not adopt", async ({ page }) => {
  await openBasket(page);
  await previewButton(page).click();
  await previewButton(page).click();
  expect((await saved(page)).basket).toEqual(original);
  await page.getByRole("button", { name: "提前做番茄炒鸡蛋", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("菜篮已经变化");
  await page.getByRole("button", { name: "先不采用", exact: true }).click();
  expect((await saved(page)).basket).toEqual(["tomato-eggs", "cucumber", "easy-potato-rice"]);
});

test("adopt preserves active meal, done dishes, current step, timer and pantry through reload", async ({ page }) => {
  const meal = { ids: ["steamed-eggs", "tomato-eggs"], done: ["tomato-eggs"] };
  const cooking = { id: "steamed-eggs", step: 1 };
  const timer = { id: "steamed-eggs", step: 1, deadline: Date.now() + 600000 };
  await openBasket(page, { meal, cooking, timer });
  const before = await saved(page);
  await previewButton(page).click();
  await expect(page.locator(".meal-planner")).toContainText("不改变正在做的一餐");
  await adoptButton(page).click();
  expect(await saved(page)).toEqual({ ...before, basket: suggested });
  await page.reload();
  const after = await saved(page);
  expect(after.meal).toEqual(meal);
  expect(after.cooking).toEqual(cooking);
  expect(after.timer).toEqual(timer);
  await page.getByRole("button", { name: "继续这顿饭", exact: true }).click();
  await expect(page).toHaveURL(/#cook\/steamed-eggs$/);
});

test("navigation away and Back/Forward dismiss preview without adopting or reopening it", async ({ page }) => {
  await openBasket(page);
  await previewButton(page).click();
  await page.getByText("为什么这样排 · 蒜香拍黄瓜", { exact: true }).click();
  await page.getByRole("button", { name: "查看蒜香拍黄瓜完整做法", exact: true }).click();
  await expect(page).toHaveURL(/#recipe\/cucumber$/);
  await page.goBack();
  await expect(page).toHaveURL(/#basket$/);
  await expect(page.locator("#meal-order-preview")).toHaveCount(0);
  expect((await saved(page)).basket).toEqual(original);
  await page.goForward();
  await expect(page).toHaveURL(/#recipe\/cucumber$/);
  await page.goBack();
  await expect(page.locator("#meal-order-preview")).toHaveCount(0);
});

test("preparation includes marination, soaking and conditional separate rice without mandatory checklists", async ({ page }) => {
  await openBasket(page, { basket: ["easy-shiitake-steamed-chicken", "easy-kelp-salad", "easy-chicken-mushroom-rice"] });
  await previewButton(page).click();
  await expect(page.locator(".meal-advance-list")).toContainText("冷藏腌约 30 分钟");
  await expect(page.locator(".meal-advance-list")).toContainText("不含泡发");
  await expect(page.locator(".meal-advance-list")).toContainText("不用常温预约");
  await expect(page.locator("#meal-order-preview")).toContainText("不会自动完成步骤或启动计时");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.locator(".meal-time-estimate")).toContainText("140 分钟");
});

test("empty, single and unannotated baskets have honest fallbacks", async ({ page }) => {
  await openBasket(page, { basket: ["tomato-eggs"] });
  await previewButton(page).click();
  await expect(page.locator(".meal-plan-dishes > li")).toHaveCount(1);
  await expect(page.locator("#meal-order-preview")).toContainText("暂时不需要改动当前顺序");
  await adoptButton(page).click();
  await expect(page.locator(".meal-plan-status")).toContainText("已保留当前顺序");
  await page.getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true }).click();
  await expect(previewButton(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "今天想吃点什么？", exact: true })).toBeVisible();
});

test("allergy restrictions block generating/adopting meal suggestions", async ({ page }) => {
  await openBasket(page, { preferences: { allergens: ["蛋类"], avoid: [], avoidMode: "hide" } });
  await expect(previewButton(page)).toBeDisabled();
  await expect(page.locator(".meal-planner")).toContainText("有菜不符合厨房设置");
  await page.getByRole("button", { name: "移出菜篮番茄炒鸡蛋", exact: true }).click();
  await expect(previewButton(page)).toBeEnabled();
});

test("preview and reasoning fit mobile/desktop with keyboard controls and no accessibility violations", async ({ page }) => {
  await openBasket(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await previewButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "顺序建议 · 尚未采用", exact: true })).toBeFocused();
    const reason = page.getByText("为什么这样排 · 蒜香拍黄瓜", { exact: true });
    await reason.focus();
    await page.keyboard.press("Space");
    await expect(reason.locator("..")).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/meal-planning-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "先不采用", exact: true }).click();
    await expect(previewButton(page)).toBeFocused();
  }
});
