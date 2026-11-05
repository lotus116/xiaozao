import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import { missing, requiredCount, cleanState } from "../src/logic.js";
test("curated collection contains exactly 99 distinct recipes and 46 new simple dishes", () => {
  assert.equal(recipes.length, 99);
  assert.equal(new Set(recipes.map((r) => r.name)).size, 99);
  const added = recipes.filter((r) => r.id.startsWith("easy-"));
  assert.equal(added.length, 46);
  assert.ok(added.every((r) => requiredCount(r) <= 5));
  assert.ok(
    recipes.every((r) =>
      r.ingredients.filter((i) => i.optional).every((i) => i.optionalReason),
    ),
  );
});
test("tomato egg soup is doable with just tomato egg oil salt and water", () => {
  const r = recipes.find((r) => r.id === "tomato-soup");
  assert.deepEqual(missing(r, ["番茄", "鸡蛋", "食用油", "盐"]), []);
  assert.deepEqual(missing(r, ["番茄", "食用油", "盐"]), ["鸡蛋"]);
  assert.ok(!r.ingredients.some((i) => i.name === "鸡高汤"));
});
test("simplification retains the defining flavor ingredients", () => {
  for (const [id, name] of [
    ["scallion-noodles", "葱"],
    ["cn-cola-wings", "可乐"],
    ["easy-mapo-tofu", "辣豆瓣酱"],
  ]) {
    const r = recipes.find((r) => r.id === id);
    assert.ok(r, id);
    const pantry = r.ingredients
      .filter((i) => !i.optional && !i.water && i.name !== name)
      .map((i) => i.name);
    assert.ok(missing(r, pantry).includes(name));
  }
});
test("v2 progress for revised recipes is discarded but selected dishes and pantry remain", () => {
  const s = cleanState(
    JSON.stringify({
      version: 2,
      pantry: ["盐"],
      favorites: ["tomato-soup"],
      basket: ["tomato-soup"],
      cooking: { id: "tomato-soup", step: 1 },
    }),
    recipes,
  );
  assert.equal(s.cooking, null);
  assert.deepEqual(s.basket, ["tomato-soup"]);
  assert.deepEqual(s.favorites, ["tomato-soup"]);
  assert.deepEqual(s.pantry, ["盐"]);
});
