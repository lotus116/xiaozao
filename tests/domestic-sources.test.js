import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from '../src/recipes.js';
import { domesticSourcesById } from '../src/domestic-sources.js';

const expected = ['tomato-eggs', 'steamed-eggs', 'potatoes', 'cucumber', 'cn-pepper-eggs', 'cn-cola-wings', 'easy-shiitake-steamed-chicken', 'cabbage', 'cn-wood-ear-salad', 'easy-mapo-tofu', 'easy-oyster-lettuce'];
const byId = (id) => recipes.find((recipe) => recipe.id === id);

test('only the eleven fully read domestic recipe references are marked reviewed', () => {
  assert.deepEqual(Object.keys(domesticSourcesById).sort(), [...expected].sort());
  assert.equal(recipes.filter((r) => r.domesticSources?.length).length, 11);
  for (const id of expected) {
    const recipe = byId(id);
    assert.deepEqual(recipe.domesticSources, domesticSourcesById[id]);
    assert.ok(recipe.source.url && recipe.additionalSources.length, 'preserve earlier provenance');
    assert.equal(new Set(recipe.domesticSources.map((s) => s.url)).size, recipe.domesticSources.length);
    for (const s of recipe.domesticSources) {
      assert.equal(new URL(s.url).protocol, 'https:');
      assert.ok(['m.xiachufang.com', 'www.cfs.gov.hk'].includes(new URL(s.url).hostname));
      for (const field of ['site', 'title', 'author', 'checked', 'supports', 'adaptation']) assert.ok(s[field]?.trim(), `${id}: ${field}`);
      assert.equal(s.checked, '2026-11-06');
      assert.equal(s.views, undefined);
      assert.equal(s.rating, undefined);
    }
  }
  for (const id of ['fried-rice', 'easy-pepper-pork', 'cn-steamed-perch']) assert.equal(byId(id).domesticSources, undefined, 'partly readable pages must not be marked fully reviewed');
});

test('the recipe/source differences describe the final cooking method, not a generic endorsement', () => {
  assert.match(domesticSourcesById['cn-pepper-eggs'][0].adaptation, /先炒蛋盛出/);
  assert.match(byId('cn-pepper-eggs').steps[1].text, /盛出/);
  assert.match(domesticSourcesById.potatoes[0].adaptation, /短焯/);
  assert.match(byId('potatoes').steps[0].text, /略焯/);
  assert.match(domesticSourcesById['easy-mapo-tofu'][0].adaptation, /可省肉末与淀粉/);
  for (const name of ['牛肉末', '玉米淀粉']) assert.equal(byId('easy-mapo-tofu').ingredients.find((i) => i.name === name).optional, true);
});

test('domestic review improves preparation without changing safe endpoints or making optional salt required', () => {
  const cucumber = byId('cucumber');
  assert.match(cucumber.steps[0].text, /干净食品袋.*擀面杖/);
  const salt = cucumber.ingredients.find((i) => i.name === '盐');
  assert.equal(salt.optional, true);
  assert.match(salt.amount, /先不放/);
  assert.match(byId('cn-wood-ear-salad').steps[0].text, /尽快烹煮/);
  assert.match(byId('cn-wood-ear-salad').steps[0].text, /不超过 2 小时，需更久就冷藏/);
  assert.match(byId('easy-shiitake-steamed-chicken').steps[1].text, /单层.*不重叠/);
  assert.match(byId('easy-shiitake-steamed-chicken').steps[2].text, /食品温度计.*74°C/);
  assert.match(byId('easy-mapo-tofu').steps[0].text, /豆瓣酱.*切细/);
  assert.match(byId('cabbage').steps[0].text, /调味先量好放手边/);
});
