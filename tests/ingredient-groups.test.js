import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ingredientGroups,
  ingredientGroup,
  defaultFrequentIngredients,
  moveIngredient,
} from "../src/ingredient-groups.js";
import { catalog, recipes, seasonings } from "../src/recipes.js";
import { cleanState } from "../src/logic.js";
import { handleAndroidBack } from "../src/native.js";

test("every catalog food has exactly one explicit category, including prepared foods", () => {
  for (const name of catalog.filter((n) => !seasonings.includes(n))) {
    assert.equal(
      ingredientGroups.filter((g) => g.names.includes(name)).length,
      1,
      name,
    );
  }
  assert.equal(ingredientGroup("豆豉鲮鱼罐头"), "prepared");
  assert.equal(ingredientGroup("绿豆芽"), "vegetables");
  assert.equal(ingredientGroup("豆腐皮"), "soy");
  assert.equal(ingredientGroup("自定义食材"), "other");
});
test("frequent ingredients migrate, normalize, preserve intentional empty lists and order", () => {
  const load = (value) =>
    cleanState(
      JSON.stringify({ version: 3, pantry: ["鸡蛋"], ...value }),
      recipes,
    );
  assert.deepEqual(load({}).frequentIngredients, defaultFrequentIngredients);
  assert.deepEqual(load({ frequentIngredients: [] }).frequentIngredients, []);
  const s = load({
    frequentIngredients: ["鸡蛋", "西红柿", "番茄", 9, "", "a".repeat(31)],
  });
  assert.deepEqual(s.frequentIngredients, ["鸡蛋", "番茄"]);
  assert.deepEqual(s.pantry, ["鸡蛋"]);
  assert.deepEqual(moveIngredient(s.frequentIngredients, 0, 1), [
    "番茄",
    "鸡蛋",
  ]);
  assert.deepEqual(
    moveIngredient(s.frequentIngredients, -1, 2),
    s.frequentIngredients,
  );
});
test("Android back closes a dialog before leaving, navigates history, and minimizes at home", () => {
  let closed = 0,
    backed = 0,
    minimized = 0,
    dialog = { close: () => closed++ };
  const env = {
    document: { querySelector: () => dialog },
    history: { back: () => backed++ },
    location: { hash: "#search" },
    minimize: () => minimized++,
  };
  handleAndroidBack(true, env);
  assert.equal(closed, 1);
  assert.equal(backed, 0);
  dialog = null;
  handleAndroidBack(true, env);
  assert.equal(backed, 1);
  handleAndroidBack(false, env);
  assert.equal(env.location.hash, "pantry");
  env.location.hash = "#pantry";
  handleAndroidBack(false, env);
  assert.equal(minimized, 1);
});
