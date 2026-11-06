import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from '../src/recipes.js';
import { cleanState, missing } from '../src/logic.js';
const ids = ['tomato-eggs', 'steamed-eggs', 'fried-rice'];
const get = (id) => recipes.find((r) => r.id === id);

test('teaching pass is explicitly limited to three existing dishes', () => {
  assert.equal(recipes.length, 99);
  assert.deepEqual(recipes.filter((r) => r.teaching).map((r) => r.id).sort(), [...ids].sort());
  for (const id of ids) {
    const r = get(id);
    assert.ok(r.teaching.focus && r.teaching.flexibility);
    assert.equal(r.teaching.rescue.length, 3);
    assert.match(r.editorNote, /尚未下厨试做/);
    assert.equal(r.nutrition, null);
    assert.ok(r.additionalSources.length >= 1);
    assert.ok(new Set([r.source, ...r.additionalSources].map((s) => new URL(s.url).hostname)).size >= 2);
    assert.deepEqual(missing(r, r.ingredients.filter((i) => !i.optional && !i.water).map((i) => i.name)), []);
    assert.ok(r.ingredients.filter((i) => i.optional).every((i) => i.optionalReason));
  }
});

test('existing step bookmarks, completed states, meals and steam timers stay compatible', () => {
  for (const [id, titles] of [
    ['tomato-eggs', ['准备食材', '先炒鸡蛋', '炒软番茄', '合炒调味']],
    ['steamed-eggs', ['调蛋液', '盖盘蒸蛋', '关火焖与检查']],
    ['fried-rice', ['准备米饭', '炒蛋和饭', '炒热调味']],
  ]) {
    assert.deepEqual(get(id).steps.map((s) => s.title), titles);
    for (let step = -1; step <= titles.length; step++) {
      const prior = { version: 3, cooking: { id, step }, pantry: ['盐'], basket: ids, favorites: [id], meal: { ids, done: [] } };
      const current = cleanState(JSON.stringify(prior), recipes);
      assert.deepEqual(current.cooking, prior.cooking);
      assert.deepEqual(current.meal, prior.meal);
      assert.deepEqual(current.basket, prior.basket);
      assert.deepEqual(current.favorites, prior.favorites);
      assert.deepEqual(current.pantry, prior.pantry);
    }
  }
  for (const [step, seconds] of [[1, 600], [2, 300]]) {
    assert.equal(get('steamed-eggs').steps[step].seconds, seconds);
    const timer = { id: 'steamed-eggs', step, deadline: Date.now() + 100000, paused: 58 };
    assert.deepEqual(cleanState(JSON.stringify({ version: 3, timer }), recipes).timer, timer);
  }
});

test('cooking steps keep observable cues and safety endpoints outside folded notes', () => {
  const tomato = get('tomato-eggs').steps.map((s) => s.text).join('');
  assert.match(tomato, /余油/);
  assert.match(tomato, /出汁/);
  assert.match(tomato, /干净盘/);
  assert.match(tomato, /完全凝固/);
  const steam = get('steamed-eggs');
  assert.match(steam.ingredients.find((i) => i.water).amount, /1.5 倍/);
  assert.match(steam.steps[0].text, /1.5 倍/);
  assert.match(steam.steps[1].text, /水开后/);
  assert.match(steam.steps[1].text, /不能烧干/);
  assert.match(steam.steps[2].text, /71°C/);
  assert.match(steam.steps[2].text, /再蒸 2 分钟并复查/);
  const rice = get('fried-rice');
  assert.match(rice.steps[0].text, /不必等到隔夜/);
  assert.match(rice.steps[1].text, /分批/);
  assert.match(rice.steps[2].text, /74°C/);
  assert.match(rice.teaching.safety, /只复热一次/);
  assert.match(rice.teaching.safety, /不能补救/);
});
