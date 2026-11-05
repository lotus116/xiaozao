# 中文家常菜补充与配料规则

核对日期：2026-11-05。实现文件：`src/chinese-recipes.js`。

本批新增 26 道：21 道菜肴、3 道汤羹、2 道主食；另外替换 4 道已有菜的配料与步骤。重点增加蔬菜、豆制品、蛋类、小炒、蒸菜和鱼虾，不用饭面凑数量。全部提供来源地址、作者或贡献者名称、核对日期。没有试做过这些改编版本；步骤和耗时不是实测保证。

## 来源与使用方式

- 11 道新增菜参考美食天下公开可读原作者菜谱。以网页读取或搜索工具返回的完整食材表、做法步骤核对。部分桌面页直接打开失败，但搜索结果可读到全文；没有绕过验证码或访问限制。文字是本项目短句重述食材、顺序、火候等做法事实，没有复制作者故事、图片和整篇表达，也不代表获得平台或作者的转载授权。
- 15 道新增菜和 4 道既有菜调整参考中文开源项目 [HowToCook](https://github.com/Anduin2017/HowToCook)。实际联网下载并读取原始 Markdown，固定到提交 `308cc8b7dab1da84b20e7fafdf836a715437f582`，避免来源随主分支漂移。
- 核对了该提交的 [LICENSE](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/LICENSE)：采用 Unlicense，允许复制、修改、发布和再分发；内容按原样提供，不保证适用性。实现仍保留项目和具体菜谱链接，署名为社区贡献者，不冒称某一作者。
- 原网站的营养数字、医疗或保健效果、热量估值不移入应用。本批及替换菜的 `nutrition` 均为 `null`。口感或做法描述不等于营养承诺。

## 配料规则

1. **必须有的主体**：菜名对应的主要食材；例如番茄炒蛋的番茄和鸡蛋、蒜蓉菜的蒜。
2. **基础调味及关键风味**：通常保留油、盐或酱油；虎皮青椒的酸甜汁、可乐鸡翅的可乐、醋溜白菜的醋不能统一标成可省。不同菜谱中的同一调味品可能承担不同作用。
3. **有明确原文依据的可选项**：HowToCook 番茄炒蛋的糖和葱、西葫芦炒蛋的番茄、凉拌豆腐的醋/糖/辣椒油、凉拌木耳的芥末、水煮玉米的糖、可乐鸡翅的老抽、白萝卜汤的葱。白灼虾原文明确整份蘸料可省，改名葱姜焖虾以对应其实际无水焖法，蘸料配料均可省。
4. **根据步骤作用做出的编辑简化**：少量菜的收尾鸡精、香油或撒葱，原文没有直接写“可选”，但只承担提鲜或装饰，主体、盐和关键风味已保留。`optionalReason` 明确写“简化建议”，不冒称作者原话。例如黄瓜炒蛋/蒜蓉油麦菜的最后鸡精、芹菜香干的最后香油、洋葱炒蛋的撒葱。支持这种角色区分的实践材料是 [lizkitchenlife 的虎皮青椒](https://home.meishichina.com/recipe-73287.html)，作者明确允许清淡口味省味精/鸡精，并提醒酱油已有盐味时可以不再加盐；这支持设计原则，不证明所有菜的所有调料均可省。
5. 每个可选项有 `optionalReason`，对应步骤写明如何跳过。可选不等于无过敏风险；花生油、香油、蚝油、芝麻等保留真实名字，不能隐成通用“油”规避过敏检查。

后续逐菜复核还将青椒炒鸡蛋、芹菜香干、香菇油菜和蒜香西兰花中的少量糖列为编辑简化可选，将醋溜白菜的花椒粉列为可选。这些配料只调和或增加辅助香味，不参与成形；盐、油及酱油等基础调味仍保留，虎皮青椒与醋溜白菜的酸甜汁中的糖仍保留。每一项都直接向用户标注“简化建议”，不是伪装成原文明确可选。

## 新增菜与核对来源

以下用量以原文为基础；“适量”不编成貌似精确的克数。份数除原文明确给出外，为本项目按食材量估计。菜卡分钟数是包含切配的编辑参考时间，通常在原文烹饪时间基础上留出准备时间；步骤内明确分钟数才是可设定时提醒的操作参考，不能保证熟透。具体说明见表及下节。

| 菜名 | 来源、作者 | 主要改编说明 |
| --- | --- | --- |
| 青椒炒鸡蛋 | [美食天下 66763](https://home.meishichina.com/recipe-66763.html)，老老猪的小小猪 | 原量 6 个青椒、3 个蛋；补上备菜时间 |
| 黄瓜炒鸡蛋 | [美食天下 462123](https://home.meishichina.com/recipe-462123.html)，不做妖精好多年 | 保留原方花生油名称；鸡精列为编辑简化可选 |
| 紫菜蛋花汤 | [美食天下 579045](https://home.meishichina.com/recipe-579045.html)，四月豆 | 香菜仅收尾提香；水量原文适量，未虚构固定量 |
| 芹菜炒香干 | [美食天下 604740](https://home.meishichina.com/recipe-604740.html)，国民马大姐豆制品 | 补列步骤中的油、水；香油为收尾可省建议 |
| 肉末香干炒芹菜 | [美食天下 498485](https://home.meishichina.com/recipe-498485.html)，宁小麦 | 补上腌肉切配时间；强调肉末充分炒熟 |
| 醋溜白菜 | [美食天下 98042](https://home.meishichina.com/recipe-98042.html)，淇家的小厨房 | 保留酸甜汁与薄芡；鸡精可省为编辑建议 |
| 红烧冬瓜 | [美食天下 475299](https://home.meishichina.com/recipe-475299.html)，大草海 | 补列步骤中的油、水；按软透状态决定结束 |
| 蒜蓉油麦菜 | [美食天下 40371](https://home.meishichina.com/recipe-40371.html)，香香83 | 原 700 克油麦菜减半到 350 克；原调料适量仍保留 |
| 虎皮青椒 | [美食天下 61178](https://home.meishichina.com/recipe-61178.html)，花雨曼陀罗 | 保留原方；强调椒表面擦干、事先兑汁 |
| 香菇油菜 | [美食天下 175293](https://home.meishichina.com/recipe-175293.html)，小艾厨娘 | 原方 250 克油菜、80 克鲜香菇；补备菜时间 |
| 蒜苔炒肉丝 | [美食天下 259932](https://home.meishichina.com/recipe-259932.html)，一慕倾城 | 主料和油、酱油、淀粉减半为 2 人配菜；盐改为分次酌量 |
| 清蒸南瓜 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/清蒸南瓜.md) | 原方 300 克；保留 15–20 分钟与筷子穿透判断 |
| 清炒花菜 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/清炒花菜.md) | 保留原方 300 克；焯、炒、焖顺序不变 |
| 白灼菜心 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/白灼菜心/白灼菜心.md) | 调料按操作段具体值；洋葱是原文顺手添加项；未添加非必需芡汁 |
| 可乐鸡翅 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/可乐鸡翅.md) | 保留原量；老抽原文明确仅调色；总时间加备菜余量 |
| 葱姜焖虾 | [HowToCook 白灼虾原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/aquatic/白灼虾/白灼虾.md) | 按实际做法改名；整份蘸料可省，去掉原表列出但步骤未用的蚝油；蘸汁加热方式为编辑改写 |
| 白萝卜丝清汤 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/白萝卜丝清汤.md) | 原方猪油/香油二选一，本版选择香油；葱原文明示可加 |
| 番茄豆腐蛋花羹 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西红柿豆腐汤羹/西红柿豆腐汤羹.md) | 原方单份；淀粉少量分次加入，鸡精从 2 克改为少量 |
| 凉拌木耳 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/凉拌木耳/凉拌木耳.md) | 使用原方湿木耳 120 克；时间不含泡发，不默认久泡；芥末明确可选 |
| 西葫芦炒鸡蛋 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西葫芦炒鸡蛋/西葫芦炒鸡蛋.md) | 原量 500 克西葫芦、3 蛋；番茄原文可选；盐从固定 6 克改为酌量 |
| 洋葱炒鸡蛋 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/洋葱炒鸡蛋/洋葱炒鸡蛋.md) | 原油量 50 毫升仍明示，允许按不粘锅酌减；撒葱可省为编辑建议 |
| 蒜蓉空心菜 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/蒜蓉空心菜/蒜蓉空心菜.md) | 原油量 45 毫升明示并可酌减；去掉等油冒烟的要求 |
| 葱煎豆腐 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/葱煎豆腐.md) | 原方单份比例；豆腐原文没有克重，不编造；鸡精可省为编辑建议 |
| 小米粥 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/小米粥.md) | 原方 100 克米/2 升水；归主食，不当汤羹；未保留养胃等宣称 |
| 水煮玉米 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/breakfast/水煮玉米.md) | 原糖可选；原盐水表述不清，改“少许”而不硬套不合理浓度；总时间包含烧水 |
| 清蒸鲈鱼 | [HowToCook 原文](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/aquatic/清蒸鲈鱼/清蒸鲈鱼.md) | 去掉原表列出但步骤未用的料酒；盐改少许；采用水沸后蒸、按鱼厚检查熟度 |

