import { aliases, normalize } from "./logic.js";

const separator = /[、，,；;\n\r\t ]/;

// Suggest just the ingredient at the caret so choosing one never erases a batch.
export function ingredientToken(value, caret = value.length) {
  const position = Math.max(0, Math.min(caret, value.length));
  let start = position;
  let end = position;
  while (start > 0 && !separator.test(value[start - 1])) start--;
  while (end < value.length && !separator.test(value[end])) end++;
  return { start, end, query: value.slice(start, end) };
}

export function ingredientSuggestions(catalog, query) {
  const normalized = normalize(query);
  return catalog.filter((name) => name.includes(normalized) ||
    Object.entries(aliases).some(([alias, target]) => target === name && alias.includes(query)));
}

export function replaceIngredientToken(value, name, caret = value.length) {
  const { start, end } = ingredientToken(value, caret);
  return { value: value.slice(0, start) + name + value.slice(end), caret: start + name.length };
}
