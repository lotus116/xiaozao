import { catalog, seasonings } from "./recipes.js";
import { normalize, unique } from "./logic.js";

const known = new Set(unique([...catalog, ...seasonings]));
const specifics = {
  牛肉卷: ["肥牛片"],
  牛肉: ["牛排", "牛里脊", "牛腩", "牛腱", "肥牛片", "牛肉末"],
  猪肉: ["猪瘦肉", "猪里脊", "五花肉", "猪肉末", "排骨"],
  鸡肉: ["鸡胸肉", "鸡腿肉", "鸡翅"],
  鱼: ["鲈鱼", "桂鱼", "鲤鱼", "鳊鱼", "三文鱼", "白肉鱼柳"],
  豆腐: ["嫩豆腐", "老豆腐"],
};
export function ingredientStatus(name, downloaded) {
  const canonical = normalize(name);

  const choices = Object.hasOwn(specifics, canonical) ? specifics[canonical].filter(n => known.has(n)) : [];
  return { label: known.has(canonical) || downloaded?.has(canonical) ? "" : choices.length ? "需细分" : "自定义", choices };
}
export function refineIngredient(pantry, name, choice) {
  if (!pantry.includes(name) || !ingredientStatus(name).choices.includes(choice)) return pantry;
  return unique(pantry.map((n) => n === name ? choice : n));
}

// Only the cook can identify ambiguous rolls. Keep the author's name for display.
export function withPantryAssociation(recipe) {
  if (!recipe.ingredients.some(i => i.name === "牛肉卷")) return recipe;
  const ingredients = recipe.ingredients.map(i => i.name === "牛肉卷"
    ? { ...i, authorName: i.authorName || i.name, name: "肥牛片" }
    : i);
  return { ...recipe, ingredients };
}
