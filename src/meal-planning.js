import { planningById } from "./meal-planning-data.js";

const priorities = { first: -1, normal: 0, last: 1 };
const labels = { first: "建议先做", normal: "保持相对顺序", last: "建议临上桌做" };
const prepKinds = new Set(["marinate", "soak", "rice-cooker", "other"]);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

// Metadata is editorial, not inferred from dish names. If a recipe changes,
// evidence must still match its current stage and exact wording, or fail closed.
export function validEvidence(recipe, evidence) {
  if (!Number.isInteger(evidence?.step) || !nonempty(evidence.quote)) return false;
  const step = recipe.steps?.[evidence.step];
  return Boolean(step && (!evidence.title || step.title === evidence.title) &&
    `${step.title} ${step.text}`.includes(evidence.quote));
}

export function recipePlan(recipe) {
  const metadata = recipe.planning ?? planningById[recipe.id];
  const reviewed = metadata && Object.hasOwn(priorities, metadata.order) &&
    nonempty(metadata.reason) && Array.isArray(metadata.evidence) &&
    metadata.evidence.length > 0 && metadata.evidence.every((e) => validEvidence(recipe, e));
  const prep = Array.isArray(metadata?.prep)
    ? metadata.prep.filter((item) => prepKinds.has(item.kind) && nonempty(item.text) && validEvidence(recipe, item))
    : [];
  return {
    recipe,
    priority: reviewed ? priorities[metadata.order] : 0,
    label: reviewed ? labels[metadata.order] : "保持相对顺序",
    reason: reviewed ? metadata.reason : "这道菜还没有足够明确的先后依据，保持它与其他没有明确先后依据的菜的相对顺序；可按锅具和上桌习惯手动调整。",
    evidence: reviewed ? metadata.evidence : [],
    reviewed: Boolean(reviewed),
    prep,
  };
}

export function estimateMeal(rows) {
  const known = rows.filter((r) => Number.isFinite(r.minutes) && r.minutes > 0);
  const sum = known.reduce((minutes, r) => minutes + r.minutes, 0);
  return {
    // Round upwards only for presentation. No fictional speed-up, overlap,
    // extra prep time or sums of individual step timers.
    minutes: sum ? Math.ceil(sum / 5) * 5 : null,
    missing: rows.length - known.length,
  };
}

export function planMeal(rows) {
  const items = rows.map(recipePlan);
  const ordered = [...items].sort((a, b) => a.priority - b.priority);
  return {
    items: ordered,
    ids: ordered.map((item) => item.recipe.id),
    changed: ordered.some((item, index) => item.recipe.id !== rows[index].id),
    reviewed: items.filter((item) => item.reviewed).length,
    prep: items.flatMap((item) => item.prep.map((prep) => ({ ...prep, recipe: item.recipe }))),
    estimate: estimateMeal(rows),
  };
}

// Only the basket is replaced. A stale preview or undo cannot resurrect a
// removed dish, discard an added dish, or replace a newer manual ordering.
export function applyBasketOrder(state, expectedIds, nextIds) {
  if (!Array.isArray(state.basket) || !Array.isArray(expectedIds) || !Array.isArray(nextIds) ||
    state.basket.length !== expectedIds.length ||
    state.basket.some((id, index) => id !== expectedIds[index]) ||
    new Set(nextIds).size !== nextIds.length ||
    nextIds.length !== expectedIds.length ||
    nextIds.some((id) => !expectedIds.includes(id))) return state;
  return { ...state, basket: [...nextIds] };
}
