import { writeFileSync } from "node:fs";
import { recipes } from "../src/recipes.js";
const retested = [
  "tomato-eggs",
  "bok-choy",
  "tomato-soup",
  "scallion-noodles",
  "egg-soup",
];
const notes = {
  "tomato-eggs": "来源营养与用量一致性存疑，隐藏数值。",
  "chive-eggs": "来源营养一致性未确认，隐藏数值。",
  cucumber: "营养暂未完成核对。辣椒油按原文可选处理。",
  cabbage: "采用原文允许的无肉版本；不沿用含肉营养。",
  "egg-soup": "营养未逐项核对。味精在原文步骤中为可选。",
  "tomato-noodles":
    "标题写 10 分钟，但卡片总时间 20 分钟，本版采用后者；营养未核对。",
  "crispy-noodles": "用量参考正文的每份调味建议；油未给定精确量。营养不展示。",
  "hot-noodles": "原文未给出营养数值；叶菜选用原文列出的 baby bok choy。",
  "shrimp-eggs": "省略原文可选香椿芽；补充熟度提醒。",
  "beef-noodles": "选用原文首选牛肉末；补充 71°C 熟度提醒。",
  "honey-chicken":
    "原文 seasoning 明确为少量盐与黑胡椒的项目解释；补充 74°C 熟度提醒。",
  "soy-eggs": "选用原文允许的全熟煎蛋；用时不含煮饭。",
};
let text =
  "# 菜谱来源与内容核对记录\n\n核对日期：2026-11-05（Asia/Hong_Kong）。共 " +
  recipes.length +
  " 道，首批 10 道打通流程后扩充。\n\n所有收录条目已通过网页检索/阅读工具核对作者、用量、份数、时间和方法。此状态仅表示文献核对，不等于现场试做，也不保证原链接永远可用。部分工具读取的是搜索服务缓存；直接脚本访问 The Woks of Life 返回 403，未绕过该访问限制。\n\n## 逐项记录\n\n| 菜谱 | 原作者与来源 | 标准份数 / 分钟 | 营养 | 验证与差异 |\n|---|---|---|---|---|\n";
for (const r of recipes)
  text += `| ${r.name} | [${r.source.author} · ${r.source.site}](${r.source.url}) | ${r.servings} / ${r.minutes} | ${r.nutrition ? "原作者每份估算 kcal / 蛋白质g / 碳水g / 脂肪g：" + r.nutrition.join(" / ") : "暂无可靠估算"} | 用量与步骤已核对；${retested.includes(r.id) ? "原文明确称重新测试。" : "有作者做法，未单独认定重新试做。"}${notes[r.id] || "中文简要整理；英制重量/体积作近似换算。"} |\n`;
text +=
  "\n## 验证层级与使用条件\n\n- 本项目实际试做：全部为未试做。浏览器流程测试不算做饭试做。\n- 读者反馈：来源页面显示评分/评论数量，未逐条核验读者是否实际试做，不将评分计数当作试做证据。\n- 难度：本项目根据刀工、快炒或热油操作作编辑分级，并非所有来源都提供难度字段。\n- 保留原版 1–6 人份，暂不自动缩放用量和时间。多数为 4 人份，尚未满足 1–2 人份优先覆盖；避免未经验证的缩份影响加热结果。\n- 营养是作者估算，未自行编造或重新计算。缺失/一致性存疑/采用无肉变体时显示暂无估算。\n- 当前未建替代食材匹配：例如原文允许蔬菜高汤，本版库存匹配仍以具体录入的鸡高汤为准。\n- 图片全部为项目自绘 SVG 示意，未下载或复制原站图片。中文文字为简要方法笔记，保留事实性用量及原文链接，不复制故事与完整原文。\n- The Woks of Life 页脚标注 All Rights Reserved，未发现开放转载许可；[隐私政策](https://thewoksoflife.com/privacy-policy/)不构成转载授权。未取得额外商业或图片授权。\n- [Immediate 使用条款](https://www.immediate.co.uk/terms-and-conditions/)对内容再利用有个人非商业用途限制。本轮仅本地开发演示，不声明取得公开发布授权。未来公开发行前需重新确认内容授权或用项目自行试做原创内容替换。\n\n## 未收录的扩充候选\n\n- [香菇黄花蒸鸡](https://thewoksoflife.com/steamed-chicken-mushrooms-dried-lily-flowers/)：原版总时长 4 小时 15 分钟，且室温腌制说明不适合作为新手默认路径，未收录。\n- [蔬菜炒饭](https://thewoksoflife.com/vegetable-fried-rice/)：总时长 45 分钟、用料与现有炒饭重叠较多，暂不以重复内容凑数。\n- 蒸豆腐、煎豆腐、毛豆等尝试链接未成功读取，未加入任何未经核实的配方。当前 27 道属于约 30 道的首轮规模。\n\n## 额外熟度依据\n\n[FoodSafety.gov 安全最低中心温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)：禽肉 74°C，牛肉末 71°C，鸡蛋熟至蛋白蛋黄凝固，虾肉呈珠白/白色且不透明。本项目补充这些提醒并标注链接；计时不代替熟度判断。\n";
writeFileSync("docs/RECIPE_SOURCES.md", text);
