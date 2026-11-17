import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes } from '../src/recipes.js';
import { cleanState } from '../src/logic.js';
import { resumeMealRecipe, restoreMealRecipe } from '../src/meal.js';
import { ingredientStatus, refineIngredient } from '../src/ingredient-status.js';

const base = () => cleanState(JSON.stringify({version:3,basket:['tomato-eggs','steamed-eggs'],
  meal:{ids:['tomato-eggs','steamed-eggs'],done:['tomato-eggs']},cooking:{id:'tomato-eggs',step:4}}),recipes);
test('resume skips finished dishes, respects dietary restrictions and preserves active steps',()=>{
  const s=base();assert.equal(resumeMealRecipe(s,recipes).id,'steamed-eggs');
  s.cooking={id:'steamed-eggs',step:1};
  assert.equal(resumeMealRecipe(s,recipes).id,'steamed-eggs');assert.equal(s.cooking.step,1);
  s.preferences.allergens=['蛋类'];assert.equal(resumeMealRecipe(s,recipes),undefined);
  s.preferences.allergens=[];s.meal.done.push('steamed-eggs');assert.equal(resumeMealRecipe(s,recipes),undefined);
});
test('restoring a finished dish resets its stale end step but does not interrupt another dish or timer',()=>{
  const s=base(),r=recipes.find(r=>r.id==='tomato-eggs');
  const restored=restoreMealRecipe(s,r);
  assert.deepEqual(restored.cooking,{id:r.id,step:0});assert.deepEqual(restored.meal.done,[]);
  assert.deepEqual(s.meal.done,[r.id]);
  s.cooking={id:'steamed-eggs',step:1};s.timer={id:'steamed-eggs',step:1,deadline:Date.now()+60000};
  const other=restoreMealRecipe(s,r);assert.equal(other.cooking,s.cooking);assert.equal(other.timer,s.timer);
  assert.equal(restoreMealRecipe(other,r),other);
  const reload=cleanState(JSON.stringify({...other,version:3}),recipes);
  assert.deepEqual(reload.meal.done,[]);assert.deepEqual(reload.cooking,s.cooking);
});
test('ingredient labels distinguish exact aliases, broad food names and unknown names',()=>{
  for(const n of ['西红柿','西蓝花','牛扒','芝士','盐'])assert.equal(ingredientStatus(n).label,'',n);
  assert.equal(ingredientStatus('牛肉').label,'需细分');
  assert.ok(ingredientStatus('牛肉').choices.includes('牛腩'));
  assert.ok(!ingredientStatus('牛肉').choices.includes('牛奶'));
  assert.equal(ingredientStatus('火龙果').label,'未收录');
  const list=['牛肉','鸡蛋','牛腩','火龙果'];
  assert.deepEqual(refineIngredient(list,'牛肉','牛腩'),['牛腩','鸡蛋','火龙果']);
  assert.equal(refineIngredient(list,'牛肉','牛奶'),list);
  assert.equal(refineIngredient(list,'猪肉','猪里脊'),list);
});
test('sound preference migrates old storage and survives reload without resetting timer or meal',()=>{
  const s=base();assert.equal(s.timerSound,true);
  const off=cleanState(JSON.stringify({...s,version:3,timerSound:false}),recipes);
  assert.equal(off.timerSound,false);assert.deepEqual(off.meal,s.meal);assert.deepEqual(off.cooking,s.cooking);
});
