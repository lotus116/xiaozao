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
let text = `# 菜谱来源与内容核对记录

核对日期：2026-11-05 至 2026-11-06（Asia/Hong_Kong）。共 ${recipes.length} 道；本轮从 53 道增至 99 道，新增 46 道、简化 43 道原有菜谱。

网页资料核对不等于现场试做。部分平台使用搜索工具返回的内容核对；未绕过访问限制。新增中文菜的份数、耗时与配料简化有编辑判断，逐项区别见 [中文菜谱研究](CHINESE_RECIPE_RESEARCH.md)。用量不明确的项目保留“适量”，不编造精确克数。

本轮简化依据、46 道新增来源及 43 道修改清单见 [99 道精选研究](EASY_99_RESEARCH.md)。97 道的必需用料不超过 5 项（包括油盐，不计水）；不是将全部调料统一忽略。

| 菜谱 | 原作者与来源 | 份数 / 参考分钟 | 营养 | 验证与差异 |
|---|---|---|---|---|
`;
for (const r of recipes) {
  const chinese =
    r.source.site !== "The Woks of Life" && r.source.site !== "Good Food";
  const verification = r.teaching
    ? "首批新手教学改写；综合多个公开教程，保留关键比例与食品安全，尚未下厨试做。详见 BEGINNER_RECIPE_RESEARCH.md。"
    : r.editorNote
    ? "本项目家常简化版；步骤与可省配料同步调整，不沿用原版营养。详见99道研究记录。"
    : chinese
      ? "中文做法事实简要重述；可省项分别标明原文依据或编辑简化；见中文研究记录。"
      : (retested.includes(r.id)
          ? "原文明确称重新测试。"
          : "有作者做法，未单独认定重新试做。") +
        (notes[r.id] || "中文简要整理；英制重量/体积作近似换算。");
  const extra = (r.additionalSources || [])
    .map((source) => `；[补充方法](${source.url})`)
    .join("");
  text += `| ${r.name} | [${r.source.author} · ${r.source.site}](${r.source.url})${extra} | ${r.servings} / ${r.minutes} | ${r.nutrition ? "原作者每份估算 kcal / 蛋白质g / 碳水g / 脂肪g：" + r.nutrition.join(" / ") : "暂无可靠估算"} | ${verification} |\n`;
}
text += `
## 内容边界

- 全部未经过本项目下厨试做。浏览器操作通过、原文评分或评论数量均不等于试做验证。
- 新增内容以 1–2 人份为主，原有部分菜仍为 4–6 人份。暂不自动缩放用量和时间；新增份数与卡片时间有编辑估计，详情明确说明。
- 难度由本项目按刀工、火力转换、热油和熟度判断分级。
- 营养仅保留已核对的原作者估算。新增及改写的中文菜全部留空。
- 基础调味与关键风味仍参与匹配；辅助增香可按具体菜谱省略。可省不代表不会引起过敏。
- 当前不自动把所有醋、油、淀粉或豆腐视作可互换材料，具体品种仍须核对。
- 使用自绘 SVG 示意，不下载或复制作者照片。菜谱文字为简短的方法笔记和事实性用量，不复制故事或整篇表达。

首批番茄炒蛋、蒸蛋、蛋炒饭的热门教程选择、读者反馈证据和逐菜取舍见 [新手菜谱研究](BEGINNER_RECIPE_RESEARCH.md)。另外 96 道本轮未按这一标准逐菜重写。

## 来源使用条件

- HowToCook 使用 [Unlicense](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/LICENSE)，保留固定版本的具体菜谱链接与社区署名。
- 美食天下等公开页面不视作已获转载授权；本项目保留来源、重新组织简短笔记，未获取图片授权。
- The Woks of Life 标注 All Rights Reserved；[隐私政策](https://thewoksoflife.com/privacy-policy/)不构成转载许可。
- [Immediate 使用条款](https://www.immediate.co.uk/terms-and-conditions/)含内容再利用限制。当前为本地开发演示；公开发行前需确认内容授权或以自行试做的原创内容替换。

## 熟度与饮食设置依据

- [FoodSafety.gov 温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)：用于原有鸡肉、牛肉末与虾等熟度提醒；计时不代替检查食物状态。
- [食安中心致敏物说明](https://www.cfs.gov.hk/sc_chi/multimedia/multimedia_pub/multimedia_pub_fsf_123_02.html)：可选配料也参与过敏排除，实际品牌配方和交叉接触仍须查看包装。未被排除不是无过敏风险保证。
- [太太乐鸡精配料实例](https://www.totole.com.cn/index.php?id=1217&r=node%2Flboxmob)含蛋；[另一鸡味调味料配方](https://www.totole.com.cn/index.php?id=1215&r=node%2Flboxmob)含大豆。应用按可能含蛋/大豆处理未指定品牌的鸡精，不声称所有品牌配方相同。
`;
writeFileSync("docs/RECIPE_SOURCES.md", text);
