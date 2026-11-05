import { cleanPreferences, defaultPreferences } from "./preferences.js";
export const aliases = {
  西红柿: "番茄",
  蕃茄: "番茄",
  马铃薯: "土豆",
  洋芋: "土豆",
  小葱: "葱",
  香葱: "葱",
  大蒜: "蒜",
  蒜头: "蒜",
  食盐: "盐",
  白糖: "糖",
  植物油: "食用油",
  油: "食用油",
  麻油: "香油",
  芝麻油: "香油",
  绍兴酒: "料酒",
  上海青: "小白菜",
  青江菜: "小白菜",
  生粉: "玉米淀粉",
  卷心菜: "包菜",
  圆白菜: "包菜",
  青花菜: "西兰花",
  米饭: "熟米饭",
  北豆腐: "老豆腐",
  南豆腐: "嫩豆腐",
};
export const normalize = (s) => aliases[String(s).trim()] || String(s).trim();
export const unique = (a) => [
  ...new Set(
    a
      .filter((x) => typeof x === "string")
      .map(normalize)
      .filter(Boolean),
  ),
];
export function missing(recipe, pantry) {
  const have = new Set(unique(pantry));
  return recipe.ingredients
    .filter((i) => !i.optional && !i.water && !have.has(i.name))
    .map((i) => i.name);
}
export function recommend(recipes, pantry) {
  if (!pantry.length) return { ready: [], near: [] };
  const available = new Set(unique(pantry));
  const rows = recipes
    .filter((r) =>
      r.ingredients.some(
        (i) => !i.optional && !i.water && available.has(i.name),
      ),
    )
    .map((r) => ({ ...r, missing: missing(r, pantry) }))
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length ||
        a.level - b.level ||
        a.minutes - b.minutes ||
        a.id.localeCompare(b.id),
    );
  return {
    ready: rows.filter((r) => !r.missing.length),
    near: rows.filter((r) => r.missing.length > 0 && r.missing.length <= 2),
  };
}
export function searchRecipes(recipes, query, max = Infinity, level = 0) {
  const q = normalize(query);
  return recipes.filter(
    (r) =>
      (r.name.includes(q) || r.ingredients.some((i) => i.name.includes(q))) &&
      r.minutes <= max &&
      (!level || r.level === level),
  );
}
export const remaining = (deadline, now = Date.now()) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
export const KEY = "xiaoz ao-v1".replace(" ", "");
export function cleanState(raw, recipes) {
  const empty = {
    pantry: [],
    favorites: [],
    cooking: null,
    timer: null,
    preferences: defaultPreferences(),
  };
  try {
    const s = JSON.parse(raw);
    if (!s || ![1, 2].includes(s.version)) return empty;
    const ids = new Set(recipes.map((r) => r.id));
    const pantry = unique(Array.isArray(s.pantry) ? s.pantry : [])
      .filter((x) => x.length <= 30)
      .slice(0, 200);
    const favorites = unique(
      Array.isArray(s.favorites) ? s.favorites : [],
    ).filter((x) => ids.has(x));
    let cooking = null;
    const c = s.cooking,
      r = recipes.find((r) => r.id === c?.id);
    if (
      r &&
      s.version >= (r.stateVersion || 1) &&
      Number.isInteger(c.step) &&
      c.step >= -1 &&
      c.step <= r.steps.length
    )
      cooking = {
        id: c.id,
        step: c.step,
        checked: Array.isArray(c.checked)
          ? c.checked.filter(
              (x) => Number.isInteger(x) && x >= 0 && x < r.ingredients.length,
            )
          : [],
      };
    const t = s.timer;
    const tr = recipes.find((r) => r.id === t?.id);
    const timer =
      t &&
      (t.id === null ||
        (tr &&
          s.version >= (tr.stateVersion || 1) &&
          Number.isInteger(t.step) &&
          tr.steps[t.step]?.seconds)) &&
      Number.isFinite(t.deadline) &&
      t.deadline > 0 &&
      t.deadline < Date.now() + 86400000
        ? {
            id: t.id,
            step: t.step,
            deadline: t.deadline,
            ...(typeof t.label === "string"
              ? { label: t.label.slice(0, 30) }
              : {}),
            ...(Number.isFinite(t.paused) && t.paused >= 0 && t.paused <= 86400
              ? { paused: t.paused }
              : {}),
          }
        : null;
    return {
      pantry,
      favorites,
      cooking,
      timer,
      preferences: cleanPreferences(s.preferences),
    };
  } catch {
    return empty;
  }
}
