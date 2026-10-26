#!/usr/bin/env node
/*
 * render_day2_bonus_samples.mjs — render the two silent Day2 bonus samples.
 *
 * This renderer deliberately has no audio input and no measured-voice gate:
 * it is only for choosing the visual route. Output filenames must contain
 * 样片A/样片B and 无配音 so a sample cannot be mistaken for a publishable cut.
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Snapshot convention: this renderer may be copied either to the video-fx
// repository root or beside the chapter in src/ch. Resolve the real root.
const ROOT = fs.existsSync(path.join(HERE, 'src', 'core.js'))
  ? HERE
  : path.resolve(HERE, '..', '..');
const requireFromHere = createRequire(import.meta.url);
const requireFromRoot = createRequire(path.join(ROOT, 'package.json'));

function argValue(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const STILLS = process.argv.includes('--stills');
const VARIANT = argValue('--variant', 'enhanced');
const OUT = argValue('--out', path.join(ROOT, 'day2_bonus_sample_silent.mp4'));
if (!['enhanced', 'oldactions'].includes(VARIANT)) {
  throw new Error(`--variant must be enhanced|oldactions, got ${VARIANT}`);
}
if (!STILLS) {
  const base = path.basename(OUT);
  const expected = VARIANT === 'enhanced' ? '样片A' : '样片B';
  if (!base.includes(expected) || !base.includes('无配音')) {
    throw new Error(`silent sample output must contain ${expected} and 无配音: ${base}`);
  }
}

let createCanvas, loadImage, GlobalFonts;
try {
  ({ createCanvas, loadImage, GlobalFonts } = requireFromRoot('@napi-rs/canvas'));
} catch {
  ({ createCanvas, loadImage, GlobalFonts } = requireFromHere('@napi-rs/canvas'));
}

const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
function registerFont(file, families) {
  const fontPath = path.join(FONT_DIR, file);
  if (!fs.existsSync(fontPath) || !GlobalFonts?.registerFromPath) return;
  for (const family of families) GlobalFonts.registerFromPath(fontPath, family);
}
registerFont('ZCOOLKuaiLe-Regular.ttf', ['ZCOOLKuaiLe', 'ZCOOL KuaiLe']);
registerFont('NotoSansSC-Bold.ttf', ['NotoSansSC', 'Noto Sans SC', 'Noto Sans CJK SC', 'Microsoft YaHei']);
registerFont('NotoSansSC-Regular.ttf', ['NotoSansSC', 'Noto Sans SC', 'Noto Sans CJK SC', 'Microsoft YaHei']);
registerFont('Silkscreen-Regular.ttf', ['Silkscreen']);

globalThis.window = globalThis;
globalThis.DAY2_BONUS_SAMPLE_VARIANT = VARIANT;
globalThis.DAY2_CHARACTER_MODE = 'mixed';
requireFromRoot('./assets/audio_envelope.js');
// Silent envelope: the reused pose helper may consult voiceAt(), but this
// sample has no speech and must not inherit another video's voice bounce.
globalThis.AUDIO_DATA = {
  voice: new Array(1400).fill(0),
  energy: new Array(1400).fill(0.15),
  bass: new Array(1400).fill(0.1),
  beats: []
};
const CORE = requireFromRoot('./src/core.js');
const WHALE_RIG = requireFromRoot('./src/whale_girl_rig_data.js');
if (WHALE_RIG?.poses?.wink && WHALE_RIG?.poses?.heart?.backHair) {
  WHALE_RIG.poses.wink.backHair = WHALE_RIG.poses.heart.backHair;
}
requireFromRoot('./src/whale_girl_actions.js');
requireFromRoot('./src/whale_girl.js');
requireFromRoot('./src/clawd.js');
requireFromRoot('./src/cast.js');
requireFromRoot('./src/lyrics.js');
requireFromRoot('./src/props.js');
const TIMELINE = requireFromRoot('./src/timeline.js');

const DAY2_POSE_NAMES = [
  'idle-cute', 'curious', 'thinking', 'running', 'success', 'failure', 'blush',
  'angry', 'eat', 'celebrate', 'sleep', 'greet', 'wink', 'bold', 'star',
  'daily-gaming', 'daily-eat', 'daily-stretch', 'tail-swing', 'meme-cry',
  'meme-smug', 'meme-doge', 'meme-heart', 'meme-no', 'meme-yes', 'meme-music',
  'work-debug', 'work-idea', 'work-review', 'work-deadline', 'react-head',
  'react-belly', 'react-tail', 'game-happy', 'game-win', 'teasing',
  'daily-done', 'levelup', 'cool-shades'
];
function alphaBBox(img) {
  const c = createCanvas(img.width, img.height);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (d[(y * img.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: img.width, h: img.height };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
async function loadDay2Poses() {
  const dir = path.join(ROOT, 'assets', 'day2_poses');
  const out = {};
  await Promise.all(DAY2_POSE_NAMES.map(async name => {
    const file = path.join(dir, `dsh-whale-state-${name}.webp`);
    if (!fs.existsSync(file)) throw new Error(`Day2 pose missing: ${file}`);
    const img = await loadImage(file);
    if (img.width !== 512 || img.height !== 512) {
      throw new Error(`Day2 pose ${name} should be 512x512, got ${img.width}x${img.height}`);
    }
    out[name] = { img, bbox: alphaBBox(img), file: path.basename(file) };
  }));
  return out;
}
globalThis.DAY2_POSES = await loadDay2Poses();
globalThis.DAY2_POSE_COUNT = DAY2_POSE_NAMES.length;

requireFromHere(fs.existsSync(path.join(HERE, 'day2_bonus_samples_all.js'))
  ? './day2_bonus_samples_all.js'
  : './src/ch/day2_bonus_samples_all.js');
const TIMING = globalThis.DAY2_BONUS_SAMPLE_TIMING;
if (!TIMING?.sample_only || TIMING.voice !== false || TIMING.measured !== false ||
    TIMING.variant !== VARIANT || TIMING.cues?.length !== 12) {
  throw new Error('sample timing gate failed');
}
if (!TIMELINE?.renderFrame) throw new Error('TIMELINE.renderFrame missing');
CORE.DURATION = Number(TIMING.duration);

const WIDTH = 1280, HEIGHT = 720, SCALE = 1.5, FPS = 30;
const OUT_W = WIDTH * SCALE, OUT_H = HEIGHT * SCALE;
const DURATION = Number(TIMING.duration);
const canvas = createCanvas(OUT_W, OUT_H);
const ctx = canvas.getContext('2d');

const FONT = '"Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif';
const CAPTION_OVERRIDES = VARIANT === 'oldactions' ? {
  B03: '样片B先不换主体：旧版留在主画面，动作往旧骨架上加。',
  B04: '主画面是旧版骨架；表情包新版只进电视里对照。',
  B05: '电视里不是一只鱼：旧版和表情包新版各有完整小场景。',
  B07: '主画面和电视里都用真动作，不拿静态表情包冒充主体动作。',
  B11: '一千八百一十六位住户：选原版升级，还是旧版加动作？'
} : {};
const MODE_LABEL = VARIANT === 'enhanced'
  ? '样片A · 原版基础上升级'
  : '样片B · 旧版主画面加动作';
const MODE_NOTE = VARIANT === 'enhanced'
  ? '电视 = 旧版完整小场景'
  : '电视 = 旧版 + 表情包双完整小场景';

function text(textValue, x, y, size, color = '#fff', align = 'center', weight = 400) {
  ctx.save();
  ctx.font = `${weight} ${size * SCALE}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size * SCALE * 0.14);
  ctx.strokeStyle = 'rgba(6,20,44,0.92)';
  ctx.strokeText(textValue, x * SCALE, y * SCALE);
  ctx.fillStyle = color;
  ctx.fillText(textValue, x * SCALE, y * SCALE);
  ctx.restore();
}
function shrinkToFit(textValue, maxWidth, size, weight = 700) {
  let s = size;
  ctx.save();
  while (s > 12) {
    ctx.font = `${weight} ${s * SCALE}px ${FONT}`;
    if (ctx.measureText(textValue).width <= maxWidth * SCALE) break;
    s -= 1;
  }
  ctx.restore();
  return s;
}
function cueAt(t) {
  return TIMING.cues.find(cue => t >= cue.start && t < cue.end) ||
    (t >= TIMING.cues.at(-1).end ? TIMING.cues.at(-1) : null);
}
function drawCaption(t) {
  const cue = cueAt(t);
  if (!cue) return;
  const caption = CAPTION_OVERRIDES[cue.id] || cue.sub;
  const size = shrinkToFit(caption, 1050, 27, 700);
  ctx.save();
  ctx.fillStyle = 'rgba(5,15,35,0.78)';
  ctx.fillRect(0, 632 * SCALE, WIDTH * SCALE, HEIGHT * SCALE);
  ctx.restore();
  text(`${cue.id} · ${caption}`, WIDTH / 2, 676, size, '#F8FAFC', 'center', 700);
}
function drawHud(t) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,15,35,0.82)';
  ctx.fillRect(0, 0, WIDTH * SCALE, 52 * SCALE);
  ctx.fillStyle = VARIANT === 'enhanced' ? '#FACC15' : '#7DD3FC';
  ctx.fillRect(0, 50 * SCALE, WIDTH * SCALE, 2 * SCALE);
  ctx.restore();
  text(MODE_LABEL, 16, 26, 21, '#FFFFFF', 'left', 800);
  text('12 镜头全新增 · 丰富房间', WIDTH / 2, 26, 18, '#E2E8F0', 'center', 700);
  text(`无配音 · ${MODE_NOTE} · ${t.toFixed(1)}s`, WIDTH - 16, 26, 17, '#E2E8F0', 'right', 700);
}
function drawFrame(t) {
  ctx.save();
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // 'clean' is required at 1920x1080: the legacy 'pixel' medium overlay
  // samples only the 1280x720 top-left quadrant and would crop the frame.
  TIMELINE.renderFrame(ctx, t, 'clean', { hideHud: true, hideSubtitles: true });
  ctx.restore();
  drawCaption(t);
  drawHud(t);
}

if (STILLS) {
  const dir = path.join(ROOT, 'stills', 'day2_bonus_samples', VARIANT);
  fs.mkdirSync(dir, { recursive: true });
  const points = [
    ['b01', 0, 0.55], ['b02', 1, 0.55], ['b03', 2, 0.65], ['b04', 3, 0.55],
    ['b05', 4, 0.55], ['b06_eat', 5, 0.31], ['b06_stretch', 5, 0.58], ['b06_game', 5, 0.85],
    ['b07_eat', 6, 0.16], ['b07_stretch', 6, 0.39], ['b07_game', 6, 0.62], ['b07_detail', 6, 0.86],
    ['b08', 7, 0.55], ['b09_mid', 8, 0.35], ['b09_late', 8, 0.85],
    ['b10', 9, 0.55], ['b11', 10, 0.75], ['b12', 11, 0.55], ['b12_late', 11, 0.9]
  ];
  for (const [name, cueIndex, frac] of points) {
    const cue = TIMING.cues[cueIndex];
    const t = cue.start + (cue.end - cue.start) * frac;
    drawFrame(t);
    const file = path.join(dir, `${name}.png`);
    await fs.promises.writeFile(file, canvas.toBuffer('image/png'));
    console.log(`[day2-bonus-sample] still ${name} t=${t.toFixed(3)} -> ${file}`);
  }
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const args = [
  '-y',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OUT_W}x${OUT_H}`, '-r', String(FPS),
  '-i', 'pipe:0',
  '-an',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-b:v', '3200k', '-maxrate', '4200k', '-bufsize', '8400k',
  '-movflags', '+faststart', '-r', String(FPS),
  '-metadata', `title=Day2加更${VARIANT === 'enhanced' ? '样片A原版升级' : '样片B旧版加动作'}（无配音）`,
  '-metadata', `comment=Silent visual sample only; variant=${VARIANT}; no voice track`,
  OUT
];
const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'inherit', 'inherit'] });
const ffmpegDone = new Promise((resolve, reject) => {
  ff.on('error', reject);
  ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
});
ffmpegDone.catch(() => {});
const total = Math.ceil(DURATION * FPS);
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  drawFrame(t);
  const rgbaFrame = ctx.getImageData(0, 0, OUT_W, OUT_H).data;
  const ok = ff.stdin.write(Buffer.from(rgbaFrame.buffer, rgbaFrame.byteOffset, rgbaFrame.byteLength));
  if (!ok) await new Promise(resolve => ff.stdin.once('drain', resolve));
  if (f % 90 === 0) console.log(`[day2-bonus-sample] ${VARIANT} frame ${f}/${total} (${(100 * f / total).toFixed(1)}%)`);
}
ff.stdin.end();
await ffmpegDone;
console.log(`[day2-bonus-sample] done variant=${VARIANT} frames=${total} duration=${DURATION.toFixed(3)}s out=${OUT}`);
