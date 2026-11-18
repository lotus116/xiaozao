import test from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import { prepareLanguage, localize } from "../src/language.js";
import { searchRecipes } from "../src/logic.js";

test("every Hong Kong display name finds its recipe and common tomato-egg names rank first", async () => {
  globalThis.localStorage = { getItem: () => "zh-HK" };
  await prepareLanguage();
  assert.equal(recipes.length, 300);
  assert.equal(localize("蒜苔炒肉丝"), "蒜薹炒肉絲");
  for (const recipe of recipes) {
    const name = localize(recipe.name);
    assert.equal(searchRecipes(recipes, name)[0]?.id, recipe.id, name);
  }
  for (const name of ["番茄炒蛋", "西红柿炒蛋", "西紅柿炒蛋"])
    assert.equal(searchRecipes(recipes, name)[0]?.id, "tomato-eggs");
});
