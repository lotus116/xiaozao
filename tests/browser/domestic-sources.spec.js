import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { recipes } from '../../src/recipes.js';

for (const r of recipes.filter((r) => r.domesticSources?.length)) {
  test(`${r.id}: domestic review links explain scope and preserve original attribution`, async ({ page }) => {
    await page.goto('/#recipe/' + r.id);
    const source = page.locator('.source');
    await expect(source).not.toHaveAttribute('open', '');
    await source.getByText('菜谱来源与验证说明', { exact: true }).click();
    const domestic = page.getByRole('region', { name: '国内教程与取舍' });
    await expect(domestic).toBeVisible();
    for (const s of r.domesticSources) {
      const link = domestic.getByRole('link', { name: `${s.site} · ${s.title}`, exact: true });
      await expect(link).toHaveAttribute('href', s.url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(domestic).toContainText(s.supports);
      await expect(domestic).toContainText(s.adaptation);
    }
    await expect(source.getByRole('link', { name: '查看原作者菜谱' })).toHaveAttribute('href', r.source.url);
    await expect(source.locator('a').first()).toHaveAttribute('href', r.domesticSources[0].url);
    await expect(domestic).toContainText('不是本项目下厨试做或热门排名');
  });
}

test('source transparency fits narrow screens and does not assign unreviewed dishes a domestic badge', async ({ page }) => {
  await page.goto('/#recipe/steamed-eggs');
  await page.getByText('菜谱来源与验证说明', { exact: true }).click();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('region', { name: '国内教程与取舍' }).screenshot({ path: 'test-results/domestic-sources-320.png' });
  await page.goto('/#recipe/fried-rice');
  await page.getByText('菜谱来源与验证说明', { exact: true }).click();
  await expect(page.getByRole('region', { name: '国内教程与取舍' })).toHaveCount(0);
});

test('starting to cook shows the first actual step on the mobile first screen; help remains available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#recipe/tomato-eggs');
  await page.getByRole('button', { name: /看看备料，开始做/ }).click();
  await page.getByRole('button', { name: '开始做这道菜', exact: true }).click();
  await expect(page.locator('.cook h1')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const first = page.locator('.cooking-overview > li').first();
  const titleBox = await first.locator('h2').boundingBox();
  const textBox = await first.locator('p').boundingBox();
  const navBox = await page.locator('nav').boundingBox();
  expect(titleBox.bottom ?? titleBox.y + titleBox.height).toBeLessThan(navBox.y);
  expect(textBox.y + 40).toBeLessThan(navBox.y);
  const stateBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('xiaozao-v1')).cooking);
  await page.screenshot({ path: 'test-results/cooking-first-screen-390.png' });
  await page.getByText('怎么调整 · 做偏了怎么办', { exact: true }).click();
  await expect(page.getByRole('complementary', { name: '这道菜怎么做好' })).toContainText('汁太多');
  await page.getByText('厨房小抄 · 用量、火候与安全', { exact: true }).click();
  await expect(page.locator('.cooking-notes')).toContainText('开始计时');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('xiaozao-v1')).cooking)).toEqual(stateBefore);
});
