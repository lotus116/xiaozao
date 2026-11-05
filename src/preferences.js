export const allergenOptions = [
  "蛋类",
  "奶类",
  "大豆",
  "含麸质谷物",
  "花生",
  "坚果",
  "甲壳类",
  "鱼类",
  "贝类",
  "芝麻",
];
export const defaultPreferences = () => ({
  allergens: [],
  avoid: [],
  avoidMode: "hide",
});
export function cleanPreferences(p) {
  const strings = (a) =>
    Array.isArray(a)
      ? [
          ...new Set(
            a
              .filter(
                (x) => typeof x === "string" && x.trim() && x.length <= 30,
              )
              .map((x) => x.trim()),
          ),
        ].slice(0, 50)
      : [];
  return {
    allergens: strings(p?.allergens).filter((x) => allergenOptions.includes(x)),
    avoid: strings(p?.avoid),
    avoidMode: p?.avoidMode === "warn" ? "warn" : "hide",
  };
}
const patterns = {
  蛋类: /蛋|蛋黄酱|鸡精/,
  奶类: /奶|乳|黄油|奶酪/,
  大豆: /鸡精|豆腐|豆干|香干|豆皮|腐竹|豆芽|毛豆|黄豆|豆浆|豆瓣|豆豉|生抽|老抽|酱油|豉油|蚝油|甜面酱|腐乳/,
  含麸质谷物:
    /面条|面粉|炒面|馒头|面包|面筋|生抽|老抽|酱油|豉油|蚝油|豆瓣|甜面酱|料酒/,
  花生: /花生|沙茶/,
  坚果: /核桃|杏仁|腰果|榛子|松子|坚果/,
  甲壳类: /虾|蟹|虾酱|沙茶/,
  鱼类: /鱼|鱼露|沙茶/,
  贝类: /蚝油|牡蛎|蛤|蚬|扇贝|干贝|鲍鱼|贻贝/,
  芝麻: /芝麻|香油|麻油|麻酱/,
};
export function dietaryWarnings(r, p) {
  const names = r.ingredients.map((i) => i.name);
  return [
    ...p.allergens
      .filter((a) => names.some((n) => patterns[a]?.test(n)))
      .map((a) => "过敏设置：" + a),
    ...p.avoid
      .filter((a) => names.some((n) => n.includes(a)))
      .map((a) => "忌口：" + a),
  ];
}
export function allowedRecipe(r, p) {
  const warnings = dietaryWarnings(r, p);
  return (
    !warnings.some((w) => w.startsWith("过敏")) &&
    !(p.avoidMode === "hide" && warnings.length)
  );
}
export const categories = { dish: "菜肴", staple: "主食", soup: "汤羹" };
export function categoryOf(r) {
  if (r.category) return r.category;
  if (
    [
      "fried-rice",
      "scallion-noodles",
      "soy-eggs",
      "tomato-noodles",
      "crispy-noodles",
      "soy-rice",
      "bacon-rice",
      "beef-noodles",
      "hot-noodles",
    ].includes(r.id)
  )
    return "staple";
  if (["tomato-soup", "egg-soup"].includes(r.id)) return "soup";
  return "dish";
}
