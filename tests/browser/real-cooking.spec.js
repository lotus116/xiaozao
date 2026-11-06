import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key = 'xiaozao-v1';
async function seed(page, values = {}, path = 'cook/tomato-eggs') {
  await page.goto('/');
  await page.evaluate(({ key, values }) => localStorage.setItem(key, JSON.stringify({ version: 3, cooking: { id: 'tomato-eggs', step: 0 }, ...values })), { key, values });
  await page.goto('/#' + path);
  await page.reload();
}
async function mockWake(page, mode = 'success') {
  await page.addInitScript((mode) => {
    window.wakeRequests = 0; window.wakeReleases = 0;
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: mode === 'unsupported' ? undefined : { request: async () => {
      window.wakeRequests++;
      if (mode === 'denied' && window.wakeRequests === 1) throw new Error('NotAllowedError');
      const lock = new EventTarget(); lock.released = false;
      lock.release = async () => { if (!lock.released) { lock.released = true; window.wakeReleases++; lock.dispatchEvent(new Event('release')); } };
      window.testWakeLock = lock;
      return lock;
    } } });
  }, mode);
}

test('overview remembers an optional place without marking completion or forcing steps', async ({ page }) => {
  await seed(page);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.locator('.cooking-overview > li')).toHaveCount(4);
  await page.getByRole('button', { name: '记住做到这里：第 3 步，炒软番茄', exact: true }).click();
  await expect(page.locator('#cooking-step-2')).toBeFocused();
  await page.reload();
  await expect(page.locator('.cooking-overview > li').nth(2)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#cooking-step-2')).toBeInViewport();
  await page.getByRole('button', { name: '分步看', exact: true }).click();
  await expect(page.locator('.focused-step')).toHaveText('炒软番茄');
  await page.getByRole('button', { name: '整页看', exact: true }).click();
  await expect(page.locator('.cooking-overview > li')).toHaveCount(4);
  await expect(page.getByRole('button', { name: '完成这道菜', exact: true })).toBeVisible();
});

test('preparation and small kitchen reference are available without a checklist', async ({ page }) => {
  await page.goto('/#recipe/fried-rice');
  await expect(page.getByRole('complementary', { name: '开火前提醒' })).toContainText('妥善冷藏');
  await page.getByRole('button', { name: /看看备料，开始做/ }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '做菜时保持亮屏' })).toHaveCount(0);
  await page.getByText('厨房小抄 · 用量、火候与安全', { exact: true }).click();
  await expect(page.locator('.cooking-notes')).toContainText('不能把所有食材都按 1 毫升 = 1 克换算');
  await page.getByRole('button', { name: '开始做这道菜', exact: true }).click();
  await expect(page.locator('.cooking-overview')).toBeVisible();
});

test('hidden running timer remains reachable within the recipe and never gets overwritten', async ({ page }) => {
  await seed(page, { cooking: { id: 'cn-cauliflower', step: 1 }, timer: { id: null, step: null, label: '旁边的米饭', deadline: Date.now() + 300000, paused: 75 }, timerDock: { hidden: true } }, 'cook/cn-cauliflower');
  await expect(page.locator('.timer-handle')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^查看当前厨房计时：/ })).toContainText('旁边的米饭');
  await expect(page.locator('.cooking-timer-status')).toContainText('已暂停 · 1:15');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: /^查看当前厨房计时：/ }).click();
  const dialog = page.getByRole('dialog', { name: '厨房计时器', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('不保证后台或锁屏响铃');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).timer.label, key)).toBe('旁边的米饭');
});

test('keep awake starts only on request, can be turned off, and releases on navigation', async ({ page }) => {
  await mockWake(page);
  await seed(page);
  expect(await page.evaluate(() => window.wakeRequests)).toBe(0);
  await page.getByRole('button', { name: '做菜时保持亮屏', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '屏幕常亮已开启' })).toBeVisible();
  expect(await page.evaluate(() => window.wakeRequests)).toBe(1);
  await page.getByRole('button', { name: '关闭常亮请求', exact: true }).click();
  expect(await page.evaluate(() => window.wakeReleases)).toBe(1);
  await page.getByRole('button', { name: '做菜时保持亮屏', exact: true }).click();
  await page.getByRole('link', { name: '我的食材', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.wakeReleases)).toBe(2);
  await page.getByRole('button', { name: /继续做 番茄炒鸡蛋/ }).click();
  await expect(page.getByRole('button', { name: '做菜时保持亮屏', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.wakeRequests)).toBe(2);
});

test('keep awake shows denied and system-released states honestly, with explicit retry', async ({ page }) => {
  await mockWake(page, 'denied');
  await seed(page);
  await page.getByRole('button', { name: '做菜时保持亮屏', exact: true }).click();
  await expect(page.locator('.keep-awake')).toContainText('常亮未能开启');
  await page.getByRole('button', { name: '重试常亮', exact: true }).click();
  await expect(page.locator('.keep-awake')).toContainText('屏幕常亮已开启');
  await page.evaluate(() => window.testWakeLock.release());
  await expect(page.locator('.keep-awake')).toContainText('系统已释放常亮');
  expect(await page.evaluate(() => window.wakeRequests)).toBe(2);
});

test('unsupported wake lock is explained and never blocks cooking', async ({ page }) => {
  await mockWake(page, 'unsupported');
  await seed(page);
  await expect(page.getByRole('button', { name: '做菜时保持亮屏', exact: true })).toBeDisabled();
  await expect(page.locator('.keep-awake')).toContainText('当前环境不支持');
  await page.getByRole('button', { name: '完成这道菜', exact: true }).click();
  await expect(page.getByRole('heading', { name: '辛苦啦，开饭吧。' })).toBeVisible();
  await expect(page.locator('.keep-awake')).toHaveCount(0);
});

test('optional cooking helpers fit phone and tablet with accessible controls', async ({ page }) => {
  await mockWake(page);
  await seed(page, { cooking: { id: 'honey-chicken', step: 1 } }, 'cook/honey-chicken');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByText('厨房小抄 · 用量、火候与安全', { exact: true }).click();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: 'test-results/real-cooking-320.png', fullPage: true });
});
