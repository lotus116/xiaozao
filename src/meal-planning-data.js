// Small, explicit editorial annotations. No name/category heuristics.
// Every reason/preparation points to wording in the current recipe; the planner
// ignores stale annotations. Review this file after changing recipe steps.
const E = (step, title, quote) => ({ step, title, quote });
const P = (kind, text, step, title, quote) => ({ kind, text, ...E(step, title, quote) });
export const planningById = {
  cucumber: {
    order: "last",
    reason: "菜谱明确写了“现拌现吃”，建议留到临上桌再拌，避免拌好后等其他菜。",
    evidence: [E(2, "拌匀", "现拌现吃")],
  },
  "easy-corn-rib-soup": {
    order: "first",
    reason: "菜谱有两段慢炖，先留出这道的长等待时间。这里仍会做完一道再做下一道，不安排同时看火，也不意味着总时间缩短。",
    evidence: [E(1, "慢炖", "20 分钟"), E(2, "炖至软烂", "40 分钟")],
  },
  "easy-pumpkin-congee": {
    order: "first",
    reason: "菜谱有约 30 分钟慢煮，还需要搅底和留意溢锅，建议先留足时间专心做好，不把这段当作无人照看的空档。",
    evidence: [E(2, "慢煮", "30 分钟")],
  },
  "easy-potato-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟；先看第 1 步，用具接触生肉后及时清洗。", 0, "切配", "冷藏腌约 10 分钟")] },
  "easy-cucumber-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟，生熟用具分开；腌好再按原菜谱炒熟。", 0, "切配腌肉", "冷藏腌约 10 分钟")] },
  "easy-pepper-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟，调味按第 1 步；不要放在室温下久等。", 0, "切配腌肉", "冷藏腌约 10 分钟")] },
  "easy-shiitake-steamed-chicken": { prep: [P("marinate", "先按第 1 步切配和调味，鸡肉冷藏腌约 30 分钟；随后仍要蒸至熟透。", 0, "切配腌制", "冷藏腌约 30 分钟")] },
  "easy-blackbean-ribs": { prep: [P("marinate", "排骨先按第 1 步调味，冷藏腌约 20 分钟；不把腌制当作已经熟了。", 0, "准备腌料", "冷藏腌约 20 分钟")] },
  "easy-chicken-breast": { prep: [P("marinate", "鸡胸肉先切均匀薄片并按第 1 步短腌，等待时放冷藏；菜谱没有给出固定腌制分钟数。", 0, "切薄片腌味", "短腌期间放冷藏")] },
  "cn-wood-ear-salad": { prep: [P("soak", "若买的是干木耳，先按包装泡发；不用久泡或变质的木耳，泡好后仍须按菜谱煮熟，泡发时间另留。", 0, "处理木耳", "按包装新近泡发")] },
  "easy-kelp-salad": { prep: [P("soak", "若用干海带，先按包装泡发；这道菜标注的时间不含泡发，随后仍要煮熟。", 0, "处理海带", "本菜时间不含泡发")] },
  "cabbage-noodles": { prep: [P("soak", "粉丝先按包装泡软、剪短；包装不同时间不同，不另猜固定泡发时长。", 0, "泡粉丝", "粉丝按包装泡软")] },
  "easy-vermicelli-babycabbage": { prep: [P("soak", "粉丝先按包装泡软，剪短后再摆盘；泡软不等于熟透，后面仍按菜谱蒸熟。", 0, "泡粉丝", "粉丝按包装泡软")] },
  "easy-potato-rice": {
    order: "first", reason: "菜谱使用电饭锅煮饭程序，建议先完成配料准备并启动。程序时长看本机；本页的跟做仍按整道菜推进。",
    evidence: [E(2, "焖饭", "启动本机煮饭程序")],
    prep: [P("rice-cooker", "要先启动电饭锅：先完成第 1–2 步的洗米、加水和煎炒土豆，再按第 3 步启动程序；不是只放米就按开关。完成后检查米饭和土豆都熟。", 2, "焖饭", "启动本机煮饭程序")],
  },
  "easy-chicken-mushroom-rice": {
    order: "first", reason: "菜谱使用电饭锅指定程序，先做配料和启动检查，避免临吃才发现机器不适合带肉焖饭；不按跳保温推断肉已熟。",
    evidence: [E(2, "煮饭检查", "本机说明书允许做带肉焖饭")],
    prep: [P("rice-cooker", "先核对机器允许带肉焖饭，再按第 1–2 步洗米、加水并炒配料，第 3 步立即启动指定程序；不用常温预约。熟后还要检查鸡肉中心至少 74°C。", 2, "煮饭检查", "本机说明书允许做带肉焖饭")],
  },
  "easy-century-pork-congee": {
    order: "first", reason: "这道要使用电饭锅煮粥程序，先核对容量并启动，给机器留出时间；不是让生肉常温预约等待。",
    evidence: [E(1, "启动煮粥", "选本机煮粥程序")],
    prep: [P("rice-cooker", "先按第 1 步备好米、肉、皮蛋和水，再用煮粥程序立即烹饪，容量不超过粥刻度；不让生肉常温预约等待。", 1, "启动煮粥", "选本机煮粥程序")],
  },
  "fried-rice": { prep: [P("other", "这道用的是熟米饭。没有现成饭时先另煮，煮饭时间需另留；新饭翻松散汽即可，剩饭只用妥善冷藏的，不用室温久放的饭。", 0, "准备米饭", "新煮的饭翻松散去多余蒸汽就用")] },
};
