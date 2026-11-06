import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key = 'xiaozao-v1';

for (const id of ['tomato-eggs', 'steamed-eggs', 'fried-rice']) {
  test(`${id}: optional teaching is available in details, prep and cooking without changing progress`, async ({ page }) => {
    await page.goto('/#recipe/' + id);
    const notes = page.getByRole('complementary', { name: '这道菜怎么做好' });
    await expect(notes).toContainText('先抓住这一点');
    await expect(notes.locator('details')).not.toHaveAttribute('open', '');
    await notes.getByText('怎么调整 · 做偏了怎么办', { exact: true }).click();
    await expect(notes.locator('details')).toHaveAttribute('open', '');
    await page.getByText('菜谱来源与验证说明', { exact: true }).click();
    await expect(page.locator('.source')).toContainText('尚未下厨试做');
    await expect(page.locator('.source a').first()).toHaveAttribute('href', /^https:\/\//);
    await page.getByRole('button', { name: /看看备料，开始做/ }).click();
    await expect(notes).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await page.getByRole('button', { name: '开始做这道菜', exact: true }).click();
    await expect(notes).toBeVisible();
    await expect(page.locator('.cooking-overview')).toBeVisible();
    const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).cooking, key);
    await notes.getByText('怎么调整 · 做偏了怎么办', { exact: true }).click();
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).cooking, key)).toEqual(before);
    await page.getByRole('button', { name: '分步看', exact: true }).click();
    await expect(notes).toBeVisible();
  });
}

test('old steam progress and active timer survive reload with teaching hints', async ({ page }) => {
  await page.goto('/');
  const timer = { id: 'steamed-eggs', step: 1, paused: 75, deadline: Date.now() + 100000 };
  await page.evaluate(({ key, timer }) => localStorage.setItem(key, JSON.stringify({ version: 3, cooking: { id: 'steamed-eggs', step: 1 }, timer, meal: { ids: ['steamed-eggs', 'fried-rice'], done: [] }, basket: ['steamed-eggs', 'fried-rice'] })), { key, timer });
  await page.goto('/#cook/steamed-eggs');
  await page.reload();
  await expect(page.locator('.cooking-overview > li').nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.cooking-timer-status')).toContainText('家常蒸蛋 · 盖盘蒸蛋');
  await expect(page.locator('.cooking-timer-status')).toContainText('1:15');
  await page.getByText('怎么调整 · 做偏了怎么办', { exact: true }).click();
  await expect(page.getByRole('complementary', { name: '这道菜怎么做好' })).toContainText('重新蒸');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).timer, key)).toEqual(timer);
});

test('teaching and rescue text fit narrow screens and pass automated accessibility', async ({ page }) => {
  await page.goto('/#recipe/steamed-eggs');
  await page.getByText('怎么调整 · 做偏了怎么办', { exact: true }).click();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('complementary', { name: '这道菜怎么做好' }).screenshot({ path: 'test-results/beginner-teaching-320.png' });
});
