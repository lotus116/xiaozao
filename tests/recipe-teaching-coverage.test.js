import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipes } from '../src/recipes.js';
import { cleanState, missing } from '../src/logic.js';
const baseline = JSON.parse(readFileSync(new URL('./fixtures/recipe-progress-v3.json', import.meta.url), 'utf8'));

test('all 99 recipes preserve their v3 step identities and timers', () => {
  assert.deepEqual(recipes.map((r) => ({ id: r.id, stateVersion: r.stateVersion || 1, steps: r.steps.map((s) => ({ title: s.title, seconds: s.seconds })) })), baseline);
  for (const r of recipes) {
    for (let step = -1; step <= r.steps.length; step++) {
      const prior = { version: 3, cooking: { id: r.id, step }, basket: [r.id], meal: { ids: [r.id], done: [] }, favorites: [r.id], pantry: ['盐'] };
      const current = cleanState(JSON.stringify(prior), recipes);
      assert.deepEqual(current.cooking, prior.cooking, `${r.id}: step ${step}`);
      assert.deepEqual(current.meal, prior.meal, `${r.id}: meal`);
      assert.deepEqual(current.basket, prior.basket, `${r.id}: basket`);
    }
  }
});

test('every teaching recipe has specific guidance, multiple sources, and optional ingredients remain optional', () => {
  assert.equal(recipes.length, 99);
  assert.equal(recipes.filter((r) => r.teaching).length, 99);
  assert.equal(new Set(recipes.map((r) => r.teaching.focus)).size, 99);
  for (const r of recipes) {
    assert.ok(r.teaching.focus && r.teaching.flexibility, r.id);
    assert.ok(r.teaching.rescue.length >= 2, r.id);
    assert.ok(r.teaching.rescue.every((item) => item.problem && item.advice), r.id);
    assert.ok(r.steps.every((s) => s.text.length >= 20), r.id);
    assert.ok(r.editorNote.includes('试做'), r.id);
    assert.ok(r.additionalSources?.length, `${r.id}: additional method source`);
    for (const source of [r.source, ...r.additionalSources]) {
      assert.equal(new URL(source.url).protocol, 'https:', r.id);
      assert.ok(source.site && source.author && source.checked, r.id);
    }
    assert.deepEqual(missing(r, r.ingredients.filter((i) => !i.optional && !i.water).map((i) => i.name)), [], r.id);
    assert.ok(r.ingredients.filter((i) => i.optional).every((i) => i.optionalReason), r.id);
  }
});

test('high-risk recipe guidance keeps explicit safety requirements', () => {
  const text = (id) => recipes.find((r) => r.id === id).steps.map((s) => s.text).join('\n');
  for (const id of ['honey-chicken', 'cn-cola-wings', 'easy-shiitake-steamed-chicken', 'easy-chicken-breast', 'easy-chicken-mushroom-rice'])
    assert.match(text(id), /74\s*(?:°C|℃)/, id);
  for (const id of ['cn-celery-mince', 'easy-mapo-tofu', 'easy-mince-steamed-egg', 'beef-noodles'])
    assert.match(text(id), /71\s*(?:°C|℃)/, id);
  assert.match(text('cn-steamed-perch'), /63\s*(?:°C|℃)/);
  for (const id of ['easy-luffa', 'easy-luffa-eggs', 'easy-steamed-luffa'])
    assert.match(text(id), /苦/, id);
  assert.match(text('easy-chicken-mushroom-rice'), /(?:不|勿|避免).*(?:预约|常温)/);
  assert.match(text('easy-century-tofu'), /包装/);
  for (const id of ['easy-mung-sprouts', 'easy-chive-sprouts', 'easy-enoki-salad', 'easy-steamed-enoki'])
    assert.match(text(id), /(?:熟透|全熟|彻底煮熟|彻底.*加热)/, id);
});

test('vegetarian mapo keeps its sauce step and optional finishings do not block cooking', () => {
  const recipe = (id) => recipes.find((r) => r.id === id);
  assert.match(recipe('easy-mapo-tofu').steps[1].text, /不用肉就从本步炒豆瓣酱开始/);
  assert.equal(recipe('cn-steamed-perch').ingredients.find((i) => i.name === '食用油').optional, true);
  assert.equal(recipe('cn-onion-shrimp').ingredients.find((i) => i.name === '料酒').optional, true);
  assert.match(recipe('cn-onion-shrimp').steps[1].text, /料酒或等量清水/);
  assert.match(recipe('easy-shiitake-steamed-chicken').steps[0].text, /有姜蒜一起拌入/);
});

test('temperature checks explain the instrument and tofu preparation order stays actionable', () => {
  for (const r of recipes) {
    const body = r.steps.map((s) => s.text).join('');
    if (/\d+°C/.test(body)) assert.match(body, /温度计/, r.id);
  }
  const tofu = recipes.find((r) => r.id === 'easy-century-tofu').steps[0].text;
  assert.ok(tofu.indexOf('开封取出') < tofu.indexOf('按说明煮熟'));
});


test('final content review preserves optional ingredient timing and clear stirring intervals', () => {
  const recipe = (id) => recipes.find((r) => r.id === id);
  assert.match(recipe('easy-chicken-mushroom-rice').steps[1].text, /有胡萝卜丁也一起下锅/);
  const mushroom = recipe('mushroom').steps[2].text;
  assert.ok(mushroom.indexOf('有蒜先') < mushroom.indexOf('加黄油'));
  assert.match(recipe('cucumber').steps[1].text, /喜欢甜味才加一点糖/);
  assert.match(recipe('hot-noodles').teaching.flexibility, /这版仍需辣椒碎/);
  assert.match(recipe('cn-millet-congee').steps[2].text, /慢煮约15–20分钟，其间不时搅底/);
});
