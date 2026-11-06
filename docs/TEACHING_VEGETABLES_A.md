# 蔬菜 A 批次：23 道新手教学与来源记录

研究日期：2026-11-06。交付：`src/teaching-vegetables-a.js`。范围只含本批次 23 道，不代表其余 76 道已由本批次检查。

## 验证边界

- 这是公开资料阅读、编辑与静态结构核对，**没有下厨试做**，没有新手用户成功率数据。不要把“资料核对”写成“实测”“百试百灵”。
- 15 道原出处成功读取（6 个 The Woks of Life、9 个固定 commit 的 HowToCook）。8 个美食天下原链接本轮未能重读：网页读取出现 520/超时，公开 HTTP 请求返回 403，停止该站点请求，没有绕过访问限制。保留原 `source` 与旧 `checked`，在各菜可见编辑说明里公开这项局限。
- 每道都有至少一条本轮可读取的独立补充出处，可能是同菜不同版本，也可能仅是相关技法。以下逐菜说明采用范围，**不是每道都得到两个一致的完整配方**。
- 人气信息只记录页面当日显示的评分、投票或评论，不等同独立复现。评论可能包含提问与作者回复，ratings、reviews、comments 不能相加。未见可靠反馈就明确未核验，不给 app 自己的改编版移植星级。
- 既有原料、可选说明、份量标注、ID、步骤数量、标题、顺序、计时秒数及状态版本均不改。步骤文字、教学重点、弹性、补救和补充出处为本轮新增。对于旧有“适量”，只在步骤内提供保守调味起点，并标作编辑建议。

## 99 道批量处理的质量门槛

1. 每批按稳定 ID 独占文件。先冻结原配料、份量、步骤与计时映射，不让并行改写覆盖收藏或进行中的做菜状态。
2. 每道保留主出处，再独立核对最可能失败的技法。明确不同配方的锅具、切块、是否预熟、火力与用料差异，不拼凑两套互相冲突的秒数。
3. 新手步骤必须回答：现在做什么、到什么状态、未到如何继续。写菜茎能否戳入、蛋液是否凝固、蒜是否变深、汁能否薄挂，不能只把“炒熟”扩写成长句。
4. 每道有自己的重点、可调整项与至少两项补救。不把食品安全改成个人口味，不把已焦苦、保存不当等不可逆问题承诺救回。
5. 人气与安全分开审核。网站流量、仓库 stars、作者名望不是某道菜安全证明。安全采用官方依据，效果仍需日后实际厨房试做。
6. 单批通过覆盖与兼容性检查，主模块接入后再统一跑单元测试、构建和界面回归。本批只报告自己实际运行的检查，不声称已完成整应用测试。

## 食品安全依据

