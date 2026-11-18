import { cleanPreferences, defaultPreferences } from "./preferences.js";
import { defaultFrequentIngredients } from "./ingredient-groups.js";
import { seasonings } from "./recipes.js";
import { aliases, normalize } from "./ingredient-names.js";
export { aliases, normalize };
const seasoningNames = new Set(seasonings);
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
  return unique(recipe.ingredients
    .filter((i) => !i.optional && !i.water && !have.has(normalize(i.name)))
    .map((i) => i.name));
}
export const requiredCount = (recipe) =>
  unique(recipe.ingredients.filter((i) => !i.optional && !i.water).map(i => i.name)).length;
export function recommend(recipes, pantry, focusIngredient = "") {
  const available = new Set(unique(pantry));
  const focus = normalize(focusIngredient);
  const rows = [];
  for (const recipe of recipes) {
    const matchedIngredients = unique(recipe.ingredients
      .filter(
        (i) => !i.optional && !i.water && !seasoningNames.has(i.name) && available.has(normalize(i.name)),
      )
      .map((i) => i.name));
    if (!matchedIngredients.length || (focus && !matchedIngredients.some(name => normalize(name) === focus))) continue;
    const absent = missing(recipe, pantry);
    if (absent.length <= 2) {
      rows.push({ ...recipe, missing: absent, matchedIngredients });
    }
  }
  const ready = rows.filter((r) => !r.missing.length);
  const near = rows.filter((r) => r.missing.length);
  const byEase = (a, b) =>
    a.level - b.level || a.minutes - b.minutes || a.id.localeCompare(b.id);
  return {
    ready: ready.sort(byEase),
    near: near.sort((a, b) =>
      a.missing.length - b.missing.length ||
      b.matchedIngredients.length - a.matchedIngredients.length ||
      byEase(a, b),
    ),
  };
}
// Search aliases do not change pantry identities: a steak is not ground beef.
const searchAliases = {
  西红柿: "番茄", 蕃茄: "番茄", 马铃薯: "土豆", 洋芋: "土豆",
  牛扒: "牛排", 豬扒: "猪排", 猪扒: "猪排", 鸡扒: "鸡排",
  青花菜: "西兰花", 西蓝花: "西兰花", 卷心菜: "包菜", 圆白菜: "包菜",
  大蒜: "蒜", 蒜头: "蒜", 香葱: "葱", 小葱: "葱", 芝士: "奶酪",
  意粉: "意大利面", 意面: "意大利面", 番薯: "红薯", 地瓜: "红薯",
};
const searchText = (value) => {
  let text = String(value ?? "").normalize("NFKC").toLowerCase();
  for (const [alias, canonical] of Object.entries(searchAliases)) text = text.replaceAll(alias, canonical);
  return text;
};
const searchableIngredients = new Map();
const ingredientSearchNames = (name) => {
  if (searchableIngredients.has(name)) return searchableIngredients.get(name);
  const families = [];
  if (/牛排|牛里脊|牛腩|牛腱|肥牛|牛肉/.test(name)) families.push("牛肉", "beef");
  if (/猪|五花肉|排骨/.test(name)) families.push("猪肉", "pork");
  if (/鸡胸|鸡腿|鸡翅/.test(name)) families.push("鸡肉", "chicken");
  if (/羊肉|羊排/.test(name)) families.push("羊肉", "lamb");
  const variants = [name, normalize(name), ...Object.keys(aliases).filter(alias => aliases[alias] === normalize(name)), ...families].map(searchText);
  if (searchableIngredients.size < 2000) searchableIngredients.set(name, variants);
  return variants;
};
const ingredientMatches = (ingredient, word) =>
  ingredientSearchNames(ingredient.name).some((name) => name.includes(word)) ||
  (ingredient.authorName && searchText(ingredient.authorName).includes(word));
export function searchRecipes(recipes, query, max = Infinity, level = 0) {
  const words = searchText(query).trim().split(/[\s,，、;；]+/u).filter(Boolean);
  const eligible = recipes.filter((r) => r.minutes <= max && (!level || r.level === level));
  if (!words.length) return eligible;
  return eligible.map((r, index) => {
    const names = [r.name, ...(r.aliases || [])].map(searchText);
    const scores = words.map((word) => {
      if (names.some((name) => name === word)) return 4;
      if (names.some((name) => name.includes(word))) return 3;
      if (r.ingredients.some((i) => !i.optional && ingredientMatches(i, word))) return 2;
      if (r.ingredients.some((i) => i.optional && ingredientMatches(i, word))) return 1;
      return 0;
    });
    return { r, index, matches: scores.every(Boolean), score: scores.reduce((a, b) => a + b, 0) };
  }).filter((row) => row.matches)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.r);
}
export const remaining = (deadline, now = Date.now()) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
export const KEY = "xiaoz ao-v1".replace(" ", "");
export function cleanState(raw, recipes) {
  const empty = {
    pantry: [],
    customFoods: [],
    useFattyBeefForRolls: false,
    frequentIngredients: [...defaultFrequentIngredients],
    favorites: [],
    cooking: null,
    timer: null,
    basket: [],
    meal: null,
    cookView: "overview",
    timerDock: { hidden: false, position: null },
    timerSound: true,
    preferences: defaultPreferences(),
  };
  try {
    const s = JSON.parse(raw);
    if (!s || ![1, 2, 3].includes(s.version)) return empty;
    const ids = new Set(recipes.map((r) => r.id));
    const pantry = unique(Array.isArray(s.pantry) ? s.pantry : [])
      .filter((x) => x.length <= 30)
      .slice(0, 500);
    const favorites = unique(
      Array.isArray(s.favorites) ? s.favorites : [],
    ).filter((x) => ids.has(x) || /^community-[a-f0-9-]{73}$/.test(x));
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
    const knownIds = (value) =>
      [
        ...new Set(
          Array.isArray(value)
            ? value.filter((id) => typeof id === "string" && ids.has(id))
            : [],
        ),
      ].slice(0, recipes.length);
    const basket = knownIds(s.basket);
    const mealIds = knownIds(s.meal?.ids);
    const meal =
      s.version === 3 && cooking && mealIds.includes(cooking.id)
        ? {
            ids: mealIds,
            done: knownIds(s.meal?.done).filter((id) => mealIds.includes(id)),
          }
        : null;
    const position = s.timerDock?.position;
    return {
      pantry,
      useFattyBeefForRolls: s.useFattyBeefForRolls === true,
      customFoods: unique(Array.isArray(s.customFoods) ? s.customFoods : pantry).filter(n => n.length <= 30).slice(-500),
      frequentIngredients: Array.isArray(s.frequentIngredients)
        ? unique(s.frequentIngredients)
            .filter((name) => name.length <= 30)
            .slice(0, 500)
        : [...defaultFrequentIngredients],
      favorites,
      cooking,
      timer,
      timerSound: s.timerSound !== false,
      basket,
      meal,
      cookView: s.cookView === "step" ? "step" : "overview",
      timerDock: {
        hidden: s.timerDock?.hidden === true,
        position:
          position && Number.isFinite(position.x) && Number.isFinite(position.y)
            ? {
                x: Math.min(1, Math.max(0, position.x)),
                y: Math.min(1, Math.max(0, position.y)),
              }
            : null,
      },
      preferences: cleanPreferences(s.preferences),
    };
  } catch {
    return empty;
  }
}
