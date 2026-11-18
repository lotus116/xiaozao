import { recipeInput, imageInput } from "../shared/community-schema.js";
import { normalize } from "./logic.js";
import { ingredientStatus } from "./ingredient-status.js";
let database;
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const req = indexedDB.open("xiaozao-community", 1);
      req.onblocked = () => reject(new Error("下载库被旧页面占用，请关闭其他页面后重试"));
      req.onupgradeneeded = () => {
        req.result.createObjectStore("downloads", { keyPath: "id" });
        req.result.createObjectStore("drafts", { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error("本机存储不可用，不能保存菜谱"));
    });
  return database;
}
async function transaction(store, mode, operation) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(new Error("保存失败，可能是本机空间不足"));
    tx.onabort = tx.onerror;
  });
}
export const getDownloads = () =>
  transaction("downloads", "readonly", (s) => s.getAll()).then(rows => rows.map(refreshIngredients));
export const putDownload = (r) =>
  transaction("downloads", "readwrite", (s) => s.put(r));
export const deleteDownload = (id) =>
  transaction("downloads", "readwrite", (s) => s.delete(id));
export const getDrafts = () =>
  transaction("drafts", "readonly", (s) => s.getAll());
export const putDraft = (r) =>
  transaction("drafts", "readwrite", (s) => s.put(r));
export const deleteDraft = (key) =>
  transaction("drafts", "readwrite", (s) => s.delete(key));
export const localRecipeId = (r) => `community-${r.serverId}-${r.id}`;
export function toLocalRecipe(remote, imageData, server) {
  const value = recipeInput(remote);
  imageInput(imageData);
  if (
    !/^[a-f0-9-]{36}$/.test(remote.id) ||
    !/^[a-f0-9-]{36}$/.test(remote.serverId)
  )
    throw new Error("菜谱编号不正确");
  return refreshIngredients({
    ...value,
    id: localRecipeId(remote),
    community: {
      remoteId: remote.id,
      serverId: remote.serverId,
      server,
      version: remote.version,
      author: remote.author,
      authorId: remote.authorId,
      attribution: value.attribution,
    },
    imageData,
    nutrition: null,
    vegetable: true,
    timeNote: "作者填写的预计用时；新手可能更久。",
    servingsNote: "按作者提供的份数与用量。",
  });
}

// Refresh legacy downloads in memory; their IDs, photos and progress stay intact.
export function refreshIngredients(recipe) {
  const ingredients = recipe.ingredients.map(i => ({
    ...i, authorName: i.authorName || i.name, name: normalize(i.name),
  }));
  const unknownIngredients = ingredients.filter(i => !i.water && ingredientStatus(i.name).label).map(i => i.name);
  return { ...recipe, ingredients, unknownIngredients };
}
export async function preparePhoto(file) {
  if (
    !file ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error("请选择 15 MB 内的 JPEG、PNG 或 WebP 图片");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.8);
    imageInput(data);
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
