# 文档索引与当前状态

更新：2026-11-18（香港）。当前版本 1.7.0 / versionCode 13；1.6.3 保留为离线阶段发布，饭友圈首版已实现。

| 当前文档 | 用途 |
| --- | --- |
| [PRD](PRD.md) | 已实现基线与已确认的下一阶段需求 |
| [工程设计](DESIGN.md) | 架构、目录和存储 |
| [页面交互](UI_DESIGN.md) | 最新约定在前，旧版本设计保留 |
| [执行计划](EXECUTION_PLAN.md) | 已完成阶段与下一阶段门槛 |
| [安卓安装](ANDROID.md) | 当前 APK、工具链及签名 |
| [测试记录](TEST_REPORT.md) | 1.6.3 证据与历史版本记录 |
| [阶段发布说明](RELEASE_1.6.3.md) | 安装包、校验与边界 |
| [1.7.0 测试版说明](RELEASE_1.7.0.md) / [交付审查](REVIEW_1.7.0.md) | 饭友圈与 Windows 包 |
| [饭友圈决策记录](COMMUNITY_PRD.md) | 已确认选项；具体需求统一见主 PRD |
| [逐菜来源](RECIPE_SOURCES.md) / [验收页](CATALOG_REVIEW.html) | 当前 300 道内容入口 |

## 当前基线

开发版 300 道、931 步，无营养估算值；内置照片、原色、A 标志与轻量顶部栏保留，底部包含饭友圈和我的。账号、服务、社区下载、手动配置备份已实现；自动同步和后台／锁屏提醒未实现。“不限食材”文案未改名。

1.7.0：104 单元／服务端测试、414 浏览器测试通过；构建与边界见测试记录，不代表真实 Windows、安卓真机或逐菜烹饪验收。

[饭友圈交互约定](COMMUNITY_INTERACTIONS.md) · [Windows 一键部署教程](WINDOWS_SERVER.md)

[原有 200 道来源与配图复查](CATALOG_200_SOURCE_RECHECK.md)。全库含 299 种非水食材与调料，首页输入和选菜推荐从实际菜谱生成食材范围。

## 历史和专题

[200 道扩充](EXPANDED_200_RESEARCH.md)记录 1.6.0 的新增 101 道，内容继续适用。[顺序建议](MEAL_ORDER_PLANNING.md)的元数据仅覆盖明确核对的部分菜谱，不等于全库智能排程。

99 道研究、教学批次、国内来源核对等保留当时子集与证据；新增菜另见 200 道研究。ITERATION_PLAN、KITCHEN_WORKFLOW、OVERNIGHT_ITERATION、REAL_COOKING_ITERATION 是历史迭代，不是新的执行指令。

PRD_INITIAL、DESIGN_INITIAL、EXECUTION_PLAN_INITIAL 保留初期原文，其中旧配色、旧数量、未发布状态和代理执行指令不再适用。未跟踪的本地评审稿、outputs 和 xiaozao-film 未纳入阶段发布。