- [FDA：安全处理食物](https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling)：生熟器具分开，鸡蛋充分凝固，易腐食物及时冷藏。一般两小时内冷藏，环境超过约 32°C 时一小时内。豆腐须结合具体产品的储存与加热说明，短煮去豆腥不是通用安全验证。
- [香港食物安全中心：浸泡菇类](https://www.cfs.gov.hk/sc_chi/multimedia/multimedia_pub/multimedia_pub_fsf_200_04.html)：室温浸泡一般不超两小时，更久应冷藏；泡好尽快烹煮。黏滑或异味应丢弃，存放情况不明也不以再煮补救。
- 加热提示采用可操作的家用火候，不要求新手将不粘锅空烧冒烟。炒菜状态提示用于烹饪判断，不能推广成肉类靠颜色判安全的做法。

## 逐菜来源与编辑判断

### 1. 清炒小白菜 · `bok-choy`

- 原出处：[ The Woks of Life · Kaitlin ](https://thewoksoflife.com/stir-fried-bok-choy-recipe/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Made With Lau · Daddy Lau / Randy Lau ](https://www.madewithlau.com/recipes/stir-fried-bok-choy)。本轮正文/步骤可读。
- 采用与分歧：主方与 Made With Lau 均支持清洗沥干、厚梗优先、接近完成再调味。保留原水芡可选逻辑，明确约 700 克菜要按锅容量分批。主方当前列总时长 30 分钟，未把 app 的 15 分钟简化估计冒充来源时间。
- 反馈层级：主方页面结构化评分 4.94/5，47 ratings；正文 144 comments。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 2. 蒜香拍黄瓜 · `cucumber`

- 原出处：[ The Woks of Life · Judy ](https://thewoksoflife.com/smashed-asian-cucumber-salad/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/chinese-cucumber-salad/)。本轮正文/步骤可读。
- 采用与分歧：交叉核对轻拍增加裂隙、直接拌汁与提前腌渍是不同做法。保留现拌版，不额外引入必须腌制的等待步骤；用擀面杖替代新手猛拍刀面。
- 反馈层级：主方页面结构化评分 4.99/5，134 ratings；正文 374 comments。补充方 5/5，34 votes。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 3. 酸辣土豆丝 · `potatoes`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/酸辣土豆丝.md)。本轮原文可读，原记录日期 2026-11-06。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/chinese-potato-stir-fry/)。本轮正文/步骤可读。
- 采用与分歧：HowToCook 包含短焯，Red House Spice 是冲洗后直接炒，两者不能混成一条固定时长。保留原短焯阶段，补上均匀切丝、后续炒透和粗丝检查；原方 10 秒不是熟透保证。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 4. 家常凉拌豆腐 · `cold-tofu`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/凉拌豆腐.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/cold-tofu-liangban-tofu/)。本轮正文/步骤可读。
- 采用与分歧：HowToCook 为老豆腐短煮，Elaine 的补充方是软/绢豆腐凉拌。仅借鉴轻拿、分开调汁、及时食用，不把软豆腐生食法移植给全部老豆腐。原短煮去豆腥时间不等于安全灭菌时间，另明确冷链、标签与加热要求。
- 反馈层级：补充软豆腐方 5/5，5 votes；不能算老豆腐版的评价。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 5. 蒜蓉小白菜 · `garlic-bok`

