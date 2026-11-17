import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, catalog } from '../src/recipes.js';
import { expandedRecipes } from '../src/expanded-recipes.js';
import { searchRecipes, cleanState, normalize, recommend } from '../src/logic.js';
import { addPantryInput } from '../src/pantry-input.js';
import { dietaryWarnings, defaultPreferences } from '../src/preferences.js';

const ids = (query) => searchRecipes(recipes,query).map(r=>r.id);
test('steak aliases, partial beef and multiple terms return relevant dishes before incidental optional mince',()=>{
  assert.deepEqual(ids('牛扒'),ids('牛排'));
  assert.equal(ids('牛扒')[0],'home-01');
  assert.equal(ids(' ＳＴＥＡＫ ')[0],'home-01');
  assert.ok(ids('牛').indexOf('home-01') < ids('牛').indexOf('easy-mapo-tofu'));
  assert.ok(ids('牛肉').includes('home-01'));
  assert.ok(ids('牛肉').includes('home-04'));
  assert.ok(ids('牛肉').includes('beef-noodles'));
  assert.ok(ids('牛排 黑胡椒').includes('home-01'));
  assert.deepEqual(ids('牛排 鸡蛋'),[]);
  assert.deepEqual(ids('西红柿'),ids('番茄'));
  assert.deepEqual(ids('意粉'),ids('意面'));
  assert.deepEqual(ids('芝士'),ids('奶酪'));
  assert.deepEqual(searchRecipes(recipes,'  '),recipes);
  assert.ok(searchRecipes(recipes,'鸡',30,1).every(r=>r.minutes<=30&&r.level===1));
});
test('search synonyms never make incompatible pantry cuts equivalent',()=>{
  assert.equal(normalize('牛排'),'牛排');
  assert.notEqual(normalize('牛排'),normalize('牛肉末'));
  const steak=expandedRecipes.find(r=>r.id==='home-01');
  const pantry=steak.ingredients.filter(i=>!i.water&&i.name!=='牛排').map(i=>i.name).concat('牛肉末');
  const result=recommend([steak],pantry);
  assert.deepEqual(result.ready,[]);
  assert.ok(result.near.every(r=>r.missing.includes('牛排')));
});
test('all 200 dishes and the expanded food catalog survive storage without truncation',()=>{
  const allIds=recipes.map(r=>r.id);
  const pantry=addPantryInput([],catalog.join('、')).pantry;
  assert.equal(pantry.length,catalog.length);
  const state=cleanState(JSON.stringify({version:3,pantry,favorites:allIds,basket:allIds,cooking:{id:'world-52850',step:2},meal:{ids:allIds,done:allIds.slice(0,-1)}}),recipes);
  assert.deepEqual(state.basket,allIds);
  assert.deepEqual(state.favorites,allIds);
  assert.deepEqual(state.pantry,pantry);
  assert.equal(state.meal.ids.length,200);
  assert.equal(state.cooking.id,'world-52850');
});
test('101 additions retain independently scoped method evidence, quantified ingredients and safe cooking endpoints',()=>{
  assert.equal(expandedRecipes.length,101);
  for(const r of expandedRecipes){
    assert.ok(r.ingredients.every(i=>/\d/.test(i.amount)||i.water),r.name);
    assert.ok(r.methodReviews[0].supports&&r.methodReviews[0].adaptation,r.name);
    assert.notEqual(new URL(r.source.url).hostname,new URL(r.additionalSources[0].url).hostname,r.name);
    assert.ok(r.steps.every(s=>Number.isInteger(s.seconds)&&s.seconds>=0&&s.seconds<=10800),r.name);
    const text=r.steps.map(s=>s.text).join('');
    if(r.ingredients.some(i=>/鸡胸肉|鸡腿肉|鸡翅|鸭肉/.test(i.name)))assert.match(text,/74°C/,r.name);
    if(r.ingredients.some(i=>/猪肉末|牛肉末|猪肉香肠/.test(i.name)))assert.match(text,/71°C/,r.name);
    if(r.ingredients.some(i=>/牛排|猪里脊/.test(i.name)))assert.match(text,/静置.*3分钟/,r.name);
    if(/水开.*蒸|蒸锅/.test(text))assert.match(r.tools,/蒸锅/,r.name);
    if(/油温计/.test(text))assert.match(r.tools,/油温计/,r.name);
  }
});
test('new pantry foods do not bypass allergen exclusions or misclassify mushroom and coconut names',()=>{
  const warnings=(names,allergens)=>dietaryWarnings({ingredients:names.map(name=>({name}))},{...defaultPreferences(),allergens});
  assert.ok(warnings(['意大利面','速熟古斯米'],['含麸质谷物']).length);
  assert.ok(warnings(['蛏子'],['贝类']).length);
  assert.ok(warnings(['泰式红咖喱酱'],['甲壳类']).length);
  assert.ok(warnings(['伍斯特酱'],['鱼类']).length);
  assert.ok(warnings(['南乳'],['大豆']).length);
  assert.deepEqual(warnings(['蟹味菇'],['甲壳类']),[]);
  assert.deepEqual(warnings(['椰奶','南乳'],['奶类']),[]);
});
