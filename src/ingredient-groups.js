export const defaultFrequentIngredients = [
  "番茄",
  "鸡蛋",
  "土豆",
  "嫩豆腐",
  "鸡胸肉",
  "小白菜",
  "黄瓜",
  "葱",
  "蒜",
  "姜",
  "大米",
  "面条",
];

// Each ingredient has one home. Prepared foods are explicit so canned fish
// does not get mistaken for fresh fish or soy products.
export const ingredientGroups = [
  {
    id: "vegetables",
    label: "蔬菜菌菇",
    icon: "carrot",
    names: [
      "番茄",
      "葱",
      "小白菜",
      "姜",
      "蒜",
      "黄瓜",
      "香菜",
      "土豆",
      "青辣椒",
      "杏鲍菇",
      "西兰花",
      "洋葱",
      "包菜",
      "菠菜",
      "韭菜",
      "青椒",
      "紫菜",
      "芹菜",
      "白菜",
      "冬瓜",
      "油麦菜",
      "油菜",
      "鲜香菇",
      "蒜苔",
      "南瓜",
      "花菜",
      "菜心",
      "小米辣",
      "白萝卜",
      "木耳",
      "西葫芦",
      "空心菜",
      "玉米",
      "生菜",
      "苦瓜",
      "莴笋",
      "莲藕",
      "绿豆芽",
      "金针菇",
      "茄子",
      "丝瓜",
      "蒜苗",
      "荷兰豆",
      "胡萝卜",
      "海带",
      "娃娃菜",
      "红薯",
      "山药",
      "平菇",
    ],
  },
  {
    id: "meat",
    label: "肉类",
    icon: "beef",
    names: ["鸡胸肉", "牛肉末", "猪肉末", "猪瘦肉", "鸡翅", "鸡腿肉", "排骨"],
  },
  {
    id: "seafood",
    label: "鱼虾海鲜",
    icon: "fish",
    names: ["虾仁", "虾", "虾皮", "鲈鱼", "昂刺鱼"],
  },
  {
    id: "soy",
    label: "豆制品",
    icon: "bean",
    names: ["老豆腐", "嫩豆腐", "香干", "豆腐皮"],
  },
  {
    id: "eggs",
    label: "蛋奶",
    icon: "egg",
    names: ["鸡蛋", "皮蛋", "无盐黄油"],
  },
  {
    id: "staples",
    label: "米面主食",
    icon: "wheat",
    names: ["大米", "小米", "面条", "面粉", "熟米饭", "港式炒面", "绿豆粉丝"],
  },
  {
    id: "prepared",
    label: "半成品",
    icon: "package",
    names: ["速冻饺子", "豆豉鲮鱼罐头", "培根", "腊肠", "鸡高汤"],
  },
  {
    id: "other",
    label: "水果及其他",
    icon: "apple",
    names: ["柠檬", "红枣", "可乐"],
  },
];
const groupByName = new Map(
  ingredientGroups.flatMap((g) => g.names.map((name) => [name, g.id])),
);
export const ingredientGroup = (name) => groupByName.get(name) || "other";

export function moveIngredient(names, from, to) {
  if (
    from < 0 ||
    to < 0 ||
    from >= names.length ||
    to >= names.length ||
    from === to
  )
    return names;
  const next = [...names];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
