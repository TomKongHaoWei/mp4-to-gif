const videoInput = document.getElementById('videoInput');
const progress = document.getElementById('progress');
const result = document.getElementById('result');

// 全局存储Blob URL，避免提前失效
let gifBlobUrl = '';
// 质量选项默认值
const qualityOptions = {
    quality: 10,
    frameRate: 8,
    size: 100,
    dither: 0,
}

// 设置质量选项
function setQualityOptions(e) {
    const key = e.target.name;
    const value = e.target.value;
    qualityOptions[key] = value; // 存储当前值

    // 更新标签显示
    const labelDOM = $(`#custom-option-${key}`).find(".custom-option-label")[0];
    switch (key) {
        case "quality":
            labelDOM.innerHTML = `色彩精度(${value})：`;
            break;
        case "frameRate":
            labelDOM.innerHTML = `帧率(${value})：`;
            break;
        case "size":
            labelDOM.innerHTML = `尺寸(${value}%)：`;
            break;
        case "dither":
            labelDOM.innerHTML = `抖动(${value === "1" ? "开" : "关"})：`;
            break;
        default:
            break;
    }
}
// 处理转换参数
async function handleConvert() {
    const file = videoInput.files[0];
    if (!file) return;

    progress.innerHTML = '正在加载视频...';

    // 1. 创建视频元素
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;

    // 等待视频完全加载
    await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = (e) => reject(new Error(`视频加载失败：${e.message}`));
    });

    const maxDuration = 5;
    const duration = Math.min(video.duration, maxDuration);
    progress.innerHTML = `视频时长：${duration.toFixed(1)}秒，开始逐帧截取...`;

    // 2. 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const scale = qualityOptions.size / 100;
    // 3. 初始化GIF编码器
    const gif = new GIF({
        workers: 2, // 开启几个 Web Worker 线程
        quality: qualityOptions.quality || 10, // 颜色量化 (10 是默认，越小画质越好但计算越慢)
        width: Math.round(canvas.width * scale), // GIF宽度（默认与视频一致）
        height: Math.round(canvas.height * scale), // GIF高度（默认与视频一致）
        frameRate: qualityOptions.frameRate || 5, // GIF帧率（每秒10帧）
        dither: qualityOptions.dither === "1", // 开启抖动算法，减少颜色量化误差
        autoCleanup: false // 手动清理内存
    });

    gif.on('progress', (p) => {
        // progress.innerHTML = `转换进度：${Math.round(p * 100)}%`;
        progress.innerHTML = ``;
    });

    // 4. 逐帧截取
    const frameRate = gif.options.frameRate;
    const frameCount = Math.floor(duration * frameRate);

    video.currentTime = 0;
    await new Promise(resolve => {
        const checkReady = () => {
            if (video.readyState >= 2) {
                resolve();
            } else {
                setTimeout(checkReady, 50);
            }
        };
        checkReady();
    });

    for (let i = 0; i < frameCount; i++) {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`第${i + 1}帧加载超时`)), 2000);

            const onSeeked = () => {
                clearTimeout(timeout);
                video.removeEventListener('seeked', onSeeked);
                if (video.readyState >= 2) {
                    resolve();
                } else {
                    setTimeout(resolve, 100);
                }
            };

            video.addEventListener('seeked', onSeeked);
            video.currentTime = i / frameRate;
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        gif.addFrame(ctx, { delay: 100, copy: true });
    }

    // 5. 完成编码
    progress.innerHTML = '正在生成GIF文件...';
    gif.on('finished', (blob) => {
        if (!blob) throw new Error('GIF Blob生成失败');
        // 清理旧的Blob URL
        if (gifBlobUrl) URL.revokeObjectURL(gifBlobUrl);
        // 保存新的Blob URL到全局，避免提前失效
        gifBlobUrl = URL.createObjectURL(blob);
        // 清理视频URL
        URL.revokeObjectURL(video.src);

        // 2. 创建GIF预览（使用全局Blob URL）
        const gifPreview = document.createElement('img');
        gifPreview.src = gifBlobUrl;
        gifPreview.className = 'gif-preview';
        result.innerHTML = '';
        result.appendChild(gifPreview);
    });

    gif.render();
    $("#download-btn").prop('disabled', false);
}
// 下载文件
function downloadFile() {
    if (!gifBlobUrl) return;
    // 创建一个临时的 a 标签进行下载
    const a = document.createElement('a');
    a.href = gifBlobUrl;
    // downloadBtn.download = `${file.name.replace(/\.mp4$/i, '')}.gif`;
    a.download = `1.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}




// 质量选项
document.getElementById('quality-controls').addEventListener("change", function (e) {
    if (e.target.className.indexOf("value") >= 0) setQualityOptions(e);
});
// 视频文件选择事件
videoInput.addEventListener('change', (e) => {
    result.innerHTML = '';
    progress.innerHTML = '';
    // 清空旧的Blob URL
    if (gifBlobUrl) {
        URL.revokeObjectURL(gifBlobUrl);
        gifBlobUrl = '';
    }
    handleConvert();
});
// 下载文件
$("#download-btn").click(function () {
    downloadFile();
});
// 页面关闭时清理Blob URL，避免内存泄漏
window.addEventListener('unload', () => {
    if (gifBlobUrl) URL.revokeObjectURL(gifBlobUrl);
});


$("#download-btn").prop('disabled', true);