import { allowedRecipe } from "./preferences.js";
import { missing } from "./logic.js";
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
      const item = grouped.get(i.name) || {
        name: i.name,
        water: i.water,
        missing: absent.has(i.name),
        uses: [],
      };
      item.uses.push({ recipe: r.name, amount: i.amount });
      grouped.set(i.name, item);
    }
  }
  return [...grouped.values()];
}
// Keep recipe quantities separate: pantry entries track kinds, not amounts.
// A restricted basket must be resolved before exporting a shopping list.
export function mealShoppingText(rows, pantry, preferences) {
  if (!rows.length || rows.some((r) => !allowedRecipe(r, preferences)))
    return "";
  const needed = mealIngredients(rows, pantry).filter(
    (i) => i.missing && !i.water,
  );
  if (!needed.length) return "";
  return [
    "小灶 · 采购清单",
    "清单未记的必需食材，请先核对家中用量。",
    ...needed.map((i) =>
      ["", i.name, ...i.uses.map((u) => `  ${u.recipe}：${u.amount}`)].join("\n"),
    ),
  ].join("\n");
}
export function nextMealRecipe(meal, recipes, preferences) {
  return basketRecipes(meal?.ids, recipes).find(
    (r) => !meal.done.includes(r.id) && allowedRecipe(r, preferences),
  );
}
