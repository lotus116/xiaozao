import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cookingReminders, timerLabel, formatTimer } from '../src/cooking-guidance.js';
import { recipes } from '../src/recipes.js';
const recipe = (id) => recipes.find((r) => r.id === id);
test('reminders are relevant to ingredients including optional starch and meat', () => {
  assert.deepEqual(cookingReminders(recipe('tomato-eggs')), []);
  assert.ok(cookingReminders(recipe('fried-rice')).some((n) => n.key === 'rice'));
  assert.ok(cookingReminders(recipe('honey-chicken')).some((n) => n.key === 'raw'));
  assert.ok(cookingReminders(recipe('broccoli-tofu')).some((n) => n.key === 'starch'));
  assert.ok(recipes.every((r) => new Set(cookingReminders(r).map((n) => n.key)).size === cookingReminders(r).length));
});
test('timer identity and remaining time stay explicit', () => {
  assert.equal(timerLabel(null, recipes), '');
  assert.equal(timerLabel({ label: '煮饭' }, recipes), '煮饭');
  assert.equal(timerLabel({ id: 'steamed-eggs', step: 1 }, recipes), '家常蒸蛋 · 盖盘蒸蛋');
  assert.equal(formatTimer(600), '10:00');
  assert.equal(formatTimer(9), '0:09');
  assert.equal(formatTimer(0), '0:00');
});

test('rice reminders allow freshly cooked rice and keep leftover storage warnings', () => {
  const text = cookingReminders(recipe('fried-rice')).find((r) => r.key === 'rice').text;
  assert.match(text, /新煮米饭可直接用/);
  assert.match(text, /剩饭只用妥善冷藏/);
  assert.match(text, /不靠再次加热挽救/);
});
