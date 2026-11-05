import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedRecipe,
  cleanPreferences,
  categoryOf,
  defaultPreferences,
} from "../src/preferences.js";
import { cleanState, remaining } from "../src/logic.js";
import { recipes } from "../src/recipes.js";
const dish = (ingredients) => ({
  ingredients: ingredients.map((name) => ({ name, optional: true })),
});
test("optional allergens and compound sauces are still excluded", () => {
  for (const [allergen, ingredient] of [
    ["蛋类", "鸡蛋"],
    ["蛋类", "鸡精"],
    ["大豆", "鸡精"],
    ["大豆", "生抽"],
    ["大豆", "香干"],
    ["大豆", "蒸鱼豉油"],
    ["含麸质谷物", "蒸鱼豉油"],
    ["含麸质谷物", "生抽"],
    ["贝类", "蚝油"],
    ["芝麻", "香油"],
    ["花生", "花生米"],
    ["鱼类", "鱼露"],
    ["奶类", "无盐黄油"],
  ])
    assert.equal(
      allowedRecipe(dish([ingredient]), {
        ...defaultPreferences(),
        allergens: [allergen],
      }),
      false,
    );
});
test("ordinary dislikes can warn instead of hide; allergy always wins", () => {
  const r = dish(["香菜", "虾仁"]);
  assert.equal(
    allowedRecipe(r, { allergens: [], avoid: ["香菜"], avoidMode: "warn" }),
    true,
  );
  assert.equal(
    allowedRecipe(r, { allergens: [], avoid: ["香菜"], avoidMode: "hide" }),
    false,
  );
  assert.equal(
    allowedRecipe(r, {
      allergens: ["甲壳类"],
      avoid: ["香菜"],
      avoidMode: "warn",
    }),
    false,
  );
});
test("preference validation rejects malformed settings", () =>
  assert.deepEqual(
    cleanPreferences({
      allergens: ["蛋类", "unknown", 4],
      avoid: [null, "葱", "葱"],
      avoidMode: "weird",
    }),
    { allergens: ["蛋类"], avoid: ["葱"], avoidMode: "hide" },
  ));
test("old pantry and favorites survive migration", () => {
  const s = cleanState(
    JSON.stringify({
      version: 1,
      pantry: ["盐", "食用油", "番茄"],
      favorites: ["tomato-eggs"],
    }),
    recipes,
  );
  assert.deepEqual(s.pantry, ["盐", "食用油", "番茄"]);
  assert.deepEqual(s.favorites, ["tomato-eggs"]);
  assert.deepEqual(s.preferences, defaultPreferences());
});
test("custom paused timer survives reload without time drift", () => {
  const s = cleanState(
    JSON.stringify({
      version: 2,
      timer: {
        id: null,
        step: null,
        label: "蒸饭",
        paused: 124,
        deadline: Date.now() + 200000,
      },
    }),
    recipes,
  );
  assert.equal(s.timer.paused, 124);
  assert.equal(s.timer.label, "蒸饭");
  assert.equal(remaining(1000, 2000), 0);
});
test("classification separates noodle meals, rice meals, soup and dishes", () => {
  for (const [id, category] of [
    ["fried-rice", "staple"],
    ["tomato-noodles", "staple"],
    ["egg-soup", "soup"],
    ["tomato-eggs", "dish"],
  ])
    assert.equal(categoryOf(recipes.find((r) => r.id === id)), category);
});
