// First teaching pass: three dishes, not a claim that all 99 have been rewritten.
// Research and editorial choices: docs/BEGINNER_RECIPE_RESEARCH.md.
const checked = "2026-11-06";
const source = (site, author, url) => ({ site, author, url, checked });
const woks = (author, slug) => source("The Woks of Life", author, `https://thewoksoflife.com/${slug}/`);
const lau = (slug) => source("Made With Lau", "Daddy Lau / Randy Lau", `https://www.madewithlau.com/recipes/${slug}`);
const I = (name, amount, optionalReason = "") => ({ name, amount, water: name === "水", optional: Boolean(optionalReason), ...(optionalReason ? { optionalReason } : {}) });
const S = (title, text, seconds = 0) => ({ title, text, seconds });
const common = {
  nutrition: null,
  safetySources: [{ site: "FDA · 鸡蛋与剩菜熟度", url: "https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling" }],
  timeNote: "总时间为备菜与烹饪的参考；计时到了先检查，不是熟透保证。",
  servingsNote: "按所列用量估计份数，食量不同可调整；加量宜分批炒。",
  editorNote: "综合多个公开教程，按新手家常做饭重新组织；用量可调，关键比例和食品安全另说明。尚未下厨试做，不承诺复现作者成品。",
};

// Retain step counts, order, titles and timer durations so existing bookmarks,
// meals and in-flight timers still refer to the same cooking stage.
export const beginnerRefinements = {
  "tomato-eggs": {
    ...common,
    description: "先把蛋炒嫩、番茄炒出汁，最后合在一起。酸甜浓淡由你定。",
    ingredients: [
      I("番茄", "中等大小 2 个，熟一点更易出汁"),
      I("鸡蛋", "3 个，大小不必挑得一样"),
      I("食用油", "约 1–2 汤匙，分两次用"),
      I("盐", "先备约 1/4 茶匙，熟后尝味再补"),
      I("水", "锅干时加 1–2 汤匙，不必全用"),
      I("糖", "偏酸时加一点点", "调和酸味；不爱甜或番茄够甜就不加"),
      I("葱", "少许", "最后增香，不影响成菜"),
    ],
    steps: [
      S("准备食材", "番茄洗净去蒂，切成一口大小；鸡蛋加一小撮盐打到蛋白蛋黄混匀。有葱就先切好。把油分成两份，大部分炒蛋，余下炒番茄，另备干净盘盛蛋。"),
      S("先炒鸡蛋", "锅里放大部分油，中火加热到油能轻松流动、还没冒烟。倒蛋液，边缘凝固后用铲子往中间轻推；蛋块刚成形、仍柔软就盛出，稍后回锅熟透。不要一直炒到焦黄。"),
      S("炒软番茄", "原锅加余油，中火炒番茄并加一小撮盐。炒到边缘变软、铲子轻压就出汁；锅干而番茄还硬，沿锅边慢慢加 1–2 汤匙水，调小火稍焖，别硬烧。"),
      S("合炒调味", "先看番茄汁：太稀就先开盖收浓，再放回鸡蛋轻轻翻匀。加热到蛋液完全凝固、没有流动生蛋液就关火。尝一口，淡了补少量盐，偏酸可加一点糖；有葱再撒，汁能裹住蛋块就很好。"),
    ],
    source: woks("Sarah", "stir-fried-tomato-and-egg"),
    additionalSources: [lau("tomato-and-eggs")],
    teaching: {
      focus: "鸡蛋先盛出，番茄炒软出汁再合炒。蛋块大一点、汁多一点都没关系。",
      flexibility: "番茄和蛋不用精确称重；喜欢蛋香就多一点蛋，喜欢拌饭就多留些汁。糖只在偏酸时少量加，不能靠加糖抵消咸味。",
      rescue: [
        { problem: "汁太多", advice: "先把蛋块盛到干净盘，番茄汁开盖多煮一会儿，再把蛋放回热透；别让蛋陪着久煮。" },
        { problem: "蛋炒老了", advice: "这次不能变回嫩蛋；拌入番茄汁吃仍可以，下次刚成块就先盛出。" },
        { problem: "偏咸或糊底", advice: "偏咸可加些另行炒熟、没放盐的番茄或蛋；糊底别刮进菜里，明显焦苦就重新做。" },
      ],
    },
  },
  "steamed-eggs": {
    ...common,
    description: "用同一个杯子记住一份蛋、一份半水，温和蒸到中心熟透。",
    ingredients: [
      I("鸡蛋", "2 个"),
      I("水", "蛋液体积的 1.5 倍，另备蒸锅用水"),
      I("盐", "一小撮；要淋生抽就再少些"),
      I("香油", "几滴", "出锅增香，可不加"),
      I("葱", "少许", "最后点缀，可不加"),
      I("生抽", "少量，熟后尝味再淋", "增加鲜咸味，已有盐就别一次倒多"),
    ],
    steps: [
      S("调蛋液", "用杯子量打散的蛋液，再用同一杯量 1.5 倍温水（温热不烫手，约 40°C，不用开水），加一小撮盐搅匀。倒入宽浅耐热碗，过筛或撇去大泡；没有筛网也能做，只是表面可能不够平。"),
      S("盖盘蒸蛋", "碗上盖耐热小盘挡住滴水，放稳在蒸架上。蒸锅水开后放入，盖锅盖，转中小火让水持续轻轻沸腾、不猛烈翻滚。先蒸约 10 分钟再检查，别频繁开盖；留意锅水，不能烧干。", 600),
      S("关火焖与检查", "关火盖着焖约 5 分钟，开盖避开蒸汽。轻晃应整体柔软颤动，用勺查看中心，不能有流动生蛋液；有食品温度计时中心至少 71°C。中心未凝固或测温不足，盖回再蒸 2 分钟并复查，必要时重复。用隔热手套或夹碗器取碗，再按喜好加香油、葱或生抽。", 300),
    ],
    tools: "带盖蒸锅与蒸架、宽浅耐热碗、耐热小盘、同一个量杯、隔热手套或夹碗器；细筛与食品温度计有则用",
    source: source("China Sichuan Food", "Elaine", "https://www.chinasichuanfood.com/chinese-steamed-egg/"),
    additionalSources: [lau("steamed-egg"), woks("Judy", "steamed-egg")],
    teaching: {
      focus: "这道只记住蛋水比例，别追求镜面。宽浅碗、轻轻沸腾，中心熟透比表面漂亮重要。",
      flexibility: "一份蛋液配一份半水，用同一个杯子比就行；蛋大蛋小都适用。此页按宽浅碗写，深碗、厚碗或做更多可能要更久，不把时间照搬。",
      rescue: [
        { problem: "中心还像水一样流", advice: "先别吃，也别只继续关火焖。检查锅里有水，盖好重新蒸，每 2 分钟复查；时间到了不代表熟了。" },
        { problem: "表面有孔或不够嫩", advice: "已熟透就可以吃，不用重做追求光滑。下次调小火、撇掉大泡，并盖盘挡滴水。" },
        { problem: "底味不够", advice: "熟后少量淋生抽或补盐即可；先尝再补，香油和葱花没有也不影响。" },
      ],
    },
  },
  "fried-rice": {
    ...common,
    description: "米饭先拨松，一次别炒太多。热透又有蛋香，比粒粒完美更重要。",
    ingredients: [
      I("熟米饭", "1 碗，偏干爽的新饭或妥善冷藏的饭"),
      I("鸡蛋", "2 个"),
      I("食用油", "约 1 汤匙，够薄薄润住锅底"),
      I("盐", "先放一小撮，尝味再补"),
      I("葱", "少许", "最后增香，不必专门买"),
      I("生抽", "少量", "喜欢酱香再加；用了就少放盐"),
    ],
    steps: [
      S("准备米饭", "米饭先用饭勺拨松饭团，鸡蛋打散，葱有则切好。新煮的饭翻松散去多余蒸汽就用，不必等到隔夜；冷饭只用妥善冷藏的，不用久放室温的剩饭。饭若湿黏得成糊，先换干爽些的饭。"),
      S("炒蛋和饭", "锅里加油，中火到油能流动但不冒烟。蛋液下锅，轻推成柔软小块就加饭。用铲子侧边拨开饭团、翻到锅底均匀受热，不用使劲压碎米粒；一次只炒这一碗，锅装太满就分批。"),
      S("炒热调味", "中火翻炒到鸡蛋完全凝固、米饭从边缘到中心都热透，翻起也持续冒热气；冷饭复热有食品温度计时各处至少 74°C。再少量撒盐，有生抽就少淋并少放盐，有葱最后加。尝味后出锅，不必为追求粒粒分明一直炒干。"),
    ],
    safetySources: [...common.safetySources, { site: "英国 FSA · 米饭保存与复热", url: "https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker" }],
    source: lau("egg-fried-rice"),
    additionalSources: [woks("Bill", "egg-fried-rice")],
    teaching: {
      focus: "饭先拨松、锅里别太满。中火也能炒好，不需要让不粘锅冒烟。",
      flexibility: "一碗饭配 1–2 个蛋都行，盐和生抽先少后补。第一次先做基础版；想加配菜，先另行做熟并沥去多余水分再拌入，不直接倒进生肉。",
      rescue: [
        { problem: "饭团散不开", advice: "调小火，用铲子侧边慢慢拆松，不猛压成糊，也别倒水去冲开；米饭太湿时接受软一点的口感。" },
        { problem: "粘锅或开始焦", advice: "先降火，把没焦的部分轻轻翻松；锅底明显焦黑就别刮进饭里。下次先把饭拨散，少量炒。" },
        { problem: "不够香或太咸", advice: "熟后可补一点葱花或生抽；生抽不是越多越好。太咸可加少量未调味熟饭，再把整锅热透。" },
      ],
      safety: "剩饭尽快分浅盒冷却，理想 1 小时内冷藏，24 小时内用，只复热一次；不要在锅里或室温下放过夜。存放不当的饭，闻着正常、再炒再热也不能补救。",
    },
  },
};
