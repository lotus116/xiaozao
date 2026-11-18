# 小灶安卓安装与构建

当前源码版本为 1.7.0（versionCode 13），应用名“小灶”，包名 `com.xiaozao.kitchen`。GitHub v1.7.0 发布包为 `releases/xiaozao-1.7.0-debug.apk`，包含 200 道。此后的 300 道开发预览包另存为 `releases/xiaozao-300-debug.apk`，与发布包沿用同一版本号和签名。下方命令构建当前源码。最低 Android 7.0 / API 24，目标 API 36；系统 Android WebView 需保持更新。

本轮保留 React + Capacitor 架构。项目本地 JDK 与 Android SDK 已就绪，1.6.3 启用确认的轻量顶部工具栏，右侧新增找菜入口并整理设置按钮；保留 1.6.2 的 A「小字蒸汽锅」桌面／圆形／单色图标和启动页。签名沿用原有测试包，覆盖升级不需要先卸载旧版。构建及验证细节见[测试记录](TEST_REPORT.md)，真机安装与体验仍由手机测试确认。

[下载 v1.7.0 测试包](https://github.com/lotus116/xiaozao/releases/tag/v1.7.0) · [文档索引](INDEX.md)

## 安装

1. 将 APK 通过数据线、文件传输等方式发到安卓手机。
2. 在手机文件管理器中打开 APK。若系统提示，允许当前文件管理器“安装未知应用”，再完成安装。
3. 桌面打开“小灶”。安装后无需电脑、同一 Wi-Fi 或开发服务器。

内置 200 道菜谱、照片和教学随 1.7.0 包提供，首次可离线使用。饭友圈中完整下载的用户菜谱与图片也可离线跟做。食材、调料、常用顺序、收藏和饮食偏好保存在本机，与网页版分开，可在饭友圈账号页手动备份／恢复；卸载或清除数据会丢失本机内容。备份不包含下载文件、当前一餐和计时器，未提供自动同步。

计时器保留悬浮、拖动、长按隐藏与设置恢复。1.6.1 新增前台响铃，默认开启，可在厨房设置关闭或试听；声音受手机媒体音量影响。到时点“知道了，结束计时”停止，延长或关闭开关也停止声音；隐藏悬浮图标不停止前台提醒。进入后台停止播放，回到前台按结束时间校正，未确认的到点计时可继续提醒。音频受阻时可点“重试提示音”。当前未实现后台响铃、系统闹钟和锁屏通知。尚未做真机安装、真实扬声器或厂商系统兼容测试。

## 再次打包

项目使用 Capacitor 8。准备 Node.js 24+、JDK 21、Android SDK（platforms;android-36、build-tools;36.0.0、platform-tools），设置 `JAVA_HOME`、`ANDROID_HOME` 后执行：

```sh
npm ci
npm run android:apk
```

脚本重新构建网页、同步原生工程、运行 `assembleDebug` 与 `lintDebug`，最后将 APK 及 SHA-256 校验文件复制至 `releases/`。如需 Android Studio 查看工程，执行 `npx cap open android`。

本机工具已安装到项目 `.local-build/tools/` 持久目录，构建脚本自动找到 JDK 与 SDK，不依赖临时目录。当前为 Amazon Corretto 21.0.13（Apple Silicon）、Android Platform 36 r2、Build Tools 36.0.0、Platform Tools 37.0.1、Command-line Tools 23.0。下载来自 Corretto 与 Google 官方地址，JDK SHA-256 和命令行工具的官方仓库校验值均已核对。

直接运行 `npm run android:apk` 即可再次打包。如果要在终端单独使用 Java、adb 或 SDK 工具，可先执行 `source .local-build/tools/env.sh`。显式设置的 `JAVA_HOME` / `ANDROID_HOME` 优先；旧临时工具路径仅作回退，空 SDK 或失效 JDK 指针不会被自动选中。Gradle 缓存和原有测试签名密钥仍在 `.local-build/`，工具与密钥均不提交 Git；未修改系统全局 Java 设置。

官方安装资料：[OpenJDK Corretto 21 下载](https://corretto.aws/downloads/latest/amazon-corretto-21-aarch64-macos-jdk.tar.gz)、[Android SDK 工具](https://developer.android.com/tools/sdkmanager)。

保留 `.local-build/debug.keystore` 可以让后续测试包覆盖安装并保留数据。丢失密钥后生成的新包无法直接覆盖旧签名包；卸载旧包会清除数据。正式上架需要单独管理正式签名密钥及发布版本，本次 GitHub 阶段发布使用测试签名，不属于应用商店正式发行。

## 原生适配

- 包内静态资源，不配置开发服务器地址。
- 返回键优先收起计时弹层，再返回上页；无历史页面时回到食材页，在首页返回则进入后台。
- 使用 Capacitor 注入的安全区变量避开状态栏、手势导航和屏幕切口。
- A「小字蒸汽锅」矢量图标，包含旧系统图标、自适应图标和主题单色图标；启动页使用独立透明红色标志。几何源在 `scripts/generate-brand.mjs`，更新后运行它可同步生成网页与安卓资源。
- 仅声明联网权限用于社区服务和外部资料链接，不请求相机、联系人或定位。图片通过系统文件选择器选择。

## 饭友圈连接

底部饭友圈 → 账号 → 填写 Windows 服务的 HTTPS 地址。部署见 [Windows 教程](WINDOWS_SERVER.md)。游客可下载，发布、评论和手动备份需登录。原内置功能和悬浮计时器不依赖服务在线。

实现依据：[Capacitor 8 升级说明](https://capacitorjs.com/docs/updating/8-0)、[App 插件文档](https://capacitorjs.com/docs/apis/app)，并核对了当前安装包内的原生实现。平台版本由生成的 `android/variables.gradle` 固定。
