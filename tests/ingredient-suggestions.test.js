import { test } from "node:test";
import assert from "node:assert/strict";
import { ingredientToken, ingredientSuggestions, replaceIngredientToken } from "../src/ingredient-suggestions.js";

test("suggestions support catalog names, whole and partial aliases, and no matches", () => {
  const catalog = ["番茄", "土豆", "鸡蛋", "食用油"];
  assert.deepEqual(ingredientSuggestions(catalog, ""), catalog);
  assert.deepEqual(ingredientSuggestions(catalog, "西红柿"), ["番茄"]);
  assert.deepEqual(ingredientSuggestions(catalog, "西红"), ["番茄"]);
  assert.deepEqual(ingredientSuggestions(catalog, "蛋"), ["鸡蛋"]);
  assert.deepEqual(ingredientSuggestions(catalog, "自定义菜"), []);
});

test("choosing a suggestion only replaces the caret's ingredient, preserving the rest of a batch", () => {
  const input = "鸡蛋、马铃，黄瓜";
  assert.deepEqual(ingredientToken(input, 4), { start: 3, end: 5, query: "马铃" });
  assert.deepEqual(replaceIngredientToken(input, "土豆", 4), { value: "鸡蛋、土豆，黄瓜", caret: 5 });
  assert.deepEqual(replaceIngredientToken("鸡蛋、", "番茄"), { value: "鸡蛋、番茄", caret: 5 });
  assert.deepEqual(replaceIngredientToken("鸡蛋 土", "土豆"), { value: "鸡蛋 土豆", caret: 5 });
  assert.deepEqual(ingredientToken("鸡蛋", 500), { start: 0, end: 2, query: "鸡蛋" });
});
