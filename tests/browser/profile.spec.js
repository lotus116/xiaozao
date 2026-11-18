import { test, expect } from '@playwright/test';

test('profile groups account, local library and settings, with return navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '我的', exact: true }).click();
  const tab = page.locator('nav a[href="#profile"]');
  for (const target of ['favorites', 'settings', 'community/account', 'community/mine']) {
    await page.locator(`.profile-page a[href="#${target}"]`).click();
    await expect(page).toHaveURL(new RegExp('#' + target + '$'));
    if (target !== 'community/mine') await expect(tab).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(page.getByRole('heading', { name: '我的', exact: true })).toBeVisible();
  }
});

test('tapping the search icon highlights the entire unchanged search field', async ({ page }) => {
  await page.goto('/#search');
  const shell = page.locator('.searchbox');
  const bounds = await shell.boundingBox();
  await shell.locator('svg').click();
  const field = shell.locator('input');
  await expect(field).toBeFocused();
  await expect(field).toHaveCSS('outline-style', 'none');
  await expect(shell).toHaveCSS('border-color', 'rgb(184, 50, 37)');
  expect(await shell.boundingBox()).toEqual(bounds);
});
