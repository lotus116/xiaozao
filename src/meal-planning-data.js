// Small, explicit editorial annotations. No name/category heuristics.
// Every reason/preparation points to wording in the current recipe; the planner
// ignores stale annotations. Review this file after changing recipe steps.
const E = (step, title, quote) => ({ step, title, quote });
const P = (kind, text, step, title, quote) => ({ kind, text, ...E(step, title, quote) });
export const planningById = {
  cucumber: {
    order: "last",
    reason: "菜谱写明准备吃时再拌黄瓜，建议留到临上桌；提前切好时，黄瓜和料汁分开盖好冷藏。",
    evidence: [E(2, "拌匀", "准备吃时再拌黄瓜")],
  },
  "easy-corn-rib-soup": {
    order: "first",
    reason: "菜谱有两段慢炖，先留出这道的长等待时间。这里仍会做完一道再做下一道，不安排同时看火，也不意味着总时间缩短。",
    evidence: [E(1, "慢炖", "先炖约20分钟"), E(2, "炖至软烂", "再炖约40分钟")],
  },
  "easy-pumpkin-congee": {
    order: "first",
    reason: "菜谱有约 30 分钟慢煮，还需要搅底和留意溢锅，建议先留足时间专心做好，不把这段当作无人照看的空档。",
    evidence: [E(2, "慢煮", "转小火约30分钟起检查")],
  },
  "easy-potato-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟；先看第 1 步，用具接触生肉后及时清洗。", 0, "切配", "冷藏腌约10分钟")] },
  "easy-cucumber-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟，生熟用具分开；腌好再按原菜谱炒熟。", 0, "切配腌肉", "冷藏腌约10分钟")] },
  "easy-pepper-pork": { prep: [P("marinate", "肉片需要先冷藏腌约 10 分钟，调味按第 1 步；不要放在室温下久等。", 0, "切配腌肉", "冷藏腌约10分钟")] },
  "easy-shiitake-steamed-chicken": { prep: [P("marinate", "先按第 1 步切配和调味，鸡肉冷藏腌约 30 分钟；随后仍要蒸至熟透。", 0, "切配腌制", "冷藏腌约30分钟")] },
  "easy-blackbean-ribs": { prep: [P("marinate", "排骨先按第 1 步调味，冷藏腌约 20 分钟；不把腌制当作已经熟了。", 0, "准备腌料", "冷藏腌约20分钟")] },
  "easy-chicken-breast": { prep: [P("marinate", "鸡胸肉先切均匀薄片并按第 1 步短腌，等待时放冷藏；菜谱没有给出固定腌制分钟数。", 0, "切薄片腌味", "短腌也放冷藏")] },
  "cn-wood-ear-salad": {
    order: "last", reason: "菜谱写明现做现吃，建议临上桌拌好；如果暂时不吃，要及时盖好冷藏，不能放桌面久等。",
    evidence: [E(2, "拌汁", "现做现吃，暂时不吃就及时盖好冷藏")],
    prep: [P("soak", "这道用已泡发木耳。若从干货开始，按包装先泡发，室温一般不超过 2 小时、需更久就冷藏；已泡好的不用重复等待。随后仍须煮熟，额外泡发时间另留。", 0, "处理木耳", "室温泡发一般不超过 2 小时，需更久就冷藏")],
  },
  "easy-kelp-salad": { prep: [P("soak", "先看海带是干制、盐渍还是已处理品，按包装泡发、脱盐和清洗；已经处理好的不用再泡。这道标注时间不含泡发等前置处理，随后仍要煮熟。", 0, "处理海带", "时间不计入本菜烹饪时间")] },
  "cabbage-noodles": { prep: [P("soak", "粉丝先按包装泡软、剪短；包装不同时间不同，不另猜固定泡发时长。", 0, "泡粉丝", "绿豆粉丝按包装泡到能弯曲、还有韧性")] },
  "easy-vermicelli-babycabbage": { prep: [P("soak", "粉丝先按包装泡软，剪短后再摆盘；泡软不等于熟透，后面仍按菜谱蒸熟。", 0, "泡粉丝", "粉丝按包装方法泡到能轻松弯折")] },
  "easy-potato-rice": {
    order: "first", reason: "菜谱使用电饭锅煮饭程序，建议先完成配料准备并启动。程序时长看本机；本页的跟做仍按整道菜推进。",
    evidence: [E(2, "焖饭", "启动本机适用煮饭程序")],
    prep: [P("rice-cooker", "要先启动电饭锅：先完成第 1–2 步的洗米、加水和煎炒土豆，再按第 3 步启动程序；不是只放米就按开关。完成后检查米饭和土豆都熟。", 2, "焖饭", "启动本机适用煮饭程序")],
  },
  "easy-chicken-mushroom-rice": {
    order: "first", reason: "菜谱使用电饭锅指定程序，先做配料和启动检查，避免临吃才发现机器不适合带肉焖饭；不按跳保温推断肉已熟。",
    evidence: [E(0, "准备主料", "先确认电饭锅说明书允许带肉焖饭"), E(2, "煮饭检查", "立即按本机指定程序开煮")],
    prep: [P("rice-cooker", "先核对机器允许带肉焖饭，再按第 1–2 步洗米、加水并炒配料，第 3 步立即启动指定程序；不用常温预约。熟后还要检查鸡肉中心至少 74°C。", 2, "煮饭检查", "立即按本机指定程序开煮，不用含生肉的常温预约")],
  },
  "easy-century-pork-congee": {
    order: "first", reason: "这道要使用电饭锅煮粥程序，先核对容量并启动，给机器留出时间；不是让生肉常温预约等待。",
    evidence: [E(1, "启动煮粥", "选择本机煮粥程序并立即开始")],
    prep: [P("rice-cooker", "先按第 1 步备好米、肉、皮蛋和水，再用煮粥程序立即烹饪，容量不超过粥刻度；不让生肉常温预约等待。", 1, "启动煮粥", "选择本机煮粥程序并立即开始")],
  },
  "tomato-noodles": {
    order: "last", reason: "菜谱提醒马上吃，面条泡久会继续吸汤，建议临上桌完成，别先煮好面再等其他菜。",
    evidence: [E(2, "淋蛋调味", "马上吃，面泡久还会吸汤")],
  },
  "easy-mung-sprouts": {
    order: "last", reason: "菜谱建议熟透后装盘趁热吃，留到临上桌炒；不能为了脆口而提前停止加热。",
    evidence: [E(2, "调味", "确认全部熟透后"), E(2, "调味", "装到干净盘趁热吃")],
  },
  "easy-tofu-skin-salad": {
    order: "last", reason: "菜谱写明现拌现吃，黄瓜等吃前再拌；提前准备时先冷藏，不放室温等其他菜。",
    evidence: [E(2, "拌匀", "现拌现吃，暂时不吃先冷藏，黄瓜等吃前再拌")],
  },
  "cn-garlic-shoot-pork": { prep: [P("marinate", "肉丝先按第 1 步短腌，等待时放冷藏，生熟刀板和盘分开；菜谱没有给出固定腌制分钟数。", 0, "切配腌肉", "短腌时放冷藏，生熟刀板和盘分开")] },
  "cn-steamed-perch": { prep: [P("marinate", "这道的盐腌可省。若想腌底味，短腌也放冷藏；不额外猜腌制时间，不因这项提醒把可省步骤变成必做。", 0, "准备鱼", "可不腌盐；要腌就在冷藏短腌")] },
  "easy-celtuce": { prep: [P("marinate", "莴笋切片后先用一小撮盐拌匀，放约 5 分钟，见少量出水再轻轻挤去；不是长时间或重盐腌制。", 1, "少盐短腌", "先放约 5 分钟，看到出少量水、片稍软")] },
  "easy-kelp-tofu-soup": { prep: [P("soak", "用已泡发或处理好的海带。若从干货或盐渍品开始，按包装先泡发或脱盐、另留处理时间；已经处理好的不用重复泡。", 0, "切配", "确认海带是已泡发或按包装处理好的") ] },
  "easy-egg-pancake": { prep: [P("other", "先按第 1 步调好面糊，盖好静置约 20 分钟，再搅匀摊饼；不要尝生面糊，也不把这 20 分钟重复加到总参考时间。", 0, "调面糊", "盖好静置约20分钟，之后再搅匀；不要尝生面糊")] },
  "fried-rice": { prep: [P("other", "这道用的是熟米饭。没有现成饭时先另煮，煮饭时间需另留；新饭翻松散汽即可，剩饭只用妥善冷藏的，不用室温久放的饭。", 0, "准备米饭", "新煮的饭翻松散去多余蒸汽就用")] },
};
