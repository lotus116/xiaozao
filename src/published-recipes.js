// This device remembers links to its publications even after an offline copy is removed.
const key = scope => 'xiaozao-publications:' + scope;
export function publications(scope) {
  try {
    const rows = JSON.parse(localStorage.getItem(key(scope)) || '[]');
    return Array.isArray(rows) ? rows.filter(row => typeof row?.id === 'string' && typeof row.name === 'string') : [];
  } catch { return []; }
}
export function rememberPublication(scope, recipe) {
  const rows = publications(scope).filter(row => row.id !== recipe.id);
  rows.unshift({id: recipe.id, name: recipe.name, version: recipe.version});
  localStorage.setItem(key(scope), JSON.stringify(rows));
}
export function forgetPublication(scope, id) {
  localStorage.setItem(key(scope), JSON.stringify(publications(scope).filter(row => row.id !== id)));
}
