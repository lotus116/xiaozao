import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key='xiaozao-v1';
test.use({isMobile:true,hasTouch:true});
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function seed(page,state,route='basket') {
 await page.goto('/');
  // Download hydration is asynchronous; seed only after initial persistence.
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("xiaozao-v1"))).toBe(true);await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify({version:3,...state})),{key,state});
 await page.goto('/#'+route);await page.reload();
  await expect(page.locator("main")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1"))?.timerSound !== undefined)).toBe(true);
}
async function audioProbe(page,fail=false) {
 await page.addInitScript(fail=>{
  window.audioProbe={created:0,starts:0,stops:0};
  window.AudioContext=class {
   state='suspended';currentTime=0;destination={};
   constructor(){window.audioProbe.created++;}
   resume(){if(fail)return Promise.reject(Error('blocked'));this.state='running';return Promise.resolve();}
   close(){this.state='closed';return Promise.resolve();}
   createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
   createOscillator(){return{frequency:{},connect(){},disconnect(){},start(){window.audioProbe.starts++;},stop(at){if(at===undefined)window.audioProbe.stops++;}};}
  };
 },fail);
}
const soundCounts=page=>page.evaluate(()=>window.audioProbe);

test('partial meal survives return and reload; resume skips completed; restore does not interrupt current dish',async({page},info)=>{
 const ids=['tomato-eggs','steamed-eggs','bok-choy','cucumber'];
 await seed(page,{basket:ids});
 await page.getByRole('button',{name:/一键开始做饭/}).tap();
 await page.getByRole('button',{name:'完成这道菜',exact:true}).tap();
 await page.getByRole('button',{name:'下一道：家常蒸蛋',exact:true}).tap();
 await page.getByRole('button',{name:'完成这道菜',exact:true}).tap();
 await page.getByRole('button',{name:'回到菜篮',exact:true}).tap();
 await expect(page.locator('.meal-progress')).toContainText('已完成 2 / 共 4 道 · 剩余 2 道');
 await expect(page.locator('.basket-dish-progress .ready')).toHaveCount(2);
 await page.reload();expect((await read(page)).meal.done).toEqual(ids.slice(0,2));
 await page.screenshot({path:info.outputPath('meal-progress-390.png')});
 await page.getByRole('button',{name:'继续这顿饭',exact:true}).tap();
 await expect(page).toHaveURL(/#cook\/bok-choy$/);
 await page.getByRole('button',{name:'返回菜篮（进度保留）',exact:true}).tap();
 const before=(await read(page)).cooking;
 await page.getByRole('button',{name:'恢复待做番茄炒鸡蛋',exact:true}).tap();
 expect((await read(page)).cooking).toEqual(before);
 await expect(page.locator('.meal-progress')).toContainText('已完成 1 / 共 4 道');
 await page.getByRole('button',{name:'继续这顿饭',exact:true}).tap();
 await expect(page).toHaveURL(/#cook\/bok-choy$/);
 await page.getByRole('button',{name:'完成这道菜',exact:true}).tap();
 await page.getByRole('button',{name:'回到菜篮',exact:true}).tap();
 await page.getByRole('button',{name:'继续这顿饭',exact:true}).tap();
 await expect(page).toHaveURL(/#cook\/tomato-eggs$/);
 expect((await read(page)).cooking.step).toBe(0);
});

test('finished meal remains visible; undo current completion resets its step; starting a new meal requires confirmation',async({page})=>{
 const ids=['tomato-eggs'];
 await seed(page,{basket:ids,meal:{ids,done:ids},cooking:{id:ids[0],step:4}});
 await expect(page.getByRole('button',{name:'继续这顿饭',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'恢复待做番茄炒鸡蛋',exact:true}).tap();
 expect((await read(page)).cooking.step).toBe(0);expect((await read(page)).meal.done).toEqual([]);
 await page.getByRole('button',{name:'继续这顿饭',exact:true}).tap();
 await page.getByRole('button',{name:'完成这道菜',exact:true}).tap();
 await page.getByRole('button',{name:'回到菜篮',exact:true}).tap();
 await page.reload();
 await expect(page.locator('.meal-progress')).toContainText('本餐已完成');
 await page.getByRole('button',{name:/开始新的一餐/}).tap();
 await page.getByRole('button',{name:'保留当前跟做',exact:true}).tap();
 expect((await read(page)).meal.done).toEqual(ids);
 await page.getByRole('button',{name:/开始新的一餐/}).tap();
 await page.getByRole('button',{name:'确认，开始这顿饭',exact:true}).tap();
 expect((await read(page)).meal.done).toEqual([]);expect((await read(page)).cooking.step).toBe(0);
});

test('editing next basket retains completed dishes in current meal and restore works after removal',async({page})=>{
 const ids=['tomato-eggs','steamed-eggs'];
 await seed(page,{basket:['steamed-eggs','bok-choy'],meal:{ids,done:['tomato-eggs']},cooking:{id:'steamed-eggs',step:1}});
 await expect(page.locator('.basket-dishes > li').last()).toContainText('下一餐');
 await page.locator('.meal-retained summary').tap();
 await page.getByRole('button',{name:'恢复待做番茄炒鸡蛋',exact:true}).tap();
 expect((await read(page)).meal.ids).toEqual(ids);expect((await read(page)).cooking).toEqual({id:'steamed-eggs',step:1});
 expect((await read(page)).basket).toEqual(['steamed-eggs','bok-choy']);
});

test('food statuses persist, known aliases are recognized, and explicit refinement deduplicates without losing other foods',async({page},info)=>{
 await page.goto('/');const input=page.getByLabel('添加厨房里已有的食材');
 await input.fill('牛肉、火龙果、西红柿、牛腩');await page.getByRole('button',{name:'添加食材',exact:true}).tap();
 await expect(page.getByRole('button',{name:'移除牛肉',exact:true})).toContainText('需细分');
 await expect(page.getByRole('button',{name:'移除火龙果',exact:true})).toContainText('未收录');
 await expect(page.getByRole('button',{name:'移除番茄',exact:true})).not.toContainText('未收录');
 await page.reload();
 await expect(page.getByRole('button',{name:'移除火龙果',exact:true})).toContainText('未收录');
 await page.setViewportSize({width:320,height:700});
 await page.screenshot({path:info.outputPath('pantry-status-320.png')});
 await page.getByRole('button',{name:'选择牛肉的具体食材',exact:true}).tap();
 await page.getByRole('button',{name:'取消，保留原食材',exact:true}).tap();
 expect((await read(page)).pantry).toContain('牛肉');
 await page.getByRole('button',{name:'选择牛肉的具体食材',exact:true}).tap();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'将牛肉改为牛腩',exact:true}).tap();
 expect((await read(page)).pantry).toEqual(['牛腩','火龙果','番茄']);
 await page.reload();await expect(page.getByRole('button',{name:'移除牛肉',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('sound starts once after expiry, survives route changes and hidden icon, and acknowledgement prevents replay',async({page})=>{
 await audioProbe(page);await page.clock.install();
 await seed(page,{timer:{id:null,step:null,deadline:Date.now()+10000}},'pantry');
 await page.getByRole('heading',{name:'今天有什么食材？'}).tap();
 const clock=page.locator('.timer-handle');const box=await clock.boundingBox();
 await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.clock.fastForward(800);await page.mouse.up();
 await expect(clock).toHaveCount(0);
 expect((await read(page)).timerDock.hidden).toBe(true);
 await page.clock.fastForward(10000);
 await expect(page.getByRole('complementary',{name:'计时到点提醒'})).toBeVisible();
 await expect.poll(async()=>(await soundCounts(page)).starts).toBe(3);
 await page.getByRole('link',{name:'我的',exact:true}).tap();
 await page.clock.fastForward(3100);
 expect((await soundCounts(page)).starts).toBe(6);expect((await soundCounts(page)).created).toBe(1);
 await page.getByRole('button',{name:'知道了，结束计时',exact:true}).tap();
 expect((await read(page)).timer).toBeNull();
 const count=(await soundCounts(page)).starts;await page.clock.fastForward(10000);
 expect((await soundCounts(page)).starts).toBe(count);expect((await soundCounts(page)).stops).toBeGreaterThan(0);
});

test('sound setting persists and mute leaves visual alert without any tone',async({page},info)=>{
 await audioProbe(page);await page.clock.install();
 await seed(page,{timer:{id:null,step:null,deadline:Date.now()+10000}},'settings');
 const toggle=page.getByRole('switch',{name:'前台到时响铃',exact:true});
 await toggle.tap();await expect(toggle).toHaveAttribute('aria-checked','false');
 await page.clock.fastForward(10500);
 await expect(page.getByRole('complementary',{name:'计时到点提醒'})).toBeVisible();
 expect((await soundCounts(page)).starts).toBe(0);
 await page.getByRole('button',{name:'知道了，结束计时',exact:true}).tap();
 await page.reload();await expect(toggle).toHaveAttribute('aria-checked','false');
 await expect(page.getByRole('button',{name:'试听提示音',exact:true})).toBeDisabled();
 await toggle.tap();await page.getByRole('button',{name:'试听提示音',exact:true}).tap();
 expect((await soundCounts(page)).starts).toBe(3);expect((await read(page)).timer).toBeNull();
 await page.getByRole('heading',{name:'计时提醒',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath('sound-settings-390.png')});
});

test('foreground loss stops sound, returning resumes only unacknowledged timers, and blocked audio has a retry',async({page})=>{
 await audioProbe(page);await page.clock.install();
 await seed(page,{timer:{id:null,step:null,deadline:Date.now()-500}},'pantry');
 await page.getByRole('heading',{name:'今天有什么食材？'}).tap();
 await expect.poll(async()=>(await soundCounts(page)).starts).toBe(3);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.clock.fastForward(5000);
 expect((await soundCounts(page)).starts).toBe(3);
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 await expect.poll(async()=>(await soundCounts(page)).starts).toBe(6);
 await page.getByRole('button',{name:'知道了，结束计时',exact:true}).tap();
 await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));});
 await page.clock.fastForward(5000);expect((await soundCounts(page)).starts).toBe(6);
});

test('denied audio still shows an actionable timer alert and never throws a page error',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await audioProbe(page,true);
 await seed(page,{timer:{id:null,step:null,deadline:Date.now()-500}},'pantry');
 await page.getByRole('heading',{name:'今天有什么食材？'}).tap();
 await expect(page.getByRole('button',{name:'重试提示音',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'重试提示音',exact:true}).tap();
 expect((await soundCounts(page)).starts).toBe(0);
 await page.getByRole('button',{name:'知道了，结束计时',exact:true}).tap();
 expect((await read(page)).timer).toBeNull();expect(errors).toEqual([]);
});

test('extending, pausing and muting an alarm stops sound without discarding the timer',async({page})=>{
 await audioProbe(page);await page.clock.install();
 await seed(page,{timer:{id:null,step:null,deadline:Date.now()-500}},'pantry');
 await page.getByRole('heading',{name:'今天有什么食材？'}).tap();
 await expect.poll(async()=>(await soundCounts(page)).starts).toBe(3);
 await page.getByRole('button',{name:/查看计时，打开厨房计时器/}).tap();
 await page.getByRole('button',{name:'加 1 分钟',exact:true}).tap();
 await page.getByRole('button',{name:'暂停计时',exact:true}).tap();
 await page.clock.fastForward(65000);
 expect((await soundCounts(page)).starts).toBe(3);
 expect((await read(page)).timer.paused).toBeGreaterThan(0);
 await page.getByRole('button',{name:'继续计时',exact:true}).tap();
 await page.clock.fastForward(65000);
 await expect.poll(async()=>(await soundCounts(page)).starts).toBe(6);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{location.hash='settings';});
 await page.getByRole('switch',{name:'前台到时响铃',exact:true}).tap();
 const count=(await soundCounts(page)).starts;
 await page.clock.fastForward(10000);
 expect((await soundCounts(page)).starts).toBe(count);
 expect((await read(page)).timer).not.toBeNull();
 await expect(page.getByRole('complementary',{name:'计时到点提醒'})).toBeVisible();
});

test('actual Web Audio context can play the preview after a user gesture',async({page})=>{
 await page.addInitScript(()=>{
  const Original=window.AudioContext;window.actualAudio={starts:0,state:null};
  window.AudioContext=class extends Original{
   constructor(...args){super(...args);const base=this.createOscillator.bind(this);this.createOscillator=()=>{const osc=base(),start=osc.start.bind(osc);osc.start=(...a)=>{window.actualAudio.starts++;window.actualAudio.state=this.state;return start(...a);};return osc;};}
  };
 });
 await page.goto('/#settings');await page.getByRole('button',{name:'试听提示音',exact:true}).tap();
 await expect.poll(()=>page.evaluate(()=>window.actualAudio)).toEqual({starts:3,state:'running'});
});
