// These exact public pages were read on the recorded date. Sources support
// bounded techniques, not a full recipe copy, popularity rank or kitchen test.
// Keep original provenance and saved cooking stage identities unchanged.
const checked = "2026-11-06";
const xcf = (title, author, id, supports, adaptation) => ({
  site: "下厨房", title, author, url: `https://m.xiachufang.com/recipe/${id}/`, checked, supports, adaptation,
});
export const domesticSourcesById = {
  "tomato-eggs": [xcf("番茄炒蛋", "猫厨房", "1000357",
    "鸡蛋先炒盛出，番茄另煮出汁后合炒。",
    "保留分开烹调顺序；不采用油冒白烟或含糊的大勺盐量。本版中火、油不冒烟，盐先少后补。")],
  "steamed-eggs": [xcf("水蒸蛋（只要掌握三点，做出光滑特别简单）", "楼一一一", "106703270",
    "蒸碗覆盘，锅中水沸后再入锅蒸。",
    "保留本版蛋液与水 1∶1.5、宽浅碗和中心熟度检查；不照搬原文 2 倍水，也不把 15 分钟当通用熟透保证。")],
  potatoes: [xcf("不用焯水一样炒出脆脆的酸辣土豆丝", "黄漫漫", "107367007",
    "切丝后洗去表面淀粉，炒至半透明，醋分次加入。",
    "只参考清洗与状态观察；本版仍保留短焯后炒熟的路径，不是原文免焯水版本。半透明只是线索，还要检查较粗的一根没有生硬粉芯。")],
  cucumber: [xcf("拍黄瓜", "下厨房用户_geqhb（小羽私厨）", "101833840",
    "拍裂后切成入口小块，先调汁再拌。",
    "不照搬原料栏与正文不一致的盐量，也不用薄刀重拍。生抽先少放，额外盐可省，喜欢甜味才加少量糖。")],
  "cn-pepper-eggs": [xcf("青椒炒蛋 米饭杀手 下饭", "xcf2019", "100043473",
    "原法将碎椒与蛋混合，中火摊开后炒至蛋液凝固。",
    "本版先炒蛋盛出，再炒软青椒后合锅，为新手拆开控制熟度，并非复刻原法；厚壁椒要多给时间，不承诺零失败。")],
  "cn-cola-wings": [xcf("可乐鸡翅 Coca Cola Chicken wings", "yanyanfoodtube", "100561810",
    "中小火煎上色，加可乐炖熟后再收汁。",
    "借鉴先煎、再煮、后收汁的顺序；本版保留焯水预处理。最厚肉处须测到 74°C，再小火收汁，不能用酱汁浓度判断鸡翅已熟。")],
  "easy-shiitake-steamed-chicken": [xcf("广式家常菜香菇蒸鸡，鲜嫩又方便百吃不厌", "EllieKongSG", "104735765",
    "宽浅盘单层平铺，避免鸡块重叠，开水上锅。",
    "本版用鲜香菇与去骨鸡腿，不沿用冲洗生鸡或固定 15–20 分钟即可熟的假设；蒸后测几块最大鸡肉中心，均到 74°C 才取出。")],
  cabbage: [xcf("手撕包菜", "Cola_aa", "106404157",
    "包菜撕成小块，预先调汁，炒软后再加汁。",
    "参考撕小、先备调味和炒软后调味。小灶保留少盐起步、其他调料可省的素版，不叠加原文多种咸味调料，也不把小锅塞满。")],
  "cn-wood-ear-salad": [xcf("凉拌木耳", "妮妮Ameile", "104715741",
    "木耳泡发后煮制，沥水再与调料拌匀。",
    "参考先煮后拌；泡发、冷藏与异常丢弃按下方食安中心指引处理，原站短时间煮制不作为所有木耳的熟度保证。"), {
      site: "香港食物安全中心", title: "浸泡菇类与食物安全", author: "食物安全中心",
      url: "https://www.cfs.gov.hk/sc_chi/multimedia/multimedia_pub/multimedia_pub_fsf_200_04.html", checked,
      supports: "室温泡发一般不超过 2 小时；需要更久应冷藏。泡好尽快烹煮，黏糊或异味应丢弃。",
      adaptation: "用于本菜前置泡发检查；不把闻着正常或再次煮沸当作挽救存放不当木耳的方法。",
    }],
  "easy-mapo-tofu": [xcf("麻婆豆腐", "奚姥姥", "102776916",
    "豆瓣酱先切细，肉末与调料炒香，豆腐少翻动，末段以水淀粉收稠。",
    "借鉴酱料处理和轻推豆腐；不照搬麻辣香锅复合调料。本版老豆腐、可省肉末与淀粉，是家常简化版，不宣称正宗或完整复刻。")],
  "easy-oyster-lettuce": [xcf("家常菜 蚝油生菜", "小美的美食", "100467836",
    "生菜分批处理后沥水，蒜香酱汁另做再淋。",
    "只借鉴分批与菜汁分做；本版用沸水焯熟，不照搬 80–90°C 关火短烫，也不把多种咸味料全加进去。")],
};
