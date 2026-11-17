// The server and client share limits; the server always validates independently.
export const IMAGE_LIMIT = 1500000;
export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function text(value, label, max = 200, optional = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!optional && !value.trim())
  )
    fail(`${label}不能为空，且最多 ${max} 字`);
  return value.trim();
}
const number = (v, label, min, max) => {
  if (!Number.isInteger(v) || v < min || v > max)
    fail(`${label}需为 ${min}–${max} 的整数`);
  return v;
};
export function recipeInput(v) {
  if (
    !v ||
    !Array.isArray(v.ingredients) ||
    v.ingredients.length < 1 ||
    v.ingredients.length > 50 ||
    !Array.isArray(v.steps) ||
    v.steps.length < 1 ||
    v.steps.length > 40
  )
    fail("请填写 1–50 项食材、1–40 个步骤");
  if (!["dish", "staple", "soup"].includes(v.category)) fail("请选择分类");
  return {
    name: text(v.name, "菜名", 60),
    description: text(v.description ?? "", "简介", 500, true),
    servings: number(v.servings, "份数", 1, 30),
    minutes: number(v.minutes, "耗时", 1, 1440),
    category: v.category,
    level: number(v.level ?? 1, "难度", 1, 2),
    tools: text(v.tools ?? "", "厨具", 200, true),
    attribution: text(v.attribution, "原创／来源声明", 500),
    ingredients: v.ingredients.map((i) => ({
      name: text(i?.name, "食材名称", 30),
      amount: text(i?.amount, "食材用量", 100),
      optional: i.optional === true,
      water: i.name?.trim() === "水",
    })),
    steps: v.steps.map((s) => ({
      title: text(s?.title, "步骤标题", 60),
      text: text(s?.text, "操作", 1500),
      amount: text(s?.amount, "本步用量", 300),
      heat: text(s?.heat ?? "", "火力", 100, true),
      cue: text(s?.cue ?? "", "状态", 300, true),
      seconds: number(s?.seconds ?? 0, "计时秒数", 0, 86400),
    })),
  };
}
export function imageInput(value) {
  if (
    typeof value !== "string" ||
    value.length > IMAGE_LIMIT * 1.4 ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
  )
    fail("请使用 1.5 MB 以内的 JPEG、PNG 或 WebP 图片");
  return value;
}
export function backupInput(v) {
  const strings = (a, label, n, len) => {
    if (!Array.isArray(a) || a.length > n) fail(`${label}格式不正确`);
    return [...new Set(a.map((s) => text(s, label, len)))];
  };
  if (!v || v.version !== 1) fail("不支持的备份格式");
  return {
    version: 1,
    pantry: strings(v.pantry, "食材", 500, 30),
    frequentIngredients: strings(v.frequentIngredients, "常用食材", 500, 30),
    favorites: strings(v.favorites, "收藏", 1000, 120),
    preferences: {
      allergens: strings(v.preferences?.allergens, "过敏设置", 20, 30),
      avoid: strings(v.preferences?.avoid, "忌口", 50, 30),
      avoidMode: v.preferences?.avoidMode === "warn" ? "warn" : "hide",
    },
  };
}
