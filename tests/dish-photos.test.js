import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { recipes } from "../src/recipes.js";
import photos from "../src/dish-photos.json" with { type: "json" };

test("only attributed recipe photos ship, with separate mobile thumbnail and detail budgets", () => {
  const folder = new URL("../public/dishes/", import.meta.url);
  const files = new Set(readdirSync(folder));
  let total = 0;
  for (const [id, info] of Object.entries(photos)) {
    assert.ok(recipes.some((recipe) => recipe.id === id), id);
    assert.ok(info.title && info.credit && info.license && info.source.startsWith("https:") && info.licenseUrl.startsWith("https:"));
    for (const [size, cap] of [["thumb", 16], ["view", 80]]) {
      const path = id + "-" + size + ".webp";
      const bytes = readFileSync(new URL(path, folder));
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
      assert.ok(bytes.length <= cap * 1024, path);
      assert.ok(files.delete(path), path);
      total += bytes.length;
    }
  }
  assert.equal(files.size, 0, "no unused originals in the app");
  assert.ok(total < 3 * 1024 * 1024, "photo collection exceeds the mobile budget");
});
