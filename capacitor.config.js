// Capacitor 配置：夜雨音乐 Android 版
// webDir 指向 www/（前端静态资源），由 cap sync 同步进 android 原生工程
const config = {
  appId: 'com.yeyu.music',
  appName: '夜雨音乐',
  webDir: 'www',
  server: {
    // 使用 https scheme 加载本地前端，避免与 https 服务器之间的混合内容拦截
    androidScheme: 'https'
  }
};

module.exports = config;
