import { test, expect } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true });
const query = page => page.getByRole('textbox', { name: '搜索菜谱' });
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('xiaozao-v1')));

test('steak synonyms rank actual steak first and do not lose the search when returning', async ({ page }, info) => {
  await page.goto('/#search');
  for (const term of ['牛排', '牛扒', 'steak', '牛']) {
    await query(page).fill(term);
    await expect(page.locator('.recipe-row').first()).toContainText('蒜香黄油牛排');
  }
  await query(page).fill('牛扒');
  await page.locator('.recipe-open').first().tap();
  await expect(page.getByRole('heading', { name: '蒜香黄油牛排', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '收藏', exact: true }).tap();
  await page.getByRole('button', { name: '返回菜谱', exact: true }).tap();
  await expect(query(page)).toHaveValue('牛扒');
  await page.reload();
  await expect(query(page)).toHaveValue('牛扒');
  await page.screenshot({ path: info.outputPath('steak-search-390.png') });
  await page.getByRole('link', { name: '我的', exact: true }).tap();
  await page.getByRole('link', { name: /^收藏/ }).tap();
  await query(page).fill('牛排');
  await expect(page.locator('.recipe-row')).toHaveCount(1);
  await query(page).fill('鸡');
  await expect(page.locator('.recipe-row')).toHaveCount(0);
});

test('search crosses categories, manual category filters persist, and browse all clears restrictions', async ({ page }) => {
  await page.goto('/#search');
  await query(page).fill('意粉');
  await expect(page.getByRole('button', { name: '全部', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.recipe-row').filter({ hasText: '意式肉酱面' })).toHaveCount(1);
  await page.getByRole('button', { name: '汤羹', exact: true }).tap();
  await expect(page.locator('.recipe-row')).toHaveCount(0);
  await page.getByRole('button', { name: '浏览全部菜谱', exact: true }).tap();
  await expect(query(page)).toHaveValue('');
  await expect(page.locator('.recipe-row')).toHaveCount(200);
  await page.reload();
  await expect(page.locator('.recipe-row')).toHaveCount(200);
});

test('new steak keeps quantities, cooking progress and active timer through hide and restore', async ({ page }, info) => {
  await page.goto('/#recipe/home-01');
  await page.getByRole('button', { name: '看备料', exact: true }).tap();
  await page.getByRole('button', { name: '开始做这道菜', exact: true }).tap();
  await page.getByRole('button', { name: '分步看', exact: true }).tap();
  await page.getByRole('button', { name: '下一步', exact: true }).tap();
  await expect(page.locator('.step-guidance')).toContainText('食用油15毫升');
  // The focused step's timer remains a deliberate action, not an automatic countdown.
  expect((await saved(page)).timer).toBeNull();
  await page.getByRole('button', { name: /^启动计时：煎出外壳/ }).tap();
  await expect.poll(async () => (await saved(page)).timer?.step).toBe(1);
  const timerBefore = (await saved(page)).timer;
  expect(timerBefore.deadline - Date.now()).toBeGreaterThan(110000);
  expect(timerBefore.deadline - Date.now()).toBeLessThanOrEqual(120000);
  const clock = page.getByRole('button', { name: /打开厨房计时器/ });
  const box = await clock.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
  await expect(clock).toHaveCount(0);
  await page.reload();
  expect((await saved(page)).cooking).toMatchObject({ id: 'home-01', step: 1 });
  expect((await saved(page)).timer).toEqual(timerBefore);
  await page.goto('/#settings');
  await page.getByRole('button', { name: '显示计时器图标', exact: true }).tap();
  await expect(clock).toBeVisible();
  await page.goto('/#cook/home-01');
  await expect(page.locator('.step-guidance')).toContainText('食用油15毫升');
  await page.screenshot({ path: info.outputPath('steak-cooking-390.png') });
});
