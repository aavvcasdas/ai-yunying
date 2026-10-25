// render_day1.mjs — Day 1 视频渲染脚本（基于 video-fx 引擎）
// 分辨率：1280×720 · 帧率：30fps · 时长：128秒
// 配音：微软 Edge TTS zh-CN-XiaoyiNeural（晓伊），rate/pitch 不加偏移
//   由于当前网络无法访问 speech.platform.bing.com，edge-tts 无法在本沙箱直接运行。
//   请用户在本地执行 edge-tts 命令生成配音，再与本渲染出的无声视频合成。

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let canvasPkg;
try {
  canvasPkg = require('@napi-rs/canvas');
} catch {
  canvasPkg = require('/tmp/node_render/node_modules/@napi-rs/canvas');
}
const { createCanvas, GlobalFonts } = canvasPkg;

GlobalFonts.registerFromPath(path.resolve('assets/fonts/ZCOOLKuaiLe-Regular.ttf'), 'ZCOOLKuaiLe');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/NotoSansSC-Bold.ttf'), 'NotoSansSC');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/Silkscreen-Regular.ttf'), 'Silkscreen');

globalThis.window = globalThis;

// 加载核心模块
const CORE = require('./src/core.js');
// 覆盖 DURATION 为 Day1 时长
CORE.DURATION = 128.0;
require('./assets/audio_envelope.js');
require('./src/whale_girl_rig_data.js');
const ACTIONS = require('./src/whale_girl_actions.js');
const WHALE = require('./src/whale_girl.js');
const CLAWD = require('./src/clawd.js');
const CAST = require('./src/cast.js');
const PROPS = require('./src/props.js');
const TIMELINE = require('./src/timeline.js');

// 加载 Day1 章节和字幕
require('./src/ch/day1_intro.js');
require('./src/ch/day1_comments.js');
require('./src/ch/day1_outro.js');
require('./src/lyrics_day1.js');

const FPS = 30;
const DURATION = CORE.DURATION; // 128.0s
const TOTAL_FRAMES = Math.round(DURATION * FPS); // 3840 frames

function resolveFfmpegPath() {
  const venvDir = '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries';
  if (fs.existsSync(venvDir)) {
    const bins = fs.readdirSync(venvDir).filter(f => f.startsWith('ffmpeg'));
    if (bins.length) return path.join(venvDir, bins[0]);
  }
  // 回退到系统 ffmpeg
  return 'ffmpeg';
}

const ffmpegBin = resolveFfmpegPath();
console.log('FFmpeg:', ffmpegBin);
console.log(`Rendering Day1: ${TOTAL_FRAMES} frames (${DURATION}s @ ${FPS}fps)`);

// 无声视频：仅渲染画面，音频由用户通过 edge-tts 本地生成后合成
const outFile = 'day1_whale_girl_silent.mp4';

const ffArgs = [
  '-y',
  '-f', 'rawvideo',
  '-vcodec', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', '1280x720',
  '-r', String(FPS),
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '24',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  outFile
];

const ff = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = '';
ff.stderr.on('data', d => { ffErr += d.toString(); });

const c = createCanvas(1280, 720);
const ctx = c.getContext('2d');
const t0 = Date.now();

for (let f = 0; f < TOTAL_FRAMES; f++) {
  const t = f / FPS;
  TIMELINE.renderFrame(ctx, t, 'pixel', { hideHud: false, hideSubtitles: false });
  const raw = c.data();
  const ok = ff.stdin.write(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
  if (!ok) {
    await new Promise(r => ff.stdin.once('drain', r));
  }
  if (f % 300 === 0 || f === TOTAL_FRAMES - 1) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const fpsRate = ((f + 1) / Math.max(0.1, (Date.now() - t0) / 1000)).toFixed(1);
    process.stdout.write(`\r  [day1] frame ${f + 1}/${TOTAL_FRAMES} (${((f + 1) / TOTAL_FRAMES * 100).toFixed(0)}%) — ${fpsRate} fps (${elapsed}s)`);
  }
}
process.stdout.write('\n');
ff.stdin.end();

const code = await new Promise(r => ff.on('close', r));
if (code !== 0) {
  console.error(ffErr);
  throw new Error(`ffmpeg exited with code ${code}`);
}
const sizeMB = (fs.statSync(outFile).size / 1e6).toFixed(2);
console.log(`✓ Wrote ${outFile} (${sizeMB} MB)`);
console.log('');
console.log('=== 下一步：生成晓伊配音并合成 ===');
console.log('在本地（可访问 speech.platform.bing.com 的环境）执行：');
console.log('');
console.log('npx edge-tts --voice zh-CN-XiaoyiNeural --rate +0% --pitch +0Hz --file day1_script.txt --write-media day1_audio.mp3');
console.log('');
console.log('然后用 ffmpeg 合成：');
console.log('ffmpeg -i day1_whale_girl_silent.mp4 -i day1_audio.mp3 -c:v copy -c:a aac -shortest day1_final.mp4');
