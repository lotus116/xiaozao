import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../src/recipes.js";
import { planningById } from "../src/meal-planning-data.js";
import { applyBasketOrder, estimateMeal, planMeal, recipePlan, validEvidence } from "../src/meal-planning.js";

const recipe = (id, order, text = "按包装泡软后煮熟") => ({ id, name: id, minutes: 15, steps: [{ title: "准备", text }], ...(order ? { planning: { order, reason: "明确的编辑依据", evidence: [{ step: 0, title: "准备", quote: "按包装泡软" }] } } : {}) });

test("ordering only uses validated annotations, with stable unknown and tied items", () => {
  const rows = [recipe("last-a", "last"), recipe("unknown-a"), recipe("first-a", "first"), recipe("unknown-b"), recipe("last-b", "last"), recipe("first-b", "first")];
  const before = structuredClone(rows);
  const plan = planMeal(rows);
  assert.deepEqual(plan.ids, ["first-a", "first-b", "unknown-a", "unknown-b", "last-a", "last-b"]);
  assert.equal(plan.reviewed, 4);
  assert.equal(plan.changed, true);
  assert.deepEqual(rows, before);
});

test("dish names, time, category and tools are never treated as order evidence", () => {
  const rows = [recipe("a"), { ...recipe("b"), name: "现炒青菜", category: "dish", minutes: 5 }, { ...recipe("c"), name: "长炖鸡汤", tools: "电饭锅", minutes: 90 }];
  assert.deepEqual(planMeal(rows).ids, ["a", "b", "c"]);
  assert.equal(planMeal(rows).reviewed, 0);
  assert.equal(planMeal(rows).changed, false);
  assert.match(planMeal(rows).items[0].reason, /没有足够明确/);
});

test("missing, changed and malformed evidence falls back without a guessed reason", () => {
  for (const evidence of [undefined, [], [{ step: 10, quote: "按包装泡软" }], [{ step: -1, quote: "按包装泡软" }], [{ step: 0.5, quote: "按包装泡软" }], [{ step: 0, quote: "" }], [{ step: 0, title: "改了阶段", quote: "按包装泡软" }], [{ step: 0, quote: "这句不存在" }]]) {
    const item = recipe("test", "first"); item.planning.evidence = evidence;
    assert.equal(recipePlan(item).reviewed, false);
  }
  for (const order of ["constructor", "early", null]) {
    const item = recipe("test", "first"); item.planning.order = order;
    assert.equal(recipePlan(item).reviewed, false);
  }
});

test("prep is independent from ordering and rejects stale/unsupported items", () => {
  const item = recipe("prep");
  item.planning = { prep: [
    { kind: "soak", text: "按包装泡软", step: 0, quote: "按包装泡软" },
    { kind: "marinate", text: "不能猜腌制", step: 0, quote: "冷藏腌" },
    { kind: "unknown", text: "未知提醒", step: 0, quote: "按包装泡软" },
    { kind: "soak", text: "", step: 0, quote: "按包装泡软" },
  ] };
  const plan = planMeal([item]);
  assert.equal(plan.reviewed, 0);
  assert.equal(plan.prep.length, 1);
  assert.equal(plan.prep[0].recipe.id, "prep");
  assert.equal(plan.changed, false);
});

test("estimate sums each recipe once, never step timers or prep, and reports omissions", () => {
  const rows = [{ ...recipe("a"), minutes: 12, steps: [{ seconds: 600 }] }, { ...recipe("b"), minutes: 25, planning: { prep: [{ minutes: 10 }] } }];
  assert.deepEqual(estimateMeal(rows), { minutes: 40, missing: 0 });
  assert.deepEqual(estimateMeal([...rows, { minutes: NaN }, { minutes: -4 }, { minutes: "20" }, {}]), { minutes: 40, missing: 4 });
  assert.deepEqual(estimateMeal([]), { minutes: null, missing: 0 });
  assert.equal(planMeal([recipe("a", "last"), recipe("b", "first")]).estimate.minutes, 30);
});

test("every shipped annotation is grounded in an existing current recipe step", () => {
  for (const [id, data] of Object.entries(planningById)) {
    const row = recipes.find((r) => r.id === id);
    assert.ok(row, id);
    for (const evidence of [...(data.evidence || []), ...(data.prep || [])]) {
      assert.ok(validEvidence(row, evidence), `${id}: ${evidence.title} / ${evidence.quote}`);
    }
    if (data.order) assert.equal(recipePlan(row).reviewed, true, id);
  }
});

test("real meal exposes marination, soaking and rice-cooker preparation without duplicated time", () => {
  const ids = ["easy-shiitake-steamed-chicken", "easy-kelp-salad", "easy-chicken-mushroom-rice"];
  const rows = ids.map((id) => recipes.find((r) => r.id === id));
  const plan = planMeal(rows);
  assert.deepEqual(new Set(plan.prep.map((p) => p.kind)), new Set(["marinate", "soak", "rice-cooker"]));
  assert.equal(plan.estimate.minutes, 140);
  assert.match(plan.prep.find((p) => p.kind === "rice-cooker").text, /第 1–2 步/);
  assert.match(plan.prep.find((p) => p.kind === "soak").text, /不含泡发/);
});

test("adoption and undo touch only basket, not pantry, favorites, timers, meal or progress", () => {
  const state = { basket: ["a", "b"], meal: { ids: ["b", "a"], done: ["b"] }, cooking: { id: "a", step: 2 }, timer: { id: "a", deadline: 123 }, pantry: ["盐"], favorites: ["b"], preferences: { allergens: ["蛋类"] } };
  const before = structuredClone(state);
  const applied = applyBasketOrder(state, ["a", "b"], ["b", "a"]);
  assert.deepEqual(applied, { ...state, basket: ["b", "a"] });
  assert.equal(applied.meal, state.meal);
  assert.equal(applied.cooking, state.cooking);
  assert.equal(applied.timer, state.timer);
  assert.deepEqual(state, before);
  assert.deepEqual(applyBasketOrder(applied, ["b", "a"], ["a", "b"]), before);
});

test("stale and invalid adoption/undo cannot add, drop or resurrect dishes", () => {
  const state = { basket: ["a", "b"] };
  for (const [expected, next] of [[[], []], [["b", "a"], ["a", "b"]], [["a", "b"], ["b", "c"]], [["a", "b"], ["a", "a"]], [["a", "b"], ["a"]]])
    assert.equal(applyBasketOrder(state, expected, next), state);
  const manual = { basket: ["c", "b", "a"] };
  assert.equal(applyBasketOrder(manual, ["b", "a", "c"], ["a", "b", "c"]), manual);
});
