# 夜雨音乐 · Android 版

![Build Android APK](https://github.com/<你的GitHub用户名>/yyMusic-android/actions/workflows/build-apk.yml/badge.svg)

基于 **Capacitor 6** 打包的 Android 音乐播放器，前端复用 yyMusic Web 界面，音源通过自建 PHP 代理调用网易云音乐接口。

## 特性

- 搜索、歌单、TOP 榜、歌词、封面
- 播放全部 / 导入歌单
- 歌曲下载（可选保存目录）
- 服务器地址可在 App 内配置，首次启动自动引导
- 支持后台播放与通知栏控制

## 自动构建（GitHub Actions）

推送到 `main` 或 `master` 即自动构建：

1. 打开仓库 **Actions** 页 → **Build Android APK**
2. 等流水线跑完（首次约 3–5 分钟）
3. 在 **Artifacts** 下载 `yeyu-music-debug-apk`

配置 4 个签名 Secrets 后，会额外产出已签名 Release APK（`yeyu-music-release-apk`）。
详细步骤见 [构建说明.md](构建说明.md)。

## 技术结构

| 层 | 说明 |
|---|---|
| 前端 | `www/`（HTML/CSS/JS），由 `cap sync` 同步进 WebView |
| 外壳 | `android/`（Capacitor 原生工程，包名 `com.yeyu.music`） |
| 音源 | 自建 PHP API（Meting + index.php），部署在宝塔服务器 |

## 本地开发

```bash
npm install
npx cap sync android          # 前端 → android 原生工程
# 之后用 Android Studio 打开 android/ 出包
```

## 服务器配置

App 内「设置」填写站点根地址（到 `yyMusic` 这一层，不带 `/API`），例如：

```
https://你的域名/yyMusic
```

> PHP API 需部署在支持 `curl` / `openssl` 的环境，并在 `API/index.php` 顶部填入 VIP Cookie，否则 VIP 歌曲仅有 30 秒试听。