- 原出处：[ The Woks of Life · Bill ](https://thewoksoflife.com/garlic-baby-bok-choy/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Made With Lau · Daddy Lau / Randy Lau ](https://www.madewithlau.com/recipes/stir-fried-bok-choy)。本轮正文/步骤可读。
- 采用与分歧：两站均支持洗净沥干、蒜和菜快速衔接。没有照搬原方空锅烧冒烟，改成家用锅中小火炒蒜、梗叶先后下。
- 反馈层级：主方页面结构化评分 4.86/5，21 ratings（reviewCount 20）。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 6. 黄油酱香杏鲍菇 · `mushroom`

- 原出处：[ The Woks of Life · Judy ](https://thewoksoflife.com/soy-butter-glazed-king-oyster-mushrooms/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/king-oyster-mushroom-garlic-sauce/)。本轮正文/步骤可读。
- 采用与分歧：主方是约 6 毫米片分批煎后用余温拌黄油汁；补充方是杏鲍菇鱼香炒法，只用于交叉核对出水和边缘褐变。没有套用其 2–3 分钟炒制时间，也没引入鱼香调料。小火放黄油后立即关火，用余温完成。
- 反馈层级：主方页面结构化评分 4.91/5，87 ratings。补充方 4.98/5，39 votes。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 7. 蒜香西兰花 · `garlic-broccoli`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/蒜蓉西兰花.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Made With Lau · Daddy Lau / Randy Lau ](https://www.madewithlau.com/recipes/boiled-broccoli)。本轮正文/步骤可读。
- 采用与分歧：主方焯 2–3 分钟，Made With Lau 示例约 4 分钟，说明切块和容器会改变时间。保留 2–3 分钟为首次检查点，增加厚茎状态，并沿用蒜汁另煮。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 8. 西兰花烧豆腐 · `broccoli-tofu`

- 原出处：[ The Woks of Life · Sarah ](https://thewoksoflife.com/broccoli-tofu-bowls/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Omnivore's Cookbook · Maggie Zhu ](https://omnivorescookbook.com/tofu-and-broccoli/)。本轮正文/步骤可读。
- 采用与分歧：主来源是不煎豆腐的快煮碗；app 旧版已经有煎豆腐阶段，本轮为兼容保留。Omnivore 的煎豆腐/西兰花版验证单层煎与湿芡重搅技法，但其腌汁、淀粉裹壳及分开焯菜流程不移植。明确 235 毫升清水与等量高汤二选一。
- 反馈层级：主方页面结构化评分 4.82/5，22 ratings。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 9. 手撕包菜（素版） · `cabbage`

- 原出处：[ The Woks of Life · Judy ](https://thewoksoflife.com/chinese-cabbage-stir-fry/)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/chinese-cabbage-stir-fry/)。本轮正文/步骤可读。
- 采用与分歧：Woks 原方带肉但允许省肉；补充方列独立素版。保留 app 素菜配料，只交叉核对厚叶脉、分离叶片、出水与蒜椒易焦，不宣称味道等同肉版，也不照搬钢锅冒烟要求。
- 反馈层级：主方页面结构化评分 4.95/5，78 ratings。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 10. 韭菜炒鸡蛋 · `chive-eggs`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/韭菜炒蛋/韭菜炒蛋.md)。本轮原文可读，原记录日期 2026-11-06。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/chinese-chive-egg/)。本轮正文/步骤可读。
- 采用与分歧：HowToCook 先炒蛋再炒韭菜，Red House Spice 将韭菜混入蛋液炒，流程不同。保留原分炒阶段，交叉核对沥水、蛋凝固且柔软的状态；未采用后者尚有生蛋液即出锅的解读。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 11. 青椒炒鸡蛋 · `cn-pepper-eggs`

- 原出处：[ 美食天下 · 老老猪的小小猪 ](https://home.meishichina.com/recipe-66763.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/egg-and-pepper-stir-fry/)。本轮正文/步骤可读。
- 采用与分歧：补充菜谱为青椒与蛋液一起煎的版本，只核对配料组合、切椒与蛋凝固状态。保留现有先炒蛋再炒椒的分炒法，明确不是重现补充方，也未新增酱油香油。
- 反馈层级：补充混煎版 5/5，4 votes；不是 app 分炒版的评价。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 12. 黄瓜炒鸡蛋 · `cn-cucumber-eggs`

- 原出处：[ 美食天下 · 不做妖精好多年 ](https://home.meishichina.com/recipe-462123.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ Cookpad · 札幌市丰平保健中心食谱 · Toyohira Health Center, The City Of Sapporo ](https://cookpad.com/eng/recipes/16211624)。本轮正文/步骤可读。
- 采用与分歧：Cookpad 页面列署名为札幌市丰平保健中心，步骤可读：先炒蛋盛出、炒黄瓜、合锅。只交叉核对这一顺序和瓜片变软信号；不引入其姜、蚝油、酒等调料。没有把账号名当成经过额外身份认证的权威背书。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 13. 芹菜炒香干 · `cn-celery-tofu`

- 原出处：[ 美食天下 · 国民马大姐豆制品 ](https://home.meishichina.com/recipe-604740.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ The Woks of Life · Judy ](https://thewoksoflife.com/vegetable-five-spice-tofu-stir-fry/)。本轮正文/步骤可读。
- 采用与分歧：Woks 补充方是多蔬菜五香豆干炒菜，仅核对香干与芹菜切条、分阶段加热、最后调味。保留现有精简配料；按包装加热、先尝香干咸度，不照搬其他配菜。
- 反馈层级：补充多蔬菜香干方 5/5，7 ratings；不是精简芹菜香干版的评价。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 14. 醋溜白菜 · `cn-vinegar-cabbage`

- 原出处：[ 美食天下 · 淇家的小厨房 ](https://home.meishichina.com/recipe-98042.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/stir-fried-napa-cabbage/)。本轮正文/步骤可读。
- 采用与分歧：Red House Spice 为酸辣白菜，支持厚帮斜切、沥水、淀粉悬液和醋汁。app 没有必需辣椒，仍保留醋溜版本；1 茶匙醋是编辑给新手的保守起点，不是原作者精确配方。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 15. 红烧冬瓜 · `cn-braised-wintermelon`

- 原出处：[ 美食天下 · 大草海 ](https://home.meishichina.com/recipe-475299.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/winter-melons-the-guide-and-recipes/)。本轮正文/步骤可读。
- 采用与分歧：Elaine 的冬瓜指南区分薄片与大块时间，也提醒过煮会碎。采用厚度一致、检查中心软度、水量随锅调整；不采用文中的未经单独验证保健论断，也不加其肉类配料。
- 反馈层级：补充冬瓜指南/配方页显示 5/5，11 votes；不能据此给 app 版本标高分。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 16. 蒜蓉油麦菜 · `cn-garlic-lettuce`

- 原出处：[ 美食天下 · 香香83 ](https://home.meishichina.com/recipe-40371.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ The Woks of Life · Judy ](https://thewoksoflife.com/a-choy-garlic-oyster-sauce/)。本轮正文/步骤可读。
- 采用与分歧：补充 Woks A Choy 方与油麦菜相符，可读切段、充分沥干、蒜香快炒与及时出锅。只用技法，不向精简配方加入蚝油或水芡。
- 反馈层级：补充油麦菜方 4.88/5，8 ratings。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 17. 虎皮青椒 · `cn-tiger-peppers`

- 原出处：[ 美食天下 · 花雨曼陀罗 ](https://home.meishichina.com/recipe-61178.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/chinese-sauteed-green-peppers-tiger-skin-pepper/)。本轮正文/步骤可读。
- 采用与分歧：Elaine 原文支持椒皮贴锅轻压、起皱后加蒜与酸甜汁。采用擦干、单层、少油、中小火，明确焦斑不等于全黑；料汁起点为编辑建议，并要求后续尝味。
- 反馈层级：补充方 5/5，6 votes；样本很少。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 18. 香菇油菜 · `cn-mushroom-rapeseed`

- 原出处：[ 美食天下 · 小艾厨娘 ](https://home.meishichina.com/recipe-175293.html)。本轮原链接未重读；沿用此前记录，原记录日期 2026-11-05。
- 补充资料：[ Made With Lau · Daddy Lau / Randy Lau ](https://www.madewithlau.com/recipes/braised-mushrooms-with-bok-choy)。本轮正文/步骤可读。
- 采用与分歧：Made With Lau 使用泡发干香菇，app 使用鲜香菇。补充材料仅支持菜与菇分别处理、菇熟后组合的逻辑，不能将干菇的 10–15 分钟焖制移植为鲜片计时。页面明确干菇不能直接替代鲜菇照搬用时。
- 反馈层级：未核验可用的独立实做反馈；不宣称本菜热门或高成功率。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 19. 清蒸南瓜 · `cn-steamed-pumpkin`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/清蒸南瓜.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Good Food · Lulu Grimes ](https://www.bbcgoodfood.com/recipes/pumpkin-puree)。本轮正文/步骤可读。
- 采用与分歧：Good Food 的南瓜泥步骤支持均匀切块、蒸后用刀尖检查再延时；只核对蒸熟技法，不采用压泥流程。保留原 15 分钟计时和原阶段，增加蒸架、水位、隔热取盘与厚块复查。
- 反馈层级：补充南瓜泥页面 4.6/5，10 ratings；只证明该页有评分，不是清蒸切片版本的试做反馈。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 20. 清炒花菜 · `cn-cauliflower`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/清炒花菜.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Red House Spice · Wei Guo ](https://redhousespice.com/dry-pot-cauliflower/)。本轮正文/步骤可读。
- 采用与分歧：Red House Spice 的干锅花菜指出松散花菜与紧实花菜焯时不同。只用菜型/厚茎与焯水技法，不引入肉或辣椒；保留原 150/120/60 秒提醒，提前熟了可提前结束，不盲目跑满。
- 反馈层级：补充干锅方 5/5，5 votes；不是清炒版的评价。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 21. 白灼菜心 · `cn-blanched-choysum`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/白灼菜心/白灼菜心.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ Omnivore's Cookbook · Maggie Zhu ](https://omnivorescookbook.com/choy-sum-with-garlic-sauce/)。本轮正文/步骤可读。
- 采用与分歧：Omnivore 白灼菜心支持去老根、按成熟度切段、煮到嫩再沥水浇汁。保留梗先叶后，原 500 毫升水不当成适合所有锅的绝对量。
- 反馈层级：补充方 5/5，1 vote，5 comments；不称其为大量验证。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 22. 凉拌木耳 · `cn-wood-ear-salad`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/凉拌木耳/凉拌木耳.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/wood-ear-mushroom-salad/)。本轮正文/步骤可读。
- 采用与分歧：HowToCook 与 Elaine 均为泡发后煮熟再凉拌，但有 1–2 分钟差异。保留约 2 分钟为参考并按包装/厚度完成加热；泡发安全由食安中心资料单独核对，不用“脆口”“闻着正常”替代安全判断。
- 反馈层级：补充方 5/5，15 votes，25 comments。页面可读到读者 Shea（2024-04-09）称正在食用并喜欢；只是自述，未核验实做。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

### 23. 西葫芦炒鸡蛋 · `cn-zucchini-eggs`

- 原出处：[ HowToCook 中文开源菜谱 · HowToCook 社区贡献者 ](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/西葫芦炒鸡蛋/西葫芦炒鸡蛋.md)。本轮原文可读，原记录日期 2026-11-05。
- 补充资料：[ China Sichuan Food · Elaine ](https://www.chinasichuanfood.com/zucchini-stir-fry/)。本轮正文/步骤可读。
- 采用与分歧：补充方是含肉、盐渍挤水的西葫芦炒法，仅核对其含水多、瓜瓤易软的问题，绝不整套移植。保留原蛋菜分炒与 240 秒首次提醒，不增加 15 分钟盐渍。
- 反馈层级：补充含肉炒瓜方 5/5，9 votes；不是蛋菜版的评价。
- 验证层级：资料与技法核对、编辑检查；未厨房试做。

## 菜篮排序的可靠提示（尚未写入排序模块）

- `cn-wood-ear-salad`：若从干木耳开始，要提前按包装泡发，长时间需冷藏。当前配方量是已泡发木耳，因此不能无条件把泡发时间加进每次做菜总时长。
- `cucumber`：黄瓜和料汁可先准备并分开冷藏，临吃再拌，不能把“冷菜先做”理解成拌好后室温久放。
- `cn-steamed-pumpkin`：有明确 900 秒首次检查点，可先启动蒸制，但仍需留意水量；排序不能自动假设能同时照看无限多个锅。
- 叶菜与炒蛋类适合临近吃饭完成以保持口感；这只是人工读方后的候选建议，不自动覆盖用户菜篮顺序，正式排序需独立审核契约。

## 本批实际检查

- `node --check src/teaching-vegetables-a.js`：通过。
- 导入模块与批次原始快照比较：23/23 ID 覆盖；步骤数量、逐步标题与秒数全相同；全部文字已重写；23/23 至少一条完整补充出处；46 组具体问题/补救。
- 不覆盖 `ingredients` 或 `stateVersion`；8 道原出处未重读的菜均附可见编辑说明。
- 本批未提交、未推送，未修改共享配方入口、界面或测试。整应用单元测试、构建及界面回归由整合任务执行后另行报告。

## 集成复核

集成复核修正：拍黄瓜明确喜欢甜味才加糖；杏鲍菇把可选蒜的炒香时点移至加黄油之前。未改变配料字段和步骤签名。 全应用验证见 [测试记录](TEST_REPORT.md)，不把软件测试当成厨房试做。
