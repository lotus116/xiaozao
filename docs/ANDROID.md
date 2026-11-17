# 小灶安卓安装与构建

当前源码版本为 1.6.0（versionCode 9），应用名“小灶”，包名 `com.xiaozao.kitchen`。工作区已生成测试包 `releases/xiaozao-1.6.0-debug.apk`，下方命令可以再次构建。最低 Android 7.0 / API 24，目标 API 36；系统 Android WebView 需保持更新。

本轮保留 React + Capacitor 架构。2026-11-17 已安装项目本地 JDK 与 Android SDK，成功编译 1.6.0 APK 并运行 Android lint（0 错误、5 警告）。安装包与原有 1.4.0 测试包签名一致，允许覆盖升级，不需要先卸载旧版。真机安装与体验由接下来的手机测试验证。

## 安装

1. 将 APK 通过数据线、文件传输等方式发到安卓手机。
2. 在手机文件管理器中打开 APK。若系统提示，允许当前文件管理器“安装未知应用”，再完成安装。
3. 桌面打开“小灶”。安装后无需电脑、同一 Wi-Fi 或开发服务器。

源码中的 200 道菜谱及其成品实拍、技法对照、食材分类、菜篮和做菜步骤在重新构建的 1.6.0 包内，首次打开也可离线使用；已有 1.4.0 包仍含 99 道。外部来源链接需要联网。食材、调料、常用顺序、收藏和饮食偏好保存在此 App 中，与网页版分开；卸载或清除应用数据会丢失，未提供云同步。

计时器在前台可用，后台恢复时按结束时间校正；当前尚未实现系统闹钟、锁屏通知或保证后台响铃。未连接安卓真机，本轮未做真机安装和厂商系统兼容测试。

## 再次打包

项目使用 Capacitor 8。准备 Node.js 22+、JDK 21、Android SDK（platforms;android-36、build-tools;36.0.0、platform-tools），设置 `JAVA_HOME`、`ANDROID_HOME` 后执行：

```sh
npm ci
npm run android:apk
```

脚本重新构建网页、同步原生工程、运行 `assembleDebug` 与 `lintDebug`，最后将 APK 及 SHA-256 校验文件复制至 `releases/`。如需 Android Studio 查看工程，执行 `npx cap open android`。

本机工具已安装到项目 `.local-build/tools/` 持久目录，构建脚本自动找到 JDK 与 SDK，不依赖临时目录。当前为 Amazon Corretto 21.0.13（Apple Silicon）、Android Platform 36 r2、Build Tools 36.0.0、Platform Tools 37.0.1、Command-line Tools 23.0。下载来自 Corretto 与 Google 官方地址，JDK SHA-256 和命令行工具的官方仓库校验值均已核对。

直接运行 `npm run android:apk` 即可再次打包。如果要在终端单独使用 Java、adb 或 SDK 工具，可先执行 `source .local-build/tools/env.sh`。显式设置的 `JAVA_HOME` / `ANDROID_HOME` 优先；旧临时工具路径仅作回退，空 SDK 或失效 JDK 指针不会被自动选中。Gradle 缓存和原有测试签名密钥仍在 `.local-build/`，工具与密钥均不提交 Git；未修改系统全局 Java 设置。

官方安装资料：[OpenJDK Corretto 21 下载](https://corretto.aws/downloads/latest/amazon-corretto-21-aarch64-macos-jdk.tar.gz)、[Android SDK 工具](https://developer.android.com/tools/sdkmanager)。

保留 `.local-build/debug.keystore` 可以让后续测试包覆盖安装并保留数据。丢失密钥后生成的新包无法直接覆盖旧签名包；卸载旧包会清除数据。正式上架需要单独管理正式签名密钥及发布版本，本次未创建正式签名或发布。

## 原生适配

- 包内静态资源，不配置开发服务器地址。
- 返回键优先收起计时弹层，再返回上页；无历史页面时回到食材页，在首页返回则进入后台。
- 使用 Capacitor 注入的安全区变量避开状态栏、手势导航和屏幕切口。
- 小灶锅形矢量图标，包含旧系统图标、自适应图标和主题单色图标。
- 仅声明联网权限供外部资料链接使用，不请求相机、联系人或定位。

实现依据：[Capacitor 8 升级说明](https://capacitorjs.com/docs/updating/8-0)、[App 插件文档](https://capacitorjs.com/docs/apis/app)，并核对了当前安装包内的原生实现。平台版本由生成的 `android/variables.gradle` 固定。
