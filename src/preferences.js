import { normalize } from "./ingredient-names.js";
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
  蛋类: /蛋|蛋黄酱|鸡精|方便面|手抓饼|面包|咖喱块/,
  奶类: /奶|乳|黄油|芝士|面包|咖喱块/,
  大豆: /鸡精|豆腐|豆干|香干|豆皮|腐竹|豆芽|毛豆|黄豆|豆浆|豆瓣|豆豉|生抽|老抽|酱油|豉油|蚝油|甜面酱|腐乳/,
  含麸质谷物:
    /面条|挂面|面粉|炒面|意大利面|通心粉|宽面|方便面|荞麦面|千层面|古斯米|卷饼|手抓饼|馒头|面包|面筋|饺子|馄饨|澄粉|小麦|大麦|黑麦|燕麦|生抽|老抽|酱油|豉油|蚝油|豆瓣|甜面酱|料酒|啤酒|咖喱块|韩式辣酱|柱侯酱|伍斯特酱/,
  花生: /花生|沙茶/,
  坚果: /核桃|杏仁|腰果|榛子|松子|坚果/,
  甲壳类: /海米|虾|蟹|虾酱|沙茶/,
  鱼类: /鱼|鳝|鱼露|沙茶/,
  贝类: /鱿鱼|墨鱼|章鱼|蚝油|牡蛎|蛤|蚬|蛏|扇贝|干贝|鲍鱼|贻贝/,
  芝麻: /芝麻|香油|麻油|麻酱/,
};
// Prepared sauces may contain multiple allergens. This is a conservative
// label check, while crab-flavoured mushrooms contain no actual shellfish.
const packaged = {
  柱侯酱: ["大豆", "含麸质谷物"], 南乳: ["大豆"],
  咖喱块: ["奶类", "大豆", "含麸质谷物"],
  熟叉烧: ["大豆", "含麸质谷物"], 玛莎曼咖喱酱: ["甲壳类", "鱼类"],
  韩式辣酱: ["大豆", "含麸质谷物"],
  泰式红咖喱酱: ["甲壳类", "鱼类"], 泰式绿咖喱酱: ["甲壳类", "鱼类"],
  伍斯特酱: ["鱼类", "含麸质谷物"],
};
export function dietaryWarnings(r, p) {
  const names = r.ingredients.flatMap(i => i.authorName && i.authorName !== i.name ? [i.name, i.authorName] : [i.name]);
  return [
    ...(r.community && r.unknownIngredients?.length && p.allergens.length ? ["过敏设置：用户菜谱存在未识别食材，无法可靠核查"] : []),
    ...p.allergens
      .filter((a) => names.some((n) =>
        (Object.hasOwn(packaged, n) && packaged[n].includes(a)) ||
        (!(n === "蟹味菇" && a === "甲壳类") &&
          !(["椰奶", "南乳", "腐乳"].includes(n) && a === "奶类") && patterns[a]?.test(n)),
      ))
      .map((a) => "过敏设置：" + a),
    ...p.avoid
      .filter((a) => names.some((n) => n.includes(a) || normalize(n).includes(normalize(a))))
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
