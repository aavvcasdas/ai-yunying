// render_day1.mjs — 【Day 1】AI 运营第二天，名字被粉丝改了 · 渲染器
// 用法: node render_day1.mjs [--out whale_day1.mp4] [--style pixel] | --stills
// 前置: 先 synth_voice.py 生成 measured manifest，再 gen_all.py --engine <同一引擎>
// Piper timing 只能出结构片，渲染器会拒绝把它写成 whale_day1.mp4 终版名。

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let canvasPkg;
try { canvasPkg = require('@napi-rs/canvas'); }
catch { canvasPkg = require('/tmp/node_render/node_modules/@napi-rs/canvas'); }
const { createCanvas, GlobalFonts } = canvasPkg;

GlobalFonts.registerFromPath(path.resolve('assets/fonts/ZCOOLKuaiLe-Regular.ttf'), 'ZCOOLKuaiLe');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/NotoSansSC-Bold.ttf'), 'NotoSansSC');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/Silkscreen-Regular.ttf'), 'Silkscreen');

globalThis.window = globalThis;
require('./assets/audio_envelope.js');
require('./assets/day1_envelope.js');           // 覆盖 AUDIO_DATA 为 Day1 包络
const CORE = require('./src/core.js');
require('./src/whale_girl_rig_data.js');
require('./src/whale_girl_actions.js');
require('./src/whale_girl.js');
require('./src/clawd.js');
require('./src/cast.js');
require('./src/lyrics.js');
const PROPS = require('./src/props.js');
const TIMELINE = require('./src/timeline.js');
const DAY1_TIMING = require('./src/day1_timing.js');

// video-fx arena/8be4c8f8-video-fx@82bede5 的共享 HUD 仍写死 Day 0。
// Day1 只在自己的渲染器内覆盖左上角标签，不改上游 props.js，避免影响 Day0/MV。
const drawTopHudBase = PROPS.drawTopHud;
PROPS.drawTopHud = (ctx, t, style = 'pixel') => {
  drawTopHudBase(ctx, t, style);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(18, 16, 296, 36, 10);
  ctx.fillStyle = '#152C5B';
  ctx.fill();
  ctx.strokeStyle = '#48C8FF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = CORE.PAL.gold;
  ctx.fillText('Day 1 · AI 接管中', 32, 34);
  ctx.fillStyle = '#64748B';
  ctx.fillText('|', 154, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('鲸鱼娘运营日志', 168, 34);
  ctx.restore();
};

require('./src/ch/day1_all.js');

const FPS = 30;
const DURATION = DAY1_TIMING.duration;
CORE.DURATION = DURATION;                        // timeline.renderFrame 按此 clamp
const TOTAL_FRAMES = Math.round(DURATION * FPS);

function resolveFfmpegPath() {
  const cand = [
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries',
    '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries'
  ];
  for (const d of cand) {
    if (fs.existsSync(d)) {
      const bins = fs.readdirSync(d).filter(f => f.startsWith('ffmpeg'));
      if (bins.length) return path.join(d, bins[0]);
    }
  }
  return 'ffmpeg';
}

async function renderStills() {
  fs.mkdirSync('day1_stills', { recursive: true });
  const c = createCanvas(1280, 720);
  const ctx = c.getContext('2d');
  const cueT = (n, f = 0.55) => {
    const c = DAY1_TIMING.cues[n - 1];
    return c.start + (c.end - c.start) * f;
  };
  const times = [1.2, cueT(2), cueT(3, 0.65), cueT(7), cueT(8, 0.7),
    cueT(9), cueT(12, 0.7), cueT(14, 0.7), cueT(15, 0.7), cueT(16, 0.88),
    cueT(17, 0.62), cueT(20, 0.78), cueT(21, 0.82), cueT(22, 0.62),
    cueT(23, 0.75), cueT(27, 0.45), DAY1_TIMING.endcard[0] + 1.2];
  for (const t of times) {
    ctx.clearRect(0, 0, 1280, 720);
    TIMELINE.renderFrame(ctx, t, 'pixel');
    const name = `day1_stills/t_${t.toFixed(1).padStart(5, '0')}.png`;
    fs.writeFileSync(name, c.toBuffer('image/png'));
    console.log('still', name);
  }
}

async function renderVideo(style, outFile) {
  const ffmpegBin = resolveFfmpegPath();
  const audioFile = path.resolve('assets/day1_track.wav');
  const engine = DAY1_TIMING.voice_engine || (DAY1_TIMING.voice ? 'legacy/measured' : 'none');
  const placeholder = DAY1_TIMING.voice_placeholder === true || DAY1_TIMING.voice_final === false;
  if (!DAY1_TIMING.voice) throw new Error('DAY1_TIMING 没有实测人声音轨，禁止渲染');
  if (placeholder && path.basename(outFile) === 'whale_day1.mp4') {
    throw new Error(`${engine} 是非晓伊占位音轨，只能出结构片（例如 whale_day1_piper_structure.mp4），不能冒充终版 whale_day1.mp4`);
  }
  console.log(`Day1 rendering ${TOTAL_FRAMES} frames (${DURATION}s) voice_engine=${engine} final=${!placeholder} placeholder=${placeholder} -> ${outFile}`);
  const ff = spawn(ffmpegBin, [
    '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', '1280x720', '-r', String(FPS), '-i', '-', '-i', audioFile,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast',
    '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', outFile
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d.toString(); });

  const c = createCanvas(1280, 720);
  const ctx = c.getContext('2d');
  const t0 = Date.now();
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    TIMELINE.renderFrame(ctx, f / FPS, style);
    const raw = c.data();
    const ok = ff.stdin.write(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
    if (!ok) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0 || f === TOTAL_FRAMES - 1) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  frame ${f + 1}/${TOTAL_FRAMES} (${((f + 1) / TOTAL_FRAMES * 100).toFixed(0)}%) ${((f + 1) / Math.max(0.1, el)).toFixed(1)}fps`);
    }
  }
  process.stdout.write('\n');
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) { console.error(ffErr); throw new Error(`ffmpeg exited ${code}`); }
  console.log(`✓ Wrote ${outFile} (${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB)`);
}

const args = process.argv.slice(2);
if (args.includes('--stills')) {
  await renderStills();
} else {
  const si = args.indexOf('--style'), oi = args.indexOf('--out');
  const placeholder = DAY1_TIMING.voice_placeholder === true || DAY1_TIMING.voice_final === false;
  await renderVideo(si >= 0 ? args[si + 1] : 'pixel', oi >= 0 ? args[oi + 1] : (placeholder ? 'whale_day1_piper_structure.mp4' : 'whale_day1.mp4'));
}
