import { test, expect } from '@playwright/test';

test('Hong Kong display, pantry identity and search survive restart and language switching', async ({page}) => {
  await page.goto('/#settings');
  await page.getByLabel('界面语言').selectOption('zh-HK');
  await expect(page.locator('html')).toHaveAttribute('lang','zh-HK');
  await expect(page.getByRole('heading',{name:'廚房設定'})).toBeVisible();
  await page.goto('/#pantry');
  await page.locator('#ingredient').fill('免治牛肉、牛肉捲、薯仔');
  await page.locator('#ingredient').press('Enter');
  await expect.poll(() => page.evaluate(()=>JSON.parse(localStorage.getItem('xiaozao-v1')).pantry)).toEqual(expect.arrayContaining(['牛肉末','牛肉卷','土豆']));
  await page.goto('/#search');
  await page.getByRole('textbox',{name:'搜索食譜'}).fill('魚香肉絲');
  await page.locator('.recipe-open').first().click();
  await expect(page.getByRole('heading',{name:'魚香肉絲',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'魚香肉絲',exact:true})).toBeVisible();
  await page.goto('/#settings');
  await page.locator('select').filter({has:page.locator('option[value="zh-CN"]')}).selectOption('zh-CN');
  await expect(page.getByRole('heading',{name:'厨房设置'})).toBeVisible();
});

test('the compact dock shows time and pause without overlapping the focused cooking controls', async ({page}) => {
  await page.setViewportSize({width:320,height:700});
  await page.goto('/#cook/tomato-eggs');
  await expect.poll(()=>page.evaluate(()=>Boolean(localStorage.getItem('xiaozao-v1')))).toBe(true);
  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('xiaozao-v1'));
    s.cooking={id:'tomato-eggs',step:0};s.cookView='step';
    s.timer={id:null,step:null,paused:275,deadline:Date.now()+275000};
    localStorage.setItem('xiaozao-v1',JSON.stringify(s));
  });
  await page.reload();
  const handle=page.locator('.timer-handle');
  await expect(handle).toContainText('暂停');
  await expect(handle).toContainText('04:35');
  const dock=await handle.boundingBox(), footer=await page.locator('.step-actions').boundingBox();
  expect(dock.y+dock.height).toBeLessThanOrEqual(footer.y);
});

test('all 300 visible Hong Kong titles find their own card through the search box', async ({page}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => localStorage.setItem('xiaozao-language','zh-HK'));
  await page.goto('/#search');
  const input = page.getByRole('textbox',{name:'搜索食譜'});
  const titles = page.locator('.recipe-open strong');
  const names = [];
  const tabs = page.locator('.category-tabs button');
  await expect(tabs).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute('aria-pressed','true');
    names.push(...await titles.allTextContents());
  }
  expect(new Set(names).size).toBe(300);
  for (const name of names) {
    await input.fill(name);
    await expect(titles.first()).toHaveText(name);
  }
});

test('Hong Kong shopping text uses the same terms for clipboard and manual copy', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('xiaozao-language','zh-HK');
    localStorage.setItem('xiaozao-v1',JSON.stringify({version:3,basket:['tomato-eggs']}));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});
  });
  await page.goto('/#basket');
  const copy = page.getByRole('button',{name:'複製採購清單'});
  await copy.click();
  const text = await page.evaluate(()=>window.copied);
  expect(text).toContain('採購清單');
  expect(text).toContain('雞蛋');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined}));
  await copy.click();
  await expect(page.getByRole('textbox',{name:'採購清單文本'})).toHaveValue(text);
});