## 已有菜的简化替换

- **番茄炒鸡蛋**：采用 [HowToCook](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西红柿炒鸡蛋.md) 2 人份计算：番茄约 360 克、3 个鸡蛋、油 12 毫升、盐 3–4 克分次酌量，糖与葱明确可选。去掉旧版白胡椒、料酒、香油等门槛。另核对 [下厨房·猫厨房](https://m.xiachufang.com/recipe/1000357/) 的简单番茄/鸡蛋/盐/糖版本，支持不必加白胡椒，但不采用其等油冒烟的描述。
- **家常蒸蛋**：以 [蒸水蛋](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/breakfast/蒸水蛋.md) 支持只用蛋、水、盐与可选佐料，去掉鸡高汤门槛。该文 260 毫升与操作段 1.5 倍水存在不一致，采用操作比例；蒸制方法交叉采用 [鸡蛋羹](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/鸡蛋羹/鸡蛋羹.md) 中火 10 分钟、焖 5 分钟，并要求检查凝固熟透。两篇均保留在来源数据中。
- **凉拌豆腐**：采用 [中文原方](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/凉拌豆腐.md) 的先煮后拌方法；醋、糖、辣椒油有明确可选标记。香油、生抽、葱蒜仍保留，避免“所有调味都省”。
- **蒜香西兰花**：替换为 [中文蒜蓉西兰花](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/蒜蓉西兰花.md)，只保留原方有依据的配料，使用焯熟后浇汁方法，保留蚝油的过敏信息。

## 从实际做法提炼的产品改进

这些是基于来源的产品推断，并不是原作者对本应用的建议。

1. **开火前备菜清单与“先调汁”提示**。在快炒开始前集中提示“切好、沥干、调汁”，避免开火后翻找调料。[大炒勺的醋溜白菜](https://home.meishichina.com/recipe-14368.html) 具体强调切片均匀与事先兑好汁；[花雨曼陀罗的虎皮青椒](https://home.meishichina.com/recipe-61178.html) 同样先兑汁、再煎椒。可优先加在跟做第一步，而非另起复杂页面。
2. **时间加状态双提示**。倒计时结束只提醒检查，不直接宣布“熟了”。[清蒸南瓜](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/清蒸南瓜.md) 用厚度、品种和筷子能否穿透判断；[清蒸鲈鱼](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/aquatic/清蒸鲈鱼/清蒸鲈鱼.md) 明确鱼大小影响火候。浮动计时器应显示菜名/步骤，避免离开详情后忘记在计什么。
3. **调味料角色和替代关系**。标记“基础咸味 / 特征风味 / 增香点缀”，缺可省项显示可做并解释差异。[lizkitchenlife 的虎皮青椒](https://home.meishichina.com/recipe-73287.html) 明确说清淡口味可省鸡精，酱油足够咸可不额外放盐；[番茄炒蛋](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西红柿炒鸡蛋.md) 区分甜口糖和可选葱。这支持当前常备调料记忆及可选不阻塞推荐，未来可做“酱油已有盐，先尝后补盐”提示。
4. **份数换算保留特殊规则**。食材可缩放，但鸡蛋要取整、煎锅要看铺开的面积，不能机械等比例缩短时间。[番茄炒蛋](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西红柿炒鸡蛋.md) 有明确鸡蛋向上取整规则；[蒜蓉空心菜](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/蒜蓉空心菜/蒜蓉空心菜.md) 提醒投菜量要适合锅的容量。建议下一步再做有规则的份数调整，当前直接给 1–2 人食材量。
5. **允许整组附加料一键跳过**。例如“要不要蘸汁”是整组选择，而不是要求逐项勾选六种调味。[HowToCook 白灼虾](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/aquatic/白灼虾/白灼虾.md) 明确蘸料可以全省。当前先用每项可选兼容应用；将来可提供可选配料组，并在过敏过滤中仍检查用户选择保留的组合。

## 数据边界与验证

- 来源不是专业食物安全规范；不移植未经核对的养生、排毒、降糖等说法。鱼、虾、肉和鸡蛋都加熟度提示，不以来源的“变色”“几分钟”单独作为可食保证。
- 保留原料中的可能过敏成分；可选标记不能自动绕过用户过敏设置。原料库存匹配应把“无可选调料”与“过敏不宜食用”分开。
- 26 个新 ID 均唯一；必需字段、分类、来源、可选原因与 `nutrition: null` 已通过本地数据检查。未宣称营养精确、实际试做、计时覆盖后台系统通知，后者属于应用能力而非菜谱数据。
- 难度由应用编辑分级：虎皮青椒、可乐鸡翅、葱姜焖虾、葱煎豆腐和清蒸鲈鱼为 2 级，因需控制煎制、收汁或动物性食材熟度；其余为 1 级。这是本应用的操作复杂度分级，不能直接等同于原站星数，也不代表任何菜可以忽略烫伤或熟度检查。
- 来源有的只写“适量”“一块”，该精度限制在界面如实保留；以后如要补精确量，应做试制记录或再核对可信原方，不能仅凭模型补数。
