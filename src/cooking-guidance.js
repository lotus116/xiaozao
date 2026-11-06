// Small, ingredient-aware reminders, not substitutions or a doneness guarantee.
export function cookingReminders(recipe) {
  const names = new Set(recipe.ingredients.map((i) => i.name));
  const reminders = [];
  if (["鸡胸肉", "鸡腿肉", "鸡翅", "猪瘦肉", "猪肉末", "牛肉末", "排骨", "虾", "虾仁", "鲈鱼", "昂刺鱼"].some((name) => names.has(name)))
    reminders.push({ key: "raw", text: "生肉、鱼虾和即食食材分开处理；接触生食后洗手、清洗刀板，装熟食用干净盘。" });
  if (names.has("熟米饭"))
    reminders.push({ key: "rice", text: "新煮米饭可直接用；剩饭只用妥善冷藏的熟米饭，不用久放室温的剩饭；翻散并彻底热透，不靠再次加热挽救保存不当的饭。" });
  if (names.has("玉米淀粉") || names.has("淀粉"))
    reminders.push({ key: "starch", text: "需要勾芡时，淀粉先用凉水调开；下锅前再搅匀，少量加入并煮开。可省的淀粉不用特意准备。" });
  return reminders;
}
export function timerLabel(timer, recipes) {
  if (!timer) return "";
  const recipe = recipes.find((r) => r.id === timer.id);
  return timer.label || (recipe ? `${recipe.name} · ${recipe.steps[timer.step]?.title || "步骤计时"}` : "厨房计时");
}
export function formatTimer(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
