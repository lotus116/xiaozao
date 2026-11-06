import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from '../src/recipes.js';
const recipe = (id) => recipes.find((r) => r.id === id);
const text = (id) => recipe(id).steps.map((step) => step.text).join('\n');

test('optional stock has a quantified water alternative in the final recipe', () => {
  for (const [id, amount] of [['broccoli-tofu', '235'], ['tomato-noodles', '600']]) {
    const r = recipe(id);
    const water = r.ingredients.find((i) => i.name === '水');
    assert.equal(water.water, true);
    assert.equal(water.optional, false);
    assert.ok(water.amount.includes(amount), id);
    assert.ok(text(id).includes(amount), id);
    assert.equal(r.ingredients.find((i) => i.name === '鸡高汤').optional, true);
    assert.match(text(id), /替换等量清水/);
  }
});

test('fast stir fry prepares aromatics before the heated steps', () => {
  const r = recipe('easy-pepper-pork');
  assert.match(r.steps[0].text, /姜蒜有则先切好/);
  assert.doesNotMatch(r.steps[1].text, /再切好/);
  assert.match(r.steps[0].text, /冷藏腌/);
  const tomato = recipe('tomato-eggs');
  assert.match(tomato.steps[0].text, /油分成两份/);
  assert.match(tomato.steps[2].text, /余油/);
});

test('starch slurry is stirred again before using and not made mandatory', () => {
  for (const id of ['bok-choy', 'broccoli-tofu', 'cn-tomato-tofu-soup', 'easy-mapo-tofu'])
    assert.match(text(id), /重新搅匀/, id);
  assert.equal(recipe('easy-mapo-tofu').ingredients.find((i) => i.name === '玉米淀粉').optional, true);
});

test('optional ground meat still needs its own safe temperature check', () => {
  const r = recipe('easy-mapo-tofu');
  assert.equal(r.ingredients.find((i) => i.name === '牛肉末').optional, true);
  assert.match(text(r.id), /食品温度计.*71°C/);
});

test('marinated meats are refrigerated and meat rice is not delayed at room temperature', () => {
  for (const id of ['easy-potato-pork', 'easy-cucumber-pork', 'easy-pepper-pork', 'easy-shiitake-steamed-chicken'])
    assert.match(recipe(id).steps[0].text, /冷藏腌/, id);
  assert.match(text('easy-chicken-mushroom-rice'), /说明书允许做带肉焖饭/);
  assert.match(text('easy-chicken-mushroom-rice'), /不用常温预约/);
  assert.match(text('easy-chicken-mushroom-rice'), /74°C/);
});
