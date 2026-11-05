import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import {
  basketRecipes,
  canStartMeal,
  mealIngredients,
  mealShoppingText,
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

test("shopping text keeps separate recipe amounts and excludes pantry, optional and water items", () => {
  const rows = [
    {
      name: "甲",
      ingredients: [
        { name: "番茄", amount: "2 个" },
        { name: "盐", amount: "1 克" },
        { name: "水", amount: "500 毫升", water: true },
        { name: "葱", amount: "1 根", optional: true },
      ],
    },
    {
      name: "乙",
      ingredients: [
        { name: "盐", amount: "少许" },
        { name: "食用油", amount: "10 毫升" },
      ],
    },
  ];
  assert.equal(
    mealShoppingText(rows, ["西红柿", "植物油"], defaultPreferences()),
    [
      "小灶 · 采购清单",
      "清单未记的必需食材，请先核对家中用量。",
      "",
      "盐",
      "  甲：1 克",
      "  乙：少许",
    ].join("\n"),
  );
  const ingredients = mealIngredients(rows, ["西红柿", "植物油"]);
  assert.deepEqual(ingredients.filter((i) => i.missing).map((i) => i.name), ["盐"]);
  assert.equal(ingredients.find((i) => i.name === "水").missing, false);
});
test("shopping text is empty when the basket or missing list is empty", () => {
  const preferences = defaultPreferences();
  assert.equal(mealShoppingText([], [], preferences), "");
  const rows = basketRecipes(["tomato-eggs", "steamed-eggs"], recipes);
  assert.equal(
    mealShoppingText(rows, ["番茄", "鸡蛋", "食用油", "盐"], preferences),
    "",
  );
});
test("shopping text cannot export a basket excluded by allergies or hidden dislikes", () => {
  const rows = basketRecipes(["steamed-eggs", "cn-steamed-pumpkin"], recipes);
  // Sesame only appears in optional sesame oil, but still blocks the recipe.
  assert.equal(
    mealShoppingText(rows, [], { ...defaultPreferences(), allergens: ["芝麻"] }),
    "",
  );
  assert.equal(
    mealShoppingText(rows, [], { ...defaultPreferences(), avoid: ["南瓜"] }),
    "",
  );
  assert.match(
    mealShoppingText(rows, [], {
      ...defaultPreferences(),
      avoid: ["南瓜"],
      avoidMode: "warn",
    }),
    /南瓜\n  清蒸南瓜：300 克/,
  );
});
test("shopping quantities follow basket order after a dish is removed or reordered", () => {
  const preferences = defaultPreferences();
  const pantry = ["番茄", "食用油", "盐"];
  assert.match(
    mealShoppingText(basketRecipes(["steamed-eggs", "tomato-eggs"], recipes), pantry, preferences),
    /鸡蛋\n  家常蒸蛋：2 个\n  番茄炒鸡蛋：3 个/,
  );
  const updated = mealShoppingText(basketRecipes(["steamed-eggs"], recipes), pantry, preferences);
  assert.match(updated, /鸡蛋\n  家常蒸蛋：2 个/);
  assert.doesNotMatch(updated, /番茄炒鸡蛋/);
});
