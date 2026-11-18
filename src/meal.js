import { allowedRecipe } from "./preferences.js";
import { missing, normalize } from "./logic.js";
export function basketRecipes(ids, recipes) {
  const wanted = Array.isArray(ids) ? [...new Set(ids)] : [];
  return wanted.map((id) => recipes.find((r) => r.id === id)).filter(Boolean);
}
export function canStartMeal(ids, recipes, preferences) {
  const rows = basketRecipes(ids, recipes);
  return rows.length > 0 && rows.every((r) => allowedRecipe(r, preferences));
}
export function mealIngredients(rows, pantry) {
  const grouped = new Map();
  for (const r of rows) {
    const absent = new Set(missing(r, pantry));
    for (const i of r.ingredients) {
      if (i.optional) continue;
      const name = normalize(i.name);
      const item = grouped.get(name) || {
        name,
        water: i.water,
        missing: absent.has(name),
        uses: [],
      };
      item.uses.push({ recipe: r.name, amount: i.amount, ...(r.community && { authored: true }) });
      grouped.set(name, item);
    }
  }
  return [...grouped.values()];
}
// Keep recipe quantities separate: pantry entries track kinds, not amounts.
// A restricted basket must be resolved before exporting a shopping list.
export function mealShoppingText(rows, pantry, preferences, translate = text => text) {
  if (!rows.length || rows.some((r) => !allowedRecipe(r, preferences)))
    return "";
  const needed = mealIngredients(rows, pantry).filter(
    (i) => i.missing && !i.water,
  );
  if (!needed.length) return "";
  return [
    translate("小灶 · 采购清单"),
    translate("清单未记的必需食材，请先核对家中用量。"),
    ...needed.map((i) =>
      ["", translate(i.name), ...i.uses.map((u) => u.authored ? `  ${u.recipe}：${u.amount}` : translate(`  ${u.recipe}：${u.amount}`))].join("\n"),
    ),
  ].join("\n");
}
export function nextMealRecipe(meal, recipes, preferences) {
  return basketRecipes(meal?.ids, recipes).find(
    (r) => !meal.done.includes(r.id) && allowedRecipe(r, preferences),
  );
}

export function resumeMealRecipe(state, recipes) {
  if (!state.meal) return undefined;
  const current = recipes.find((r) => r.id === state.cooking?.id);
  if (current && state.meal.ids.includes(current.id) &&
      !state.meal.done.includes(current.id) &&
      state.cooking.step < current.steps.length && allowedRecipe(current, state.preferences)) return current;
  return nextMealRecipe(state.meal, recipes, state.preferences);
}

// The active dish lives in cooking; keep bookmarks for the other dishes at each switch.
export function openMealDish(state, recipe, initialStep) {
  const meal = state.meal;
  const bookmarks = { ...meal.bookmarks };
  const previous = state.cooking;
  if (previous && meal.ids.includes(previous.id) && !meal.done.includes(previous.id))
    bookmarks[previous.id] = previous.step;
  const step = meal.done.includes(recipe.id) ? recipe.steps.length : bookmarks[recipe.id] ?? initialStep;
  delete bookmarks[recipe.id];
  return { ...state, meal: { ...meal, bookmarks }, cooking: { id: recipe.id, step } };
}

export function restoreMealRecipe(state, recipe) {
  if (!state.meal?.done.includes(recipe.id)) return state;
  const meal = { ...state.meal, done: state.meal.done.filter(id => id !== recipe.id) };
  if (meal.bookmarks) {
    meal.bookmarks = { ...meal.bookmarks };
    delete meal.bookmarks[recipe.id];
  }
  return {
    ...state,
    meal,
    cooking: state.cooking?.id === recipe.id
      ? { id: recipe.id, step: 0 } : state.cooking,
  };
}
