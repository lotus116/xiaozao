# 当前界面与工程设计

当前 1.7.0，2026-11-18，离线能力继承 1.6.3。初期设计见 [DESIGN_INITIAL](DESIGN_INITIAL.md)，不再作为当前颜色或导航依据。

## 架构与界面

React 19 + Vite 7，Capacitor 8 安卓包装。内置菜谱和资源随 APK 打包；Node.js 内置 HTTP／SQLite 提供社区服务，图片保存在独立目录。网页尚无应用外壳离线缓存。localStorage 保存厨房状态和连接凭证，IndexedDB 保存下载与按账号隔离的草稿，各设备／浏览器独立。

暖白 #fffdf8、番茄红 #b83225、深棕 #38251d、提示黄 #fff0b8。正文系统中文字体，A Logo 为固定矢量笔画。顶部左侧 Logo、右侧找菜／设置；底部我的食材／找菜谱／菜篮／饭友圈／我的，收藏从“我的”进入。主要触点至少 48px，跟做使用独立工具栏。细节见 [UI_DESIGN](UI_DESIGN.md)。

照片随包提供并署名。前台音频在 App 层统一控制，切页不重复创建声音；退后台停止播放，后台／锁屏提醒未实现。

## 代码位置

- `src/recipes.js` 汇总菜谱，具体内容文件以该文件实际导入为准。
- `src/logic.js` 推荐和状态清洗；`src/navigation.js` 列表条件、历史返回与滚动。
- `src/Basket.jsx`、`src/meal.js` 菜篮与当前一餐；`src/meal-planning.js` 等文件处理顺序建议。
- `src/Cooking.jsx` 跟做；`src/TimerWidget.jsx`、`src/timer-audio.js`、`src/useTimerSound.js` 处理计时和音频。
- `src/ingredient-status.js`、`src/PantryLabels.jsx` 食材标记；`src/preferences.js` 饮食限制。
- `scripts/generate-brand.mjs` 同步网页及安卓标志；`scripts/build-android.mjs` 构建、lint 与复制 APK。
- `src/dish-photos.json` 登记图片；来源清单和验收页由 `scripts/source-ledger.mjs`、`scripts/catalog-review.mjs` 生成，不能替代人工核对。

## 社区边界

- `server/app.mjs`：鉴权、菜谱、评论、举报、备份；密码 scrypt，随机会话令牌仅哈希落库，校验过期与退出。管理员在电脑本地创建，禁止公开抢注。
- `shared/community-schema.js`：共享字段限制；服务端独立检查图片签名、类型、体积、权限与版本冲突。
- `src/Community.jsx`、`community-api.js`：页面、确认和请求取消；服务切换不发送旧凭证。
- `src/community-store.js`：完整下载后事务保存；启动读取下载再清洗厨房状态，保留下载菜的进度与收藏。ID 包含服务实例和菜谱编号，避免不同服务碰撞。
- `deployment/windows`、`scripts/package-windows.mjs`：带运行时的部署包、临时 HTTPS 通道和停机备份。见[交互约定](COMMUNITY_INTERACTIONS.md)、[Windows 教程](WINDOWS_SERVER.md)。
