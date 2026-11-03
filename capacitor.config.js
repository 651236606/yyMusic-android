// Capacitor 配置：夜雨音乐 Android 版
// webDir 指向 www/（前端静态资源），由 cap sync 同步进 android 原生工程
const config = {
  appId: 'com.yeyu.music',
  appName: '夜雨音乐',
  webDir: 'www',
  server: {
    // 用 http scheme 加载本地前端。
    // 若用 https（默认），页面 origin 为 https://localhost，
    // 此时向 http://服务器IP/API/ 发请求会被 WebView 按「混合内容」拦截，
    // 表现为无论地址怎么填都「无法连接到服务器」。
    // 改为 http 后，http 接口、<audio>、图片、fetch 均可正常访问。
    androidScheme: 'http'
  },
  android: {
    // 允许请求明文 http（配合 AndroidManifest 的 usesCleartextTraffic）
    allowMixedContent: true
  }
};

module.exports = config;
