import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import {
  basketRecipes,
  canStartMeal,
  mealIngredients,
  nextMealRecipe,
} from "../src/meal.js";
import { cleanState } from "../src/logic.js";
import { defaultPreferences } from "../src/preferences.js";
test("basket keeps order, deduplicates and ignores unknown recipes", () => {
  assert.deepEqual(
    basketRecipes(
      ["tomato-eggs", "steamed-eggs", "tomato-eggs", "missing"],
      recipes,
    ).map((r) => r.id),
    ["tomato-eggs", "steamed-eggs"],
  );
});
test("meal cannot begin with an allergen even if its ingredient is optional", () => {
  assert.equal(canStartMeal([], recipes, defaultPreferences()), false);
  assert.equal(
    canStartMeal(["tomato-eggs"], recipes, defaultPreferences()),
    true,
  );
  assert.equal(
    canStartMeal(["tomato-eggs"], recipes, {
      ...defaultPreferences(),
      allergens: ["蛋类"],
    }),
    false,
  );
});
test("combined preparation preserves each dish quantity rather than summing incompatible units", () => {
  const rows = [
    {
      name: "甲",
      ingredients: [
        { name: "盐", amount: "1 克" },
        { name: "葱", amount: "1 根", optional: true },
      ],
    },
    { name: "乙", ingredients: [{ name: "盐", amount: "少许" }] },
  ];
  const result = mealIngredients(rows, ["盐"]);
  assert.equal(result.length, 1);
  assert.equal(result[0].missing, false);
  assert.deepEqual(result[0].uses, [
    { recipe: "甲", amount: "1 克" },
    { recipe: "乙", amount: "少许" },
  ]);
});
test("next meal dish skips done items and applies current dietary restrictions", () => {
  const meal = {
    ids: ["tomato-eggs", "cn-steamed-pumpkin", "steamed-eggs"],
    done: ["tomato-eggs"],
  };
  assert.equal(
    nextMealRecipe(meal, recipes, defaultPreferences()).id,
    "cn-steamed-pumpkin",
  );
  meal.done.push("cn-steamed-pumpkin");
  assert.equal(
    nextMealRecipe(meal, recipes, {
      ...defaultPreferences(),
      allergens: ["蛋类"],
    }),
    undefined,
  );
});
test("meal progress, icon position and view preference survive validation", () => {
  const state = cleanState(
    JSON.stringify({
      version: 3,
      basket: ["tomato-eggs", "tomato-eggs", "bad"],
      meal: {
        ids: ["tomato-eggs", "steamed-eggs"],
        done: ["bad", "tomato-eggs"],
      },
      cooking: { id: "steamed-eggs", step: 0 },
      timerDock: { hidden: true, position: { x: 2, y: -3 } },
      cookView: "step",
    }),
    recipes,
  );
  assert.deepEqual(state.basket, ["tomato-eggs"]);
  assert.deepEqual(state.meal.done, ["tomato-eggs"]);
  assert.deepEqual(state.timerDock, { hidden: true, position: { x: 1, y: 0 } });
  assert.equal(state.cookView, "step");
  const corrupt = cleanState(
    JSON.stringify({
      version: 3,
      meal: { ids: 42, done: null },
      timerDock: { position: { x: "a", y: 4 } },
    }),
    recipes,
  );
  assert.equal(corrupt.meal, null);
  assert.equal(corrupt.timerDock.position, null);
});
