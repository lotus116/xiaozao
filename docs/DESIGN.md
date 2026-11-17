# 当前界面与工程设计

基线 1.6.3，2026-11-17。初期设计见 [DESIGN_INITIAL](DESIGN_INITIAL.md)，不再作为当前颜色或导航依据。

## 架构与界面

React 19 + Vite 7，Capacitor 8 安卓包装。业务数据和资源随 APK 打包，无业务后端、账号或在线菜谱 API；网页尚无离线缓存。localStorage 保存带版本的本地状态，各设备／浏览器独立。

暖白 #fffdf8、番茄红 #b83225、深棕 #38251d、提示黄 #fff0b8。正文系统中文字体，A Logo 为固定矢量笔画。顶部左侧 Logo、右侧找菜／设置；底部食材／找菜／菜篮／收藏。主要触点至少 48px，跟做使用独立工具栏。细节见 [UI_DESIGN](UI_DESIGN.md)。

照片随包提供并署名。前台音频在 App 层统一控制，切页不重复创建声音；退后台停止播放，后台／锁屏提醒未实现。

## 代码位置

- `src/recipes.js` 汇总菜谱，具体内容文件以该文件实际导入为准。
- `src/logic.js` 推荐和状态清洗；`src/navigation.js` 列表条件、历史返回与滚动。
- `src/Basket.jsx`、`src/meal.js` 菜篮与当前一餐；`src/meal-planning.js` 等文件处理顺序建议。
- `src/Cooking.jsx` 跟做；`src/TimerWidget.jsx`、`src/timer-audio.js`、`src/useTimerSound.js` 处理计时和音频。
- `src/ingredient-status.js`、`src/PantryLabels.jsx` 食材标记；`src/preferences.js` 饮食限制。
- `scripts/generate-brand.mjs` 同步网页及安卓标志；`scripts/build-android.mjs` 构建、lint 与复制 APK。
- `src/dish-photos.json` 登记图片；来源清单和验收页由 `scripts/source-ledger.mjs`、`scripts/catalog-review.mjs` 生成，不能替代人工核对。

饭友圈拟增加独立后端、数据库与图片存储，不重写现有前端。账号隔离、同步覆盖、下载版本规则尚待 PRD 确认，本阶段不引入相关代码。
