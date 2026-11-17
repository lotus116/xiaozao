import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import { stepGuidance } from "../src/step-guidance.js";

test("each catalog step has guidance keyed by its current title", () => {
  assert.deepEqual(Object.keys(stepGuidance).sort(), recipes.map((r) => r.id).sort());
  for (const recipe of recipes) {
    const guides = stepGuidance[recipe.id];
    assert.deepEqual(Object.keys(guides), recipe.steps.map((step) => step.title), recipe.id);
    for (const guide of Object.values(guides)) {
      assert.ok(Object.keys(guide).length > 0);
      for (const [field, value] of Object.entries(guide)) {
        assert.ok(["amount", "heat", "cue"].includes(field));
        assert.ok(typeof value === "string" && value.trim());
      }
    }
  }
});

test("guidance repeats the step's temperatures without introducing new ones", () => {
  const temperatures = (text) => new Set(
    [...text.matchAll(/\d+\s*°C/g)].map(([value]) => value.replace(/\s/g, "")),
  );
  for (const { id, steps } of recipes) {
    for (const { title, text } of steps) {
      const guide = stepGuidance[id][title];
      assert.deepEqual(temperatures(Object.values(guide).join(" ")), temperatures(text), `${id}: ${title}`);
    }
  }
});
