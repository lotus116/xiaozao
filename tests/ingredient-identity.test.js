import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshIngredients } from '../src/community-store.js';
import { dietaryWarnings, defaultPreferences } from "../src/preferences.js";
import { ingredientStatus, withPantryAssociation } from '../src/ingredient-status.js';
import { addPantryInput } from '../src/pantry-input.js';
import { recommend, requiredCount, searchRecipes, missing, normalize } from '../src/logic.js';
import { recipes } from '../src/recipes.js';
import { mealIngredients } from '../src/meal.js';

test('old downloaded ingredients refresh offline without changing their identity or the author’s wording', () => {
  const old = { id: 'community-example', ingredients: [{name: '肥牛卷', amount:'150 克'}], unknownIngredients:['肥牛卷'] };
  const refreshed = refreshIngredients(old);
  assert.deepEqual(refreshed.unknownIngredients, []);
  assert.equal(refreshed.id, old.id);
  assert.equal(refreshed.ingredients[0].authorName, '肥牛卷');
  assert.deepEqual(refreshIngredients(refreshed), refreshed);
  const {pantry} = addPantryInput([], '肥牛、肥牛卷、肥牛片');
  assert.deepEqual(pantry, ['肥牛片']);
  assert.equal(recommend([refreshed], pantry).ready.length, 1);
  assert.deepEqual(missing(refreshed, ['牛肉']), ['肥牛片']);
  assert.equal(mealIngredients([refreshed], pantry)[0].missing, false);
  assert.equal(searchRecipes([{...refreshed, name:'午饭', minutes:15}], '肥牛卷').length, 1);
});

test('every built-in ingredient matches its own pantry entry, with water excluded from shopping', () => {
  for (const recipe of recipes) {
    const pantry = recipe.ingredients.filter(i => !i.water).map(i => i.name);
    assert.deepEqual(missing(recipe, pantry), [], recipe.name);
    for (const name of pantry) assert.equal(ingredientStatus(name).label, '', name);
  }
  for (const name of ['constructor', 'toString', '__proto__']) assert.equal(normalize(name), name);
});

test('only an explicit kitchen association allows fatty beef slices to satisfy a beef-roll recipe', () => {
  const dish = refreshIngredients({id:'community-rolls', community:{}, ingredients:[{name:'牛肉卷',amount:'150 克'}]});
  const mapped = withPantryAssociation(dish);
  assert.deepEqual(missing(dish, ['肥牛片']), ['牛肉卷']);
  assert.deepEqual(missing(mapped, ['肥牛片']), []);
  assert.deepEqual(missing(mapped, ['牛肉']), ['肥牛片']);
  assert.equal(mapped.ingredients[0].authorName, '牛肉卷');
  assert.equal(searchRecipes([{...mapped, name:'午饭', minutes:15}], '牛肉卷').length, 1);
  assert.ok(dietaryWarnings(mapped, {...defaultPreferences(), avoid:['牛肉卷']}).length);
});

test('aliases listed in two preparation stages share one shopping entry and preserve both amounts', () => {
  const dish = {name: '牛肉饭', ingredients: [
    {name: '肥牛卷', amount: '100 克'}, {name: '肥牛片', amount: '50 克'},
  ]};
  assert.equal(requiredCount(dish), 1);
  assert.deepEqual(missing(dish, []), ['肥牛片']);
  const [item] = mealIngredients([dish], []);
  assert.equal(item.missing, true);
  assert.deepEqual(item.uses.map(use => use.amount), ['100 克', '50 克']);
  assert.ok(dietaryWarnings(dish, {...defaultPreferences(), avoid: ['肥牛卷']}).length);
  assert.deepEqual(dietaryWarnings({ingredients: [{name: 'constructor'}]}, {...defaultPreferences(), allergens: ['鱼类']}), []);
});
