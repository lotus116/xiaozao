import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import {
  normalize,
  unique,
  missing,
  recommend,
  searchRecipes,
  cleanState,
  remaining,
} from "../src/logic.js";
const tomato = recipes[0],
  have = tomato.ingredients
    .filter((i) => !i.optional && !i.water)
    .map((i) => i.name);
test("aliases and deduplication", () =>
  assert.deepEqual(unique(["番茄", "西红柿", " 鸡蛋 ", "鸡蛋"]), [
    "番茄",
    "鸡蛋",
  ]));
test("all required ingredients including seasonings", () =>
  assert.deepEqual(missing(tomato, have), []));
test("missing oil must block ready recommendation", () => {
  const p = have.filter((i) => i !== "食用油");
  assert.deepEqual(missing(tomato, p), ["食用油"]);
  assert.equal(recommend([tomato], p).ready.length, 0);
});
test("one and two missing go near, three excluded", () => {
  for (const n of [1, 2, 3])
    assert.equal(
      recommend([tomato], have.slice(n)).near.length,
      n <= 2 ? 1 : 0,
    );
});
test("empty pantry and unrelated food do not manufacture matches", () => {
  assert.deepEqual(recommend(recipes, []), { ready: [], near: [] });
  assert.deepEqual(recommend(recipes, ["龙眼"]), { ready: [], near: [] });
});
test("optional seasoning is not required", () => {
  const r = recipes.find((r) => r.id === "bok-choy");
  assert.deepEqual(
    missing(
      r,
      r.ingredients.filter((i) => !i.optional && !i.water).map((i) => i.name),
    ),
    [],
  );
});
test("stable ordering: fewer missing, then easier, then quicker, then id", () => {
  const rs = [
    { ...tomato, id: "z", minutes: 30 },
    { ...tomato, id: "a", minutes: 10 },
    { ...tomato, id: "b", level: 2, minutes: 5 },
  ];
  assert.deepEqual(
    recommend(rs, have).ready.map((r) => r.id),
    ["a", "z", "b"],
  );
  assert.deepEqual(
    recommend([...rs].reverse(), have).ready.map((r) => r.id),
    ["a", "z", "b"],
  );
});
test("search supports aliases, time, difficulty and no results", () => {
  assert.equal(searchRecipes(recipes, "西红柿").length, 3);
  assert.equal(searchRecipes(recipes, "土豆", 30).length, 0);
  assert.ok(
    searchRecipes(recipes, "", Infinity, 2).some((r) => r.id === "potatoes"),
  );
  assert.equal(searchRecipes(recipes, "不存在").length, 0);
});
test("storage handles corrupt JSON, null and schema mismatch", () => {
  for (const raw of ["bad", "null", "[]", "{}", '{"version":2}'])
    assert.deepEqual(cleanState(raw, recipes), {
      pantry: [],
      favorites: [],
      cooking: null,
      timer: null,
    });
});
test("storage rejects invalid nested state and unknown favorites", () => {
  const s = cleanState(
    JSON.stringify({
      version: 1,
      pantry: [3, "番茄", "西红柿"],
      favorites: ["no", tomato.id],
      cooking: { id: tomato.id, step: 999 },
      timer: { id: tomato.id, step: 0, deadline: "bad" },
    }),
    recipes,
  );
  assert.deepEqual(s.pantry, ["番茄"]);
  assert.deepEqual(s.favorites, [tomato.id]);
  assert.equal(s.cooking, null);
  assert.equal(s.timer, null);
});
test("timer corrects after suspension and never goes negative", () => {
  assert.equal(remaining(10000, 5000), 5);
  assert.equal(remaining(10000, 9999), 1);
  assert.equal(remaining(10000, 12000), 0);
});
test("valid cooking and expired timer retained for acknowledgement", () => {
  const s = cleanState(
    JSON.stringify({
      version: 1,
      cooking: { id: tomato.id, step: 0, checked: [0, -1, 500] },
      timer: { id: tomato.id, step: 0, deadline: Date.now() - 1000 },
    }),
    recipes,
  );
  assert.deepEqual(s.cooking.checked, [0]);
  assert.ok(s.timer);
});
test("all published recipes have complete traceable content", () => {
  assert.equal(new Set(recipes.map((r) => r.id)).size, recipes.length);
  for (const r of recipes) {
    assert.ok(
      r.ingredients.length > 0 &&
        r.steps.length >= 3 &&
        r.servings > 0 &&
        r.minutes > 0,
    );
    assert.match(r.source.url, /^https:\/\//);
    assert.ok(r.source.author && r.source.checked);
    assert.equal(
      new Set(r.ingredients.map((i) => i.name)).size,
      r.ingredients.length,
    );
    for (const st of r.steps)
      assert.ok(
        st.title && st.text && Number.isFinite(st.seconds) && st.seconds >= 0,
      );
    if (r.nutrition)
      assert.ok(r.nutrition.length === 4 && r.nutrition.every((n) => n >= 0));
  }
});
