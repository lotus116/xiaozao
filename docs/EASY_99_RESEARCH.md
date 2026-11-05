# 99 道易做家常菜：选题、研究与简化记录

核对日期：2026-11-05 至 2026-11-06。新增与简化模块为 `src/easy-recipes.js`。

本轮在原 53 道上新增 **46 道**，合计 **99 道**；已有 **43 道**覆盖了配料或步骤。新增为 **33 道菜肴、6 道汤、7 道主食**。本地统计 **97/99 道不超过 5 项必需原料**（不计水，油和盐计入），其余 2 道各 6 项；新增 46 道全部不超过 5 项。这里的“必需少”指准备门槛，不能理解为所有菜都只需几分钟或不需看火。

没有实际试做这些编辑简化版本。营养数据没有可靠依据，不伪造卡路里；本轮新增及修改菜全部 `nutrition: null`。与原有菜按名称核对，无新增重名或重复 ID；炒/蒸/汤等做法有各自的实际来源，未将同一菜仅换名字重复添加。

## 研究与使用边界

- 新菜优先查国内中文实际做法：美食天下作者的食材表、过程和小窍门；通过网络搜索返回的完整原文核对，部分网页直接打开失败时不绕过限制。下面每道菜保留具体 URL 和作者。
- 中文开源补充来自 HowToCook，实际下载原始 Markdown。固定提交 `308cc8b7dab1da84b20e7fafdf836a715437f582`，本地核对路径为 `/tmp/chinese-howtocook-research/dishes/`。[该提交许可证](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/LICENSE) 为 Unlicense，允许修改和再分发，按原样提供。保留社区署名和具体菜谱链接。
- 平台菜谱只短句重述食材、方法、先后等做法事实，不移植图片、故事或整段表达；链接及署名不表示平台或作者授权转载。
- 原有部分英文来源菜沿用应用既有来源，逐项看其配料作用后编辑简化。没有把编辑推断写成“原作者明确可省”；可选原因中注明“编辑简化”。汤、韭菜蛋、土豆丝等有新核对中文做法支持的则更新具体来源。
- 必须区分原文做法与编辑调整：定量食材以原文为基准，部分按 1–2 人配菜量缩放；“约”“适量”的编辑份量不是实测标准。水量会随锅具改变。总分钟数包含备菜，是估计；电饭锅依本机程序，蒸煮依食材厚薄检查熟度。保留原文步骤中可用的阶段时间，但不沿用不安全的“只变色就熟”“固定几分钟必熟”。
- 少数原文盐、糖、油量显著偏多或有笔误，例如 HowToCook 的金针菇汤、黄瓜炒肉、番茄鸡蛋汤，改为少量/尝后调整，不照搬大剂量。原文医疗、养生、减肥等宣称不进入应用。

## 配料为什么可以省

以“主体能成菜、关键味道保留”为准，而非“原表列出就必须”。一般的葱姜蒜、白胡椒、料酒、鸡精、香油、少糖，以及只负责颜色的老抽，未构成菜名特征时可选。淀粉仅用于滑嫩/薄挂汁时可省；真正名为“羹”的菜仍保留形成稠度的淀粉。生抽已有咸味时额外盐可选。每项可选均有用途原因，步骤明确没有时跳过。

明确保留：蚝油生菜的蚝油、蒜蓉菜的蒜、麻婆豆腐的辣豆瓣与花椒、酸辣土豆丝的醋和辣椒、酱油饭的酱油、蜜汁鸡的蜂蜜、豆豉菜的豆豉。没有把所有调料一律设为可选。

重点反馈已落实：

