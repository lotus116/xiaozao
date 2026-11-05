import { normalize, unique } from "./logic.js";

// A pasted shopping line is split into foods, never treated as one ingredient.
export function parsePantryInput(input) {
  const names = unique(String(input).split(/[、，,；;\n\r\t ]+/));
  return {
    names: names.filter((name) => name.length <= 30),
    rejected: names.filter((name) => name.length > 30),
  };
}

export function addPantryInput(pantry, input) {
  const parsed = parsePantryInput(input);
  const current = unique(pantry);
  const fresh = parsed.names.filter((name) => !current.includes(normalize(name)));
  const added = fresh.slice(0, Math.max(0, 200 - current.length));
  return {
    pantry: [...current, ...added],
    added,
    duplicate: parsed.names.filter((name) => current.includes(name)),
    rejected: [...parsed.rejected, ...fresh.slice(added.length)],
  };
}
