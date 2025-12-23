# MP4转GIF工具

安装：全局安装 Node插件 Live Server
或者Vscode 安装插件 Live Server
启动：live-server


## 项目介绍

一个基于`gif.js`库开发的纯前端MP4转GIF工具，无需后端服务器支持，所有转换操作均在浏览器端完成。

**标签：** `前端工具` `视频转换` `gif.js` `纯JavaScript` `浏览器端`

## 项目特性

- 🎨 **纯前端实现**：无需后端服务器，所有转换操作在浏览器中完成
- 📁 **本地处理**：视频文件不会上传到任何服务器，保护隐私安全
- 🚀 **简单易用**：直观的操作界面，只需几步即可完成转换
- ⚡ **高效转换**：使用Web Worker技术，转换过程不阻塞主线程
- 🎯 **自动优化**：默认限制视频时长5秒，生成高质量GIF文件

**标签：** `本地处理` `隐私安全` `Web Worker` `高效` `自动优化`

## 技术栈

- **HTML5**：页面结构和媒体处理
- **JavaScript**：核心转换逻辑
- **gif.js**：GIF编码库（版本0.2.0）
- **CSS3**：页面样式

**标签：** `HTML5` `JavaScript` `gif.js` `Web Worker` `CSS3`


### 初始化GIF编码器

```javascript
const gif = new GIF({
    workers: 2,          // 使用2个Web Worker线程
    quality: 10,         // 质量设置
    width: canvas.width, // GIF宽度
    height: canvas.height, // GIF高度
    frameRate: 5,        // 帧率
    autoCleanup: false   // 手动清理内存
});
```

**标签：** `核心代码` `GIF编码`

### 逐帧处理

```javascript
for (let i = 0; i < frameCount; i++) {
    // 定位到视频的特定时间点
    video.currentTime = i / frameRate;
    
    // 绘制视频帧到Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 添加帧到GIF编码器
    gif.addFrame(ctx, { delay: 100, copy: true });
}
```

### 生成和下载

```javascript
gif.on('finished', (blob) => {
    // 创建Blob URL
    const gifBlobUrl = URL.createObjectURL(blob);
    
    // 创建下载链接
    const downloadBtn = document.createElement('a');
    downloadBtn.href = gifBlobUrl;
    downloadBtn.download = `${file.name.replace(/\.mp4$/i, '')}.gif`;
});

// 开始渲染GIF
gif.render();
```

**标签：** `核心代码` `文件生成` `下载功能`


## 性能优化

- 使用Web Worker技术，转换过程在后台线程进行
- 限制视频时长，避免生成过大的GIF文件
- 自动清理Blob URL，避免内存泄漏
- 使用Canvas的willReadFrequently属性优化绘制性能


## 关于gif.js

本项目使用的是gif.js库（版本0.2.0），该库是一个用于在浏览器中创建GIF动画的JavaScript库。
- 项目地址：https://github.com/jnordberg/gif.js
gif.js@0.2.0仅提供三个核心方法：
addFrame()
render()
abort()

不能直接本地打开 HTML 文件时（浏览器地址栏显示file://协议），
浏览器的安全策略禁止加载gif.js所需的Worker脚本，导致跨域 / 跨协议访问被拒绝。


### Web Worker 解释
gif.js内部会创建 Web Worker 来加速 GIF 编码，
而 Web Worker 有严格的安全限制：
- 只能加载与主页面相同协议（http/https）的脚本
- 不能加载跨域的脚本（包括不同域名、端口或协议）
- 不能加载 blob: 或 data: 等数据URL


### 质量设置
颜色量化(quality)：
quality: 1~10，控制颜色量化的精度（GIF 最多支持 256 色），数值越小，颜色还原越精准，画质越高，但文件体积会显著增大；

帧率：
frameRate: 1~15, // 帧率从默认10降到8，减少帧数，降低体积
帧率过高会增加 GIF 帧数，导致体积变大；帧率过低会让 GIF 卡顿，需要平衡：
- 建议：根据视频原帧率（如 24fps），设置为 12fps 或 15fps 左右，既能保持流畅，又能控制文件体积。
流畅画质：10-15 → 适合动态感强的视频；
平衡：6-8 → 大部分场景足够流畅，体积更小；
极简：3-5 → 适合简单动效、表情包。

尺寸:
缩小尺寸 可以在保证视觉效果的前提下减小文件体积。
width: canvas.width * 0.8, // 缩小为原视频的80%宽度
height: canvas.height * 0.8, // 等比例缩小高度
注意：调整宽度 / 高度时要保持等比例，避免 GIF 拉伸变形；
建议：如果原视频分辨率超过 1080P，可缩小到 720P（宽度 1280）或 480P（宽度 854），既能保证清晰度，又能大幅减小体积。



抖动(dither)：
dither: true, // 开启抖动算法，减少颜色量化误差，颜色渐变的区域（如天空、渐变背景）会更自然，不会出现明显的色块，但文件体积会略有增加。