- 番茄蛋花汤只必须有番茄、鸡蛋、食用油、盐和水；去高汤、淀粉、胡椒门槛。
- [清淡蛋花汤原文](https://home.meishichina.com/recipe-486055.html)（花式炒咸菜）直接用清水打蛋，作者说明附加调味随意。应用使用鸡蛋、水、盐的清汤版，香油/香菜可选。
- 原“姜蒜炒小白菜”改成“清炒小白菜”，只需小白菜、油盐，姜蒜可选；“蒜蓉小白菜”仍保留蒜这个特征原料。
- 原“葱香蛋炒饭”改成“家常蛋炒饭”：熟米饭、蛋、油盐即可；原“葱香酱油煎蛋饭”改“酱油煎蛋饭”，葱可选。
- 韭菜炒蛋替换为中文四原料版本，酸辣土豆丝从复杂长流程改为约 20 分钟版本。
- 原有蛋饭、肉片、虾仁、小炒普遍去掉“没有一点胡椒/糖/料酒就不可做”的限制。

库存名称尽量统一：豆腐煎炒明确为老豆腐、汤羹/嫩拌明确为嫩豆腐；现有黄瓜炒鸡蛋保留花生油，香油保留其具体名称。部分新增家常简化版用“食用油”表达烹调用油类别，例如清炒丝瓜原文使用花生油；该泛称不表示无致敏成分，用户仍需核对实际用油及包装。泛称醋、淀粉若原文没有说明品种不编造品种。新增豆腐皮、鲜香菇、鸡腿肉、猪瘦肉等采用一致名称。可选配料仍参与过敏判断，是否跳过不能默认代表安全。

## 新增 46 道的具体来源

表中必需数不计水。每道至少 3 个自然步骤。用量为原方保留/缩放或明确标约的编辑建议，总时间和份数为编辑估计。

| 菜名 | 分类 | 必需数 | 来源 |
| --- | --- | ---: | --- |
| 蚝油生菜 | 菜肴 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/蚝油生菜.md) |
| 菠菜炒鸡蛋 | 菜肴 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/菠菜炒鸡蛋/菠菜炒鸡蛋.md) |
| 苦瓜炒鸡蛋 | 菜肴 | 4 | [美食天下 · 莼菜虾仁](https://home.meishichina.com/recipe-25079.html) |
| 清炒莴笋 | 菜肴 | 3 | [美食天下 · 小岚私厨](https://home.meishichina.com/recipe-392379.html) |
| 清炒藕片 | 菜肴 | 3 | [美食天下 · 覀覀：ナ0ナ](https://home.meishichina.com/space-180108-do-blog-id-251855.html) |
| 清炒绿豆芽 | 菜肴 | 3 | [美食天下 · 花鱼儿](https://home.meishichina.com/recipe-135705.html) |
| 韭菜炒豆芽 | 菜肴 | 4 | [美食天下 · 爱做饭的小媛媛](https://home.meishichina.com/recipe-401816.html) |
| 白菜炖豆腐 | 菜肴 | 3 | [美食天下 · 敏zhu](https://home.meishichina.com/recipe-571358.html) |
| 家常麻婆豆腐 | 菜肴 | 4 | [美食天下 · 斋厨房](https://home.meishichina.com/recipe-536153.html) |
| 皮蛋豆腐 | 菜肴 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/皮蛋豆腐.md) |
| 凉拌金针菇 | 菜肴 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/凉拌金针菇.md) |
| 清蒸茄子 | 菜肴 | 3 | [美食天下 · 康康1818](https://home.meishichina.com/recipe-211546.html) |
| 茄子炖土豆 | 菜肴 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/vegetable_dish/茄子炖土豆.md) |
| 清炒丝瓜 | 菜肴 | 3 | [美食天下 · 斌joanliu](https://home.meishichina.com/recipe-629648.html) |
| 丝瓜炒鸡蛋 | 菜肴 | 4 | [美食天下 · 芊芊美食记WQ](https://home.meishichina.com/recipe-608213.html) |
| 蒜蓉蒸金针菇 | 菜肴 | 4 | [美食天下 · 鑫姐厨房](https://home.meishichina.com/recipe-611495.html) |
| 豆豉鲮鱼油麦菜 | 菜肴 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/豆豉鲮鱼油麦菜/豆豉鲮鱼油麦菜.md) |
| 土豆片炒肉 | 菜肴 | 5 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/瘦肉土豆片/瘦肉土豆片.md) |
| 黄瓜炒肉 | 菜肴 | 5 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/黄瓜炒肉.md) |
| 洋葱炒肉片 | 菜肴 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/洋葱炒猪肉.md) |
| 青椒炒肉 | 菜肴 | 5 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/辣椒炒肉.md) |
| 香菇蒸鸡 | 菜肴 | 4 | [美食天下 · fangqao](https://home.meishichina.com/recipe-310492.html) |
| 肉饼炖蛋 | 菜肴 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/肉饼炖蛋.md) |
| 荷兰豆炒腊肠 | 菜肴 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/荷兰豆炒腊肠/荷兰豆炒腊肠.md) |
| 冬瓜虾皮汤 | 汤羹 | 4 | [美食天下 · 米拉Miira](https://home.meishichina.com/recipe-405641.html) |
| 黄瓜皮蛋汤 | 汤羹 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/黄瓜皮蛋汤.md) |
| 金针菇清汤 | 汤羹 | 2 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/金针菇汤.md) |
| 玉米排骨汤 | 汤羹 | 3 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/玉米排骨汤/玉米排骨汤.md) |
| 海带豆腐汤 | 汤羹 | 4 | [美食天下 · 卤蛋厨房](https://home.meishichina.com/recipe-593910.html) |
| 昂刺鱼豆腐汤 | 汤羹 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/昂刺鱼豆腐汤/昂刺鱼豆腐汤.md) |
| 番茄炒虾仁 | 菜肴 | 4 | [美食天下 · 金娃美食](https://home.meishichina.com/recipe-91560.html) |
| 蒜蓉粉丝蒸娃娃菜 | 菜肴 | 5 | [美食天下 · RLing](https://home.meishichina.com/recipe-615129.html) |
| 清蒸红薯 | 主食 | 1 | [美食天下 · 花式炒咸菜](https://home.meishichina.com/recipe-489880.html) |
| 香菇鸡肉焖饭 | 主食 | 5 | [美食天下 · 桃子所](https://home.meishichina.com/recipe-250160.html) |
| 土豆焖饭 | 主食 | 4 | [美食天下 · 花桑卓玛](https://home.meishichina.com/recipe-304244.html) |
| 南瓜粥 | 主食 | 2 | [美食天下 · 金娃美食](https://home.meishichina.com/recipe-94113.html) |
| 鸡蛋面糊饼 | 主食 | 4 | [美食天下 · 果妈美食坊](https://home.meishichina.com/recipe-250123.html) |
| 懒人水煎饺 | 主食 | 2 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/breakfast/煎饺.md) |
| 皮蛋瘦肉粥 | 主食 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/soup/皮蛋瘦肉粥.md) |
| 凉拌海带丝 | 菜肴 | 3 | [美食天下 · 丽彩（五谷杂粮）](https://home.meishichina.com/recipe-631161.html) |
| 清蒸山药 | 菜肴 | 1 | [美食天下 · gaopingzhao](https://home.meishichina.com/recipe-18630.html) |
| 蒜蓉蒸丝瓜 | 菜肴 | 4 | [美食天下 · lin悠然](https://home.meishichina.com/recipe-466993.html) |
| 香煎鸡胸肉 | 菜肴 | 3 | [美食天下 · 晚妈美食](https://home.meishichina.com/recipe-650262.html) |
| 豉汁蒸排骨 | 菜肴 | 4 | [HowToCook 中文开源菜谱 · HowToCook 社区贡献者](https://github.com/Anduin2017/HowToCook/blob/308cc8b7dab1da84b20e7fafdf836a715437f582/dishes/meat_dish/豉汁排骨.md) |
| 清炒平菇 | 菜肴 | 3 | [美食天下 · 小乙美食](https://home.meishichina.com/recipe-577744.html) |
| 凉拌豆腐皮 | 菜肴 | 3 | [美食天下 · 香香的小厨房](https://home.meishichina.com/recipe-338114.html) |

## 原有 43 道的审查结果

以下是覆盖后的必需数与可选项。对应步骤同步重写，不会一边标可选、一边要求用户必须加入。未改已足够简洁的番茄炒蛋、蒸蛋、清炒花菜等菜，避免无意义改动。

| 原 ID | 当前菜名 | 必需数 | 可选配料 |
| --- | --- | ---: | --- |
| tomato-soup | 番茄蛋花汤 | 4 | 葱 |
| egg-soup | 清香蛋花汤 | 2 | 香油、香菜 |
| fried-rice | 家常蛋炒饭 | 4 | 葱、生抽 |
| chive-eggs | 韭菜炒鸡蛋 | 4 | 无 |
| bok-choy | 清炒小白菜 | 3 | 姜、蒜、白胡椒粉、玉米淀粉、香油、味精 |
| scallion-noodles | 葱油拌面 | 4 | 老抽、糖 |
| cucumber | 蒜香拍黄瓜 | 4 | 盐、糖、香油、辣椒油、熟芝麻、香菜 |
| cold-tofu | 家常凉拌豆腐 | 2 | 葱、蒜、香油、醋、糖、辣椒油 |
| honey-chicken | 蜜汁鸡丁 | 4 | 面粉、姜、蒜、柠檬、盐、黑胡椒粉 |
| garlic-bok | 蒜蓉小白菜 | 4 | 白胡椒粉、糖 |
| mushroom | 黄油酱香杏鲍菇 | 4 | 老抽、蜂蜜、蒜、黑胡椒粉、葱 |
| soy-eggs | 酱油煎蛋饭 | 4 | 葱、糖、料酒 |
| tomato-noodles | 番茄蛋花汤面 | 5 | 蒜、葱、鸡高汤、生抽、白胡椒粉、香油 |
| crispy-noodles | 香辣两面黄 | 4 | 香油 |
| soy-rice | 酱油炒饭 | 4 | 鱼露、老抽、料酒、糖、蚝油、盐、葱 |
| garlic-broccoli | 蒜香西兰花 | 4 | 蚝油、糖 |
| shrimp-eggs | 虾仁炒鸡蛋 | 4 | 白胡椒粉、香油、葱 |
| bacon-rice | 培根蛋炒饭 | 5 | 洋葱、糖、生抽、老抽、黑胡椒粉、葱、料酒 |
| broccoli-tofu | 西兰花烧豆腐 | 4 | 鸡高汤、老抽、料酒、香油、糖、蒜、玉米淀粉 |
| cabbage | 手撕包菜（素版） | 3 | 蒜、干辣椒、料酒、生抽、糖、陈醋、葱 |
| cabbage-noodles | 包菜炒粉丝 | 4 | 老抽、陈醋、白胡椒粉、香油、糖、姜、蒜、盐、葱、干辣椒 |
| beef-noodles | 菠菜肉末拌面 | 5 | 洋葱、蒜、盐、黑胡椒粉、老抽、香油、蜂蜜、辣椒油 |
| hot-noodles | 青菜油泼面 | 6 | 老抽、盐、葱、香菜、蒜 |
| ginger-shrimp | 姜葱炒虾仁 | 5 | 料酒、香油、白胡椒粉、糖、生抽 |
| cn-celery-tofu | 芹菜炒香干 | 4 | 青椒、蒜、糖、生抽、淀粉、香油 |
| cn-celery-mince | 肉末香干炒芹菜 | 5 | 姜、蒜、料酒、花椒粉、盐 |
| cn-vinegar-cabbage | 醋溜白菜 | 4 | 生抽、糖、花椒粉、葱、淀粉、鸡精 |
| cn-braised-wintermelon | 红烧冬瓜 | 3 | 青椒、姜 |
| cn-garlic-lettuce | 蒜蓉油麦菜 | 4 | 生抽、鸡精 |
| cn-tiger-peppers | 虎皮青椒 | 5 | 蒜、盐 |
| cn-mushroom-rapeseed | 香菇油菜 | 4 | 葱、糖、生抽 |
| cn-garlic-shoot-pork | 蒜苔炒肉丝 | 4 | 生抽、淀粉 |
| cn-blanched-choysum | 白灼菜心 | 3 | 蚝油、盐、糖、蒜、小米辣、姜、洋葱 |
| cn-cola-wings | 可乐鸡翅 | 4 | 糖、盐、姜、料酒、葱、老抽 |
| cn-radish-soup | 白萝卜丝清汤 | 2 | 白胡椒粉、味精、香油、葱 |
| cn-tomato-tofu-soup | 番茄豆腐蛋花羹 | 6 | 鸡精、葱、姜 |
| cn-wood-ear-salad | 凉拌木耳 | 3 | 蒜、小米辣、盐、糖、香油、芥末 |
| cn-onion-eggs | 洋葱炒鸡蛋 | 4 | 料酒、葱 |
| cn-water-spinach | 蒜蓉空心菜 | 4 | 糖、生抽 |
| cn-scallion-tofu | 葱煎豆腐 | 4 | 青椒、鸡精 |
| cn-boiled-corn | 水煮玉米 | 1 | 盐、糖 |
| cn-steamed-perch | 清蒸鲈鱼 | 5 | 盐 |
| potatoes | 酸辣土豆丝 | 5 | 蒜、青椒 |

仅青菜油泼面（面、青菜、生抽、陈醋、辣椒碎、油）和番茄豆腐蛋花羹（番茄、蛋、嫩豆腐、油、盐、淀粉）为 6 项必需；前者保留酸辣油泼特征，后者保留羹的稠度，而不是为满足数字强行删掉关键原料。

## 值得延续的实际做饭习惯

1. **默认先给基础版，再展开添香选项。** [清炒丝瓜](https://home.meishichina.com/recipe-629648.html)（斌joanliu）明确喜欢只放盐、不放葱姜蒜；[清炒莴笋](https://home.meishichina.com/recipe-392379.html)（小岚私厨）只需要莴笋、油、盐。说明“不会买调料”不应该阻止用户开始做菜。
2. **一个电饭锅任务可合并饭菜，但时间不能装成快手。** [土豆焖饭](https://home.meishichina.com/recipe-207146.html)（食尚煮易）说明饭菜一起煮可少洗锅；本批的焖饭/粥标实际程序估时，排骨汤标 90 分钟，少动手与短时间分别表达。
3. **分阶段计时并显示状态检查。** [蒸红薯](https://home.meishichina.com/recipe-489880.html)（花式炒咸菜）直接对比大小红薯需要不同时长，用筷子穿透判断；计时结束应该提醒检查而非宣告熟透。
4. **先备料再开火。** [清炒绿豆芽](https://home.meishichina.com/recipe-543914.html)（咖啡私房菜）提示调料预先准备以便连续快炒；可将必需备菜清单放在第一步，让可选配料单独展开。
5. **提示配料作用与整组跳过。** [凉拌豆腐皮](https://home.meishichina.com/recipe-315368.html)（西贝爱咖啡）明确糖只是提味、难掌握可不放。适合界面展示“为什么可省”，而不是只打一个问号让新手猜。

## 熟度和已做验证

熟度提示另外核对 [FoodSafety.gov 最低中心温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)：鸡肉 74°C、肉末 71°C、鱼 63°C；虾肉应不透明、鸡蛋凝固。来源菜谱的颜色和几分钟提示不足以替代这些检查。炒饭使用妥善冷藏熟饭并充分热透；皮蛋瘦肉粥不采用原文的生肉长时间常温预约或整夜不明温度保温建议。

本地数据验证：99 个唯一 ID、99 个唯一菜名；46 个新增均有完整来源、至少 3 步、可选原因、分类和空营养数据；43 个覆盖均有同步步骤与来源。97 道最多 5 个必需项，新增全部满足。浏览器流程与应用回归由主线程负责，本报告不冒称试做验证或医疗营养审核。
