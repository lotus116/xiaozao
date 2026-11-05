import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePantryInput, addPantryInput } from "../src/pantry-input.js";

test("batch pantry input supports Chinese punctuation, spaces, aliases and deduplication", () => {
  assert.deepEqual(parsePantryInput("西红柿、鸡蛋，土豆; 马铃薯\n油 盐").names, ["番茄", "鸡蛋", "土豆", "食用油", "盐"]);
  const result = addPantryInput(["盐", "番茄"], "鸡蛋、番茄，西红柿");
  assert.deepEqual(result.pantry, ["盐", "番茄", "鸡蛋"]);
  assert.deepEqual(result.added, ["鸡蛋"]);
  assert.deepEqual(result.duplicate, ["番茄"]);
});

test("invalid or oversized batches never produce a combined fake food or exceed saved limits", () => {
  assert.deepEqual(parsePantryInput(" 、,； ").names, []);
  const long = "菜".repeat(31);
  assert.deepEqual(parsePantryInput(long + "、鸡蛋"), { names: ["鸡蛋"], rejected: [long] });
  const foods = Array.from({ length: 199 }, (_, i) => "食材" + i);
  const result = addPantryInput(foods, "鸡蛋、番茄");
  assert.equal(result.pantry.length, 200);
  assert.deepEqual(result.added, ["鸡蛋"]);
  assert.deepEqual(result.rejected, ["番茄"]);
});
