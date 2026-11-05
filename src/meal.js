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
  for (const r of rows)
    for (const i of r.ingredients) {
      if (i.optional) continue;
      const item = grouped.get(i.name) || {
        name: i.name,
        water: i.water,
        missing: missing(r, pantry).includes(i.name),
        uses: [],
      };
      item.uses.push({ recipe: r.name, amount: i.amount });
      grouped.set(i.name, item);
    }
  return [...grouped.values()];
}
export function nextMealRecipe(meal, recipes, preferences) {
  return basketRecipes(meal?.ids, recipes).find(
    (r) => !meal.done.includes(r.id) && allowedRecipe(r, preferences),
  );
}
