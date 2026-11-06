# 小灶安卓安装与构建

本轮交付 `releases/xiaozao-1.3.0-debug.apk`，应用名“小灶”，包名 `com.xiaozao.kitchen`，版本 1.3.0（versionCode 4）。最低 Android 7.0 / API 24，目标 API 36；系统 Android WebView 需保持更新。这是供本机安装体验的测试签名包，尚未提交应用商店。

## 安装

1. 将 APK 通过数据线、文件传输等方式发到安卓手机。
2. 在手机文件管理器中打开 APK。若系统提示，允许当前文件管理器“安装未知应用”，再完成安装。
3. 桌面打开“小灶”。安装后无需电脑、同一 Wi-Fi 或开发服务器。

99 道菜谱及其成品实拍、技法对照、食材分类、菜篮和做菜步骤均在包内，首次打开也可离线使用。外部来源链接需要联网。食材、调料、常用顺序、收藏和饮食偏好保存在此 App 中，与网页版分开；卸载或清除应用数据会丢失，未提供云同步。

计时器在前台可用，后台恢复时按结束时间校正；当前尚未实现系统闹钟、锁屏通知或保证后台响铃。未连接安卓真机，本轮未做真机安装和厂商系统兼容测试。

## 再次打包

项目使用 Capacitor 8。准备 Node.js 22+、JDK 21、Android SDK（platforms;android-36、build-tools;36.0.0、platform-tools），设置 `JAVA_HOME`、`ANDROID_HOME` 后执行：

```sh
npm ci
npm run android:apk
```

脚本重新构建网页、同步原生工程、运行 `assembleDebug` 与 `lintDebug`，最后将 APK 及 SHA-256 校验文件复制至 `releases/`。如需 Android Studio 查看工程，执行 `npx cap open android`。

此电脑本轮单独下载的 JDK、SDK 位于 `/tmp/little-kitchen-android-tools`，脚本在未配置环境变量时自动使用它们。临时目录可能被系统清理，届时安装工具或重新设置环境变量即可。Gradle 缓存和测试签名密钥位于项目的 `.local-build/`，都不会提交 Git；构建脚本不修改系统 Java 设置。

保留 `.local-build/debug.keystore` 可以让后续测试包覆盖安装并保留数据。丢失密钥后生成的新包无法直接覆盖旧签名包；卸载旧包会清除数据。正式上架需要单独管理正式签名密钥及发布版本，本次未创建正式签名或发布。

## 原生适配

- 包内静态资源，不配置开发服务器地址。
- 返回键优先收起计时弹层，再返回上页；无历史页面时回到食材页，在首页返回则进入后台。
- 使用 Capacitor 注入的安全区变量避开状态栏、手势导航和屏幕切口。
- 小灶锅形矢量图标，包含旧系统图标、自适应图标和主题单色图标。
- 仅声明联网权限供外部资料链接使用，不请求相机、联系人或定位。

实现依据：[Capacitor 8 升级说明](https://capacitorjs.com/docs/updating/8-0)、[App 插件文档](https://capacitorjs.com/docs/apis/app)，并核对了当前安装包内的原生实现。平台版本由生成的 `android/variables.gradle` 固定。
