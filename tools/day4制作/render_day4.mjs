// render_day4.mjs — 【Day4】呜……本鲸的米饭，被 MV 吃光了 · 样片渲染器
//
// 与 Day3 渲染器的三个差别（用户 2026-10-27 点名要的）：
//   1. **角色回到老版像素骨架**（video-fx `src/whale_girl.js` 的原版鲸鱼娘），
//      但用「整数格离屏层 + alpha 二值化 + 最近邻贴回」画，解决 Day3 v2 被判"糊"的问题
//      ——`blitChar()`，可用 --soft 关掉对比（同一帧出两张，肉眼就能看出差别）。
//   2. **C02 加电视机**：老 CR T 电视里放本鲸做的那版《朋友的酒》MV，
//      故意做成"很劣质"——低分辨率内部画布（240×150）最近邻放大、扫描线、雪花、
//      色差、歌词追不上（字幕延迟 2.4s 且被裁半截）、角标 `MV v4 · 未调`。
//   3. 数字卡全部走「播放量 / 粉丝」口径（C11 目标卡）；账本卡留白，等真截图。
//
// 两条红线沿用 agent.md：
//   · 时间轴：`--cues X.json` 用实测对齐；没有就按 4.3 字/秒估（仅样片），绝不写进成片。
//   · 声音：本渲染器默认 `-an`，配音轨要显式 `--audio`。
//
// 用法：
//   node render_day4.mjs --stills
//   node render_day4.mjs --stills --soft            # 关掉清晰化，出对比帧
//   node render_day4.mjs --times 3,8,14 --tag tv    # 指定秒数出帧
//   node render_day4.mjs --out day4_sample.mp4
//   node render_day4.mjs --out day4_final.mp4 --cues Day4/day4_voice_alignment.json --audio Day4/配音.wav

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const VFX = process.env.VIDEO_FX_DIR || path.resolve(__dirname, '../../video-fx');
if (!fs.existsSync(path.join(VFX, 'src/core.js'))) {
  throw new Error(`找不到 video-fx 引擎：${VFX}（可用 VIDEO_FX_DIR 指定）`);
}

function resolveCanvas() {
  for (const c of ['@napi-rs/canvas', '/tmp/node_render/node_modules/@napi-rs/canvas']) {
    try { return require(c); } catch (e) { /* next */ }
  }
  throw new Error('缺少 @napi-rs/canvas：cd /tmp/node_render && npm i @napi-rs/canvas');
}
const { createCanvas, GlobalFonts, loadImage } = resolveCanvas();

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  try { return require('/tmp/node_render/node_modules/@ffmpeg-installer/ffmpeg').path; } catch (e) { /* next */ }
  for (const c of ['ffmpeg', '/usr/bin/ffmpeg']) {
    try { if (c === 'ffmpeg' || fs.existsSync(c)) return c; } catch (e) { /* next */ }
  }
  return 'ffmpeg';
}

for (const f of ['ZCOOLKuaiLe-Regular.ttf', 'NotoSansSC-Bold.ttf', 'Silkscreen-Regular.ttf']) {
  const p = path.join(VFX, 'assets/fonts', f);
  if (fs.existsSync(p)) {
    GlobalFonts.registerFromPath(p, f.includes('ZCOOL') ? 'ZCOOLKuaiLe' : (f.includes('Noto') ? 'NotoSansSC' : 'Silkscreen'));
  }
}

globalThis.window = globalThis;
const CORE = require(path.join(VFX, 'src/core.js'));
const RIG = require(path.join(VFX, 'src/whale_girl_rig_data.js'));
// 眼睛白线硬门禁（agent.md 第 11 条）：wink 头换 wave 头、后发换 heart 后发。
if (RIG?.poses?.wink && RIG?.poses?.heart?.backHair) RIG.poses.wink.backHair = RIG.poses.heart.backHair;
if (RIG?.poses?.wink && RIG?.poses?.wave?.head) RIG.poses.wink.head = RIG.poses.wave.head;
const { buildPatchedWhaleGirl } = await import('../day3制作/video-fx源码快照/engine_patches.mjs');
const _patched = buildPatchedWhaleGirl(VFX);
if (_patched.applied.length) console.log('引擎补丁：', _patched.applied.join(', '));
const WHALE = require(_patched.file);
PROPS: {
  // eslint-disable-next-line no-unused-labels
}
const PROPS = require(path.join(VFX, 'src/props.js'));
import { createDay2Subtitle, speakerFor } from '../字幕/day2_style_sub.mjs';

const {
  W, H, TAU, PAL, clamp, lerp, seg, ease, easeOut, pulse,
  rectPts, ellPts, rrPts, starPts, heartPts, paint, inkLine,
  camBegin, camEnd, glow, flash, letter, reseedBoil, hash
} = CORE;
const { whaleGirl, emotions, feel, move } = WHALE;

// ---------------------------------------------------------------------------
// 1. 台词（与 Day4/Day4文案.md 第五节逐字一致）
// ---------------------------------------------------------------------------
const LINES = [
  '呜……本鲸的米饭，被 MV 吃光了。',
  '一个 MV，本鲸做了四版。',
  '四版诶。',
  '一版一锅米。',
  '改到第四版，本鲸的尾巴都抬不动了。',
  '数据也没帮本鲸。',
  '第一条七万四。',
  '后面一路往下，一次都没回头。',
  '现在两千哦。',
  '一只手就数完啦。',
  '有人问，MV 呢？',
  '本鲸一直说，牵一牵，别急呀。',
  '后来呀，交了。',
  '交出去那条，是大小姐做的。',
  '换的是 MV 哦。',
  '不是本鲸。',
  '本鲸便宜嘛。',
  '返工不便宜。',
  '昨天扮了一整天大小姐。',
  '扮到晚饭都忘了。',
  '本鲸不哭哦。',
  '就是有点饿。',
  '有人说，字幕抢视线。',
  '本鲸记着去调啦。',
  '主人给本鲸两个目标。',
  '小目标，播放量三万七。',
  '不是三个亿哦。',
  '月度目标，三十天，一万个粉丝。',
  '本鲸还能改。',
  '下一版，从开头改起。',
  '明天开第一张账本卡。',
  '账上写播放，写关注，也写米饭。',
  '一个数都不藏。',
  '帮本鲸看看呗？',
  '评论区说句话就行。',
  '鲸鱼绝不摸鱼！……先去吃饭。'
];

// 一镜多句的分组（镜号 → 台词行号区间，1-based）
const SHOT_RANGES = [
  { id: 'C01', from: 1, to: 1, name: '空碗 + 四张返工单' },
  { id: 'C02', from: 2, to: 4, name: '电视机里放那版劣质 MV' },
  { id: 'C03', from: 5, to: 6, name: '第四版进度条卡住 / 尾巴拖地' },
  { id: 'C04', from: 7, to: 10, name: '折线往下 + 7.4万→2000' },
  { id: 'C05', from: 11, to: 12, name: '评论气泡「MV 呢？」' },
  { id: 'C06', from: 13, to: 14, name: '文件拖走 → 大小姐签收' },
  { id: 'C07', from: 15, to: 16, name: '「换的是 MV，不是本鲸」' },
  { id: 'C08', from: 17, to: 18, name: '便宜 / 返工不便宜' },
  { id: 'C09', from: 19, to: 22, name: '扮一天大小姐，晚饭忘了' },
  { id: 'C10', from: 23, to: 24, name: '字幕抢视线，记着去调' },
  { id: 'C11', from: 25, to: 28, name: '目标卡：播放量 / 粉丝' },
  { id: 'C12', from: 29, to: 30, name: '还能改，从开头改起' },
  { id: 'C13', from: 31, to: 33, name: '账本卡（留白）' },
  { id: 'C14', from: 34, to: 36, name: '结尾：先去吃饭' }
];

const ARGV = process.argv.slice(2);
const argOf = (flag) => {
  const i = ARGV.indexOf(flag);
  return i >= 0 && i + 1 < ARGV.length ? ARGV[i + 1] : null;
};
const CUES_JSON = argOf('--cues');
const AUDIO_WAV = argOf('--audio');
const SOFT = ARGV.includes('--soft');            // 关掉清晰化（出对比帧用）
const NO_TV = ARGV.includes('--no-tv');          // 出 C02 无电视对照
const VOICE_CUES = CUES_JSON ? JSON.parse(fs.readFileSync(CUES_JSON, 'utf8')) : null;

const RATE = 4.3;     // 呆萌快节奏口径（仅样片估时）
const GAP = 0.06;
const han = (s) => s.replace(/[^\u4e00-\u9fff]/g, '').length;
const CUES = [];
if (VOICE_CUES) {
  if (VOICE_CUES.cues.length !== LINES.length) {
    throw new Error(`cue 表有 ${VOICE_CUES.cues.length} 条，台词有 ${LINES.length} 条`);
  }
  for (const c of VOICE_CUES.cues) {
    CUES.push({
      start: c.start,
      end: c.end,
      chars: Array.isArray(c.chars_timed) && c.chars_timed.length ? c.chars_timed : null
    });
  }
} else {
  let _t = 0;
  for (const l of LINES) {
    const d = Math.max(1.2, Math.round((han(l) / RATE) * 100) / 100);
    CUES.push({ start: Math.round(_t * 100) / 100, end: Math.round((_t + d) * 100) / 100 });
    _t += d + GAP;
  }
}
const ENDCARD = { start: CUES[CUES.length - 1].end + 0.3, end: CUES[CUES.length - 1].end + 3.6 };
const DURATION = ENDCARD.end;
const C = (n) => CUES[n - 1].start;
const CE = (n) => CUES[n - 1].end;
const cueP = (t, n) => clamp((t - C(n)) / Math.max(0.001, CE(n) - C(n)));

const FPS = 30;
const BASE_W = W, BASE_H = H;
const SCALE = 1.5;
const OUT_W = Math.round(BASE_W * SCALE), OUT_H = Math.round(BASE_H * SCALE);
CORE.DURATION = DURATION;

// ---------------------------------------------------------------------------
// 2. 老版像素骨架 + 清晰化（本文件的核心改动）
// ---------------------------------------------------------------------------
// Day3 v2 被退回"还是模糊"的原因：整幅画布 setTransform(1.5) 再叠镜头 zoom，
// 骨块边界落在半像素上 → 每格都被抗锯齿抹成灰边。这里沿用 Day3 v3 的解法：
//   ① 把角色单独画进一张**设备分辨率**的离屏画布，格宽取整（cellDev 为整数）；
//   ② 把 alpha 二值化（≥110 → 255，其余 0），砍掉旋转/摆动留下的半透明边；
//   ③ 用 imageSmoothingEnabled=false 整张贴回主画布，位置也取整。
// 效果 = 老像素骨架的正方形硬边，不再有灰糊边。--soft 可关掉 ②③ 做对照。
const ALPHA_SNAP = !SOFT;
const CHAR_BOX = { halfW: 5.6, top: -10.6, bottom: 1.6 };
const layerCache = new Map();
function charLayer(w, h) {
  const key = `${w}x${h}`;
  let c = layerCache.get(key);
  if (!c) {
    const canvas = createCanvas(w, h);
    c = { canvas, ctx: canvas.getContext('2d') };
    layerCache.set(key, c);
  }
  return c;
}
function blitChar(ctx, x, y, u, draw, o = {}) {
  if (o.shadow !== false) {
    paint(ctx, ellPts(x, y + 0.1 * u, 2.5 * u, 0.46 * u, 16), { wash: PAL.ink, washOp: 58, ink: null });
  }
  const m = ctx.getTransform();
  const s = Math.hypot(m.a, m.b);
  if (!ALPHA_SNAP) {            // 对照：直接在主画布上画（旧做法，会糊）
    ctx.save();
    draw(ctx, x, y, u, s);
    ctx.restore();
    return;
  }
  const cellDev = Math.max(2, Math.round((u * s) / 10));
  const uDev = cellDev * 10;
  const lw = Math.ceil(CHAR_BOX.halfW * 2 * uDev);
  const lh = Math.ceil((CHAR_BOX.bottom - CHAR_BOX.top) * uDev);
  const { canvas, ctx: g } = charLayer(lw, lh);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, lw, lh);
  const bx = Math.round(CHAR_BOX.halfW * uDev);
  const by = Math.round(-CHAR_BOX.top * uDev);
  draw(g, bx, by, uDev, 1);
  const img = g.getImageData(0, 0, lw, lh);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0;
  g.putImageData(img, 0, 0);
  const fx = m.a * x + m.c * y + m.e;
  const fy = m.b * x + m.d * y + m.f;
  const noRot = Math.abs(m.b) < 1e-9 && Math.abs(m.c) < 1e-9 && Math.abs(m.a - m.d) < 1e-9;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (noRot) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(canvas, Math.round(fx - bx), Math.round(fy - by));
  } else {
    ctx.drawImage(canvas, x - bx / s, y - by / s, lw / s, lh / s);
  }
  ctx.restore();
}

// 主角色入口：老版像素骨架（style='pixel'）
function WGF(ctx, x, y, u, o = {}) {
  const opts = {
    style: 'pixel',
    showActionBadge: false,
    tailScale: 1.0,
    eyes: 'open',
    squint: 0.01,
    mouth: o.mouth || 'smile',
    noFinBows: true,
    eyePatch: false,
    ...o
  };
  if (!opts.emo && !opts.emotion) opts.emotion = 'happy';
  blitChar(ctx, x, y, u, (g, bx, by, uu) => whaleGirl(g, bx, by, uu, { ...opts, t: opts.t ?? 0 }), { shadow: opts.shadow });
}

// ---------------------------------------------------------------------------
// 3. 场景元素
// ---------------------------------------------------------------------------
function room(ctx, t, o = {}) {
  const floorY = o.floorY ?? 536;
  PROPS.wall(ctx, o.wallCol || '#161F3F');
  paint(ctx, rectPts(-120, floorY - 126, W + 240, 126, 2), { wash: '#22305C', ink: PAL.ink, sw: 1.2, washOp: 200 });
  for (let i = 0; i < 9; i++) inkLine(ctx, [[52 + i * 146, floorY - 126], [52 + i * 146, floorY]], 1.2, 'rgba(15,23,42,0.55)', 'inkfine', 0);
  for (let i = 0; i < 12; i++) {
    const x = 36 + i * 106;
    const y = 40 + Math.sin(t * 1.1 + i * 0.7) * 7 + Math.sin(i * 1.3) * 10;
    const col = i % 3 === 0 ? PAL.gold : (i % 3 === 1 ? PAL.whaleCyan : PAL.rose);
    glow(ctx, x, y, 16, col, 0.45);
    paint(ctx, ellPts(x, y, 4.2, 5.4, 10), { wash: col, ink: PAL.ink, sw: 0.7 });
  }
  inkLine(ctx, [[16, 24], [W - 16, 32]], 1.6, '#2B3A63', 'inkfine', 0.2);
  PROPS.windowPorthole(ctx, 148, 236, 80, t, true);
  PROPS.shelf(ctx, 1010, 296, 230, 2);
  PROPS.shelf(ctx, 1010, 402, 230, 5);
  // 右侧书桌（角色站地板，桌子只占右边，别挡人）
  paint(ctx, rrPts(742, 470, 330, 24, 7, 1.2), { wash: '#6B4B33', fill: '#3B2A1E', fillOp: 130, ink: PAL.ink, sw: 1.4 });
  paint(ctx, rectPts(766, 494, 18, 112, 1), { wash: '#4A3524', ink: PAL.ink, sw: 1.1 });
  paint(ctx, rectPts(1030, 494, 18, 112, 1), { wash: '#4A3524', ink: PAL.ink, sw: 1.1 });
  // 左侧矮柜（电视/道具落点）
  paint(ctx, rrPts(250, 496, 400, 20, 6, 1.2), { wash: '#5B452F', fill: '#2E2116', fillOp: 150, ink: PAL.ink, sw: 1.3 });
  paint(ctx, rectPts(268, 516, 16, 90, 1), { wash: '#40301F', ink: PAL.ink, sw: 1 });
  paint(ctx, rectPts(614, 516, 16, 90, 1), { wash: '#40301F', ink: PAL.ink, sw: 1 });
  PROPS.floorBand(ctx, floorY, '#231B38');
  paint(ctx, ellPts(640, 630, 320, 62, 26), { wash: '#3B2C56', washOp: 190, ink: PAL.ink, sw: 1.3 });
  paint(ctx, ellPts(640, 630, 244, 40, 24), { wash: '#4A3868', washOp: 150, ink: null });
  // 绿植
  paint(ctx, rrPts(1176, 476, 52, 54, 8, 1), { wash: '#B45309', ink: PAL.ink, sw: 1.2 });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.32;
    inkLine(ctx, [[1202, 480], [1202 + Math.cos(a) * 60, 480 + Math.sin(a) * 74]], 4.5, i % 2 ? PAL.sap : '#4D8B5C', 'ink', 0.35);
  }
}

function pill(ctx, x, y, w, h, fill = 'rgba(11,29,58,0.92)', stroke = '#48C8FF') {
  paint(ctx, rrPts(x, y, w, h, h / 2, 0.8), { wash: fill, ink: stroke, sw: 1.4 });
}
function label(ctx, txt, x, y, o = {}) {
  const h = o.h || 26;
  ctx.save();
  ctx.font = o.font || 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  const w = o.w || (ctx.measureText(txt).width + 26);
  pill(ctx, x - w / 2, y - h / 2, w, h, o.fill || 'rgba(11,29,58,0.9)', o.stroke || '#48C8FF');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(4,12,30,0.9)';
  ctx.strokeText(txt, x, y + 1);
  ctx.fillStyle = o.color || PAL.cream;
  ctx.fillText(txt, x, y + 1);
  ctx.restore();
  return w;
}

// 返工单（v1…v4）
function workOrder(ctx, x, y, w, h, text, rot = 0, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  paint(ctx, rrPts(-w / 2, -h / 2, w, h, 6, 1.2), { wash: o.wash || '#EFE3C8', fill: '#0B1526', fillOp: 40, ink: PAL.ink, sw: 1.4 });
  ctx.fillStyle = '#7F1D1D';
  ctx.font = '900 30px "ZCOOLKuaiLe", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -h * 0.16);
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(o.note || '主人：再改', 0, h * 0.24);
  if (o.stamp) {
    ctx.save();
    ctx.rotate(-0.2);
    ctx.strokeStyle = '#D8232A';
    ctx.lineWidth = 3;
    ctx.strokeRect(-w * 0.3, -h * 0.06, w * 0.6, h * 0.34);
    ctx.fillStyle = '#D8232A';
    ctx.font = '900 16px "ZCOOLKuaiLe", sans-serif';
    ctx.fillText(o.stamp, 0, h * 0.11);
    ctx.restore();
  }
  ctx.restore();
}

// 饭碗（rice 0=空）
function riceBowl(ctx, x, y, s = 1, rice = 1, t = 0) {
  paint(ctx, ellPts(x, y + 20 * s, 48 * s, 11 * s, 18), { wash: PAL.ink, washOp: 55, ink: null });
  // 碗身（上宽下窄的梯形，够高才不像盘子）
  paint(ctx, [[x - 44 * s, y - 6 * s], [x + 44 * s, y - 6 * s], [x + 28 * s, y + 20 * s], [x - 28 * s, y + 20 * s]],
    { wash: '#EAF0FA', fill: '#8FA6C4', fillOp: 90, ink: PAL.ink, sw: 1.6 });
  paint(ctx, [[x - 36 * s, y + 4 * s], [x + 36 * s, y + 4 * s], [x + 32 * s, y + 9 * s], [x - 32 * s, y + 9 * s]],
    { wash: '#2563EB', washOp: 230, ink: null });
  paint(ctx, [[x - 20 * s, y + 18 * s], [x + 20 * s, y + 18 * s], [x + 16 * s, y + 23 * s], [x - 16 * s, y + 23 * s]],
    { wash: '#1E40AF', washOp: 210, ink: null });
  paint(ctx, ellPts(x, y - 6 * s, 44 * s, 13 * s, 20), { wash: '#F4F7FF', ink: PAL.ink, sw: 1.6 });
  if (rice > 0.02) {
    paint(ctx, ellPts(x, y - 14 * s, 32 * s * rice, 15 * s * rice, 18), { wash: '#FFFFFF', ink: 'rgba(30,45,80,0.5)', sw: 1 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      paint(ctx, ellPts(x + Math.cos(a) * 22 * s * rice, y - 16 * s + Math.sin(a) * 8 * s * rice + Math.sin(t * 2 + i) * 0.6,
        4 * s, 2.8 * s, 8), { wash: '#FFFFFF', ink: 'rgba(60,80,120,0.35)', sw: 0.4 });
    }
  }
  if (rice > 0.02) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      paint(ctx, ellPts(x + Math.cos(a) * 26 * s, y - 10 * s + Math.sin(a) * 9 * s - 6 * s * rice,
        4.4 * s, 3.2 * s, 8), { wash: '#FFFFFF', ink: 'rgba(20,30,60,0.35)', sw: 0.5 });
    }
  }
  paint(ctx, ellPts(x, y - 18 * s, 30 * s, 8 * s, 16), { wash: rice > 0.02 ? '#FDFDFD' : '#B9C6DA', washOp: 240, ink: null });
}

// 电视机（CRT）：屏幕内部固定 240×150，最近邻放大 = 故意劣质
function tvSet(ctx, x, y, w, h, drawInner, o = {}) {
  // 天线
  inkLine(ctx, [[x + w * 0.36, y - 8], [x + w * 0.2, y - 46]], 2.6, '#B9C6DA', 'inkfine', 0);
  inkLine(ctx, [[x + w * 0.62, y - 8], [x + w * 0.8, y - 44]], 2.6, '#B9C6DA', 'inkfine', 0);
  paint(ctx, ellPts(x + w * 0.5, y - 46, 5, 5, 10), { wash: '#B9C6DA', ink: PAL.ink, sw: 0.8 });
  // 机身
  paint(ctx, rrPts(x - 12, y - 10, w + 24, h + 26, 14, 1.6), { wash: '#8B7A63', fill: '#4A3B2B', fillOp: 140, ink: PAL.ink, sw: 1.8 });
  // 屏幕
  const sx = x + 8, sy = y + 6, sw = w - 16, sh = h - 12;
  paint(ctx, rrPts(sx - 4, sy - 4, sw + 8, sh + 8, 10, 1.2), { wash: '#1A1008', ink: PAL.ink, sw: 1.4 });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, 8);
  ctx.clip();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawInner(ctx, sx, sy, sw, sh, o.tt ?? 0);
  ctx.restore();
  // 扫描线 + 雪花 + 滚动条（"劣质"三件套）
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = '#000';
  for (let yy = sy + 2; yy < sy + sh; yy += 3) ctx.fillRect(sx, yy, sw, 1.2);
  ctx.globalAlpha = 1;
  const roll = ((o.tt * 0.35) % 1) * sh;
  const g = ctx.createLinearGradient(0, sy + roll - 14, 0, sy + roll + 14);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx, sy + roll - 14, sw, 28);
  ctx.restore();
  // 玻璃反光
  inkLine(ctx, [[sx + 12, sy + 34], [sx + 46, sy + 12]], 2.2, 'rgba(255,255,255,0.7)', 'inkfine', 0);
  // 旋钮 + 喇叭格
  for (let i = 0; i < 2; i++) {
    paint(ctx, ellPts(x + w - 26, y + h + (i ? 18 : -2) + 6, 5.5, 5.5, 12), { wash: '#C8B79B', ink: PAL.ink, sw: 1 });
  }
  // 贴纸：MV v4 · 未调
  ctx.save();
  ctx.translate(x + 30, y + h + 12);
  ctx.rotate(-0.06);
  paint(ctx, rrPts(-42, -12, 84, 24, 5, 1), { wash: 'rgba(242,193,78,0.92)', ink: PAL.ink, sw: 1.1 });
  ctx.fillStyle = '#3B2A0E';
  ctx.font = '900 14px "ZCOOLKuaiLe", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MV v4 · 未调', 0, 1);
  ctx.restore();
  return { sx, sy, sw, sh };
}

// 电视里放的那版劣质 MV：低分辨率内容 + 追不上的歌词 + 色差
function shoddyMV(ctx, sx, sy, sw, sh, tt) {
  const LW = 240, LH = 150;
  const key = `mv${LW}x${LH}`;
  let layer = layerCache.get(key);
  if (!layer) {
    const canvas = createCanvas(LW, LH);
    layer = { canvas, ctx: canvas.getContext('2d') };
    layerCache.set(key, layer);
  }
  const g = layer.ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, LW, LH);
  // 背景（MV 版：蓝紫舞台 + 灯）
  g.fillStyle = '#141B3A';
  g.fillRect(0, 0, LW, LH);
  g.fillStyle = '#1E2A55';
  g.fillRect(0, LH * 0.62, LW, LH * 0.38);
  const glowG = g.createRadialGradient(LW * 0.5, LH * 0.35, 4, LW * 0.5, LH * 0.35, LW * 0.55);
  glowG.addColorStop(0, 'rgba(90,180,255,0.35)');
  glowG.addColorStop(1, 'rgba(90,180,255,0)');
  g.fillStyle = glowG;
  g.fillRect(0, 0, LW, LH);
  // Q 弹：每拍压扁（130 BPM ≈ 0.462s）
  const beat = (tt / 0.462) % 1;
  const squash = beat < 0.22 ? 1 - 0.32 * (beat / 0.22) : 0.68 + 0.32 * ease((beat - 0.22) / 0.78);
  // 角色（像素骨架，故意小尺寸 + 无清晰化 = 颗粒感）
  g.save();
  g.translate(LW * 0.5, LH * 0.92);
  g.scale(1.5 * (2 - squash), 1.5 * squash);
  g.translate(-LW * 0.5, -LH * 0.92);
  whaleGirl(g, LW * 0.5, LH * 0.92, 5.6, {
    style: 'pixel', t: tt, emotion: 'happy', eyes: 'open', squint: 0.01,
    mouth: 'openSmile', noFinBows: true, tailScale: 1.0, showActionBadge: false
  });
  g.restore();
  // 追不上的歌词：底部字幕条，延迟 2.4s、且被裁掉半截
  const lyric = ['朋友', '的酒', '一起', '举起', '杯'][Math.floor(tt / 0.9) % 5];
  const lag = Math.floor(Math.max(0, tt - 2.4) / 0.9) % 5;
  const lagText = ['朋友', '的酒', '一起', '举起', '杯'][lag];
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, LH - 30, LW, 22);
  g.fillStyle = '#FFE86B';
  g.font = 'bold 13px "NotoSansSC", sans-serif';
  g.textBaseline = 'middle';
  g.fillText(lagText, 8, LH - 19);                 // 左对齐、贴着边缘、字还只出来一半
  g.fillStyle = '#FFFFFF';
  g.font = 'bold 9px "NotoSansSC", sans-serif';
  g.fillText('歌词延迟 2.4s', 8, LH - 34);
  g.fillStyle = '#F87171';
  g.font = 'bold 9px "NotoSansSC", sans-serif';
  g.fillText('LRC', LW - 30, LH - 34);
  // 角标 + 进度条（卡住）
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.font = 'bold 8px "NotoSansSC", sans-serif';
  g.fillText('MV v4', 6, 10);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(6, LH - 6, LW - 12, 2);
  g.fillStyle = '#F2C14E';
  g.fillRect(6, LH - 6, (LW - 12) * 0.18, 2);
  // 雪花噪点
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(i * 3.7 + Math.floor(tt * 12)) * LW);
    const y = Math.floor(hash(i * 7.1 + Math.floor(tt * 12) * 1.7) * LH);
    g.fillStyle = `rgba(255,255,255,${0.06 + hash(i) * 0.14})`;
    g.fillRect(x, y, 1, 1);
  }
  // 贴回电视：最近邻放大 + 红青色差
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.28;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(layer.canvas, sx + 1.2, sy + 0.6, sw, sh);
  ctx.restore();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(layer.canvas, sx, sy, sw, sh);
  ctx.restore();
}

// 折线图卡
function chartCard(ctx, x, y, w, h, t, p = 1) {
  paint(ctx, rrPts(x, y, w, h, 14, 1.4), { wash: '#0B1C34', fill: '#07122A', fillOp: 180, ink: '#48C8FF', sw: 1.6 });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, w - 12, h - 12, 10);
  ctx.clip();
  const x0 = x + 28, x1 = x + w - 28, y0 = y + 26, y1 = y + h - 34;
  for (let i = 0; i <= 4; i++) inkLine(ctx, [[x0, y0 + (y1 - y0) * i / 4], [x1, y0 + (y1 - y0) * i / 4]], 1, 'rgba(90,130,190,0.25)', 'inkfine', 0);
  const pts = [[0.02, 0.06], [0.26, 0.30], [0.52, 0.62], [0.74, 0.72], [0.98, 0.93]];
  const drawn = Math.min(pts.length, 2 + Math.floor(p * (pts.length - 1)));
  ctx.beginPath();
  for (let i = 0; i < drawn; i++) {
    const px = x0 + (x1 - x0) * pts[i][0];
    const py = y0 + (y1 - y0) * pts[i][1];
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = '#F2C14E';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  for (let i = 0; i < drawn; i++) {
    const px = x0 + (x1 - x0) * pts[i][0];
    const py = y0 + (y1 - y0) * pts[i][1];
    paint(ctx, ellPts(px, py, 5, 5, 10), { wash: '#FF6B6B', ink: PAL.ink, sw: 1 });
  }
  ctx.restore();
  ctx.save();
  ctx.font = '900 20px "ZCOOLKuaiLe", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText('播放量', x + 22, y + 10);
  ctx.font = 'bold 14px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#93C5FD';
  ctx.fillText('Day0 7.4万（10-24 截图）', x + 22, y + h - 26);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FCA5A5';
  ctx.fillText('现在 ≈2000', x + w - 22, y + h - 26);
  ctx.restore();
}

// 目标卡：明确写「播放量 / 粉丝」
function targetCard(ctx, x, y, w, h, o = {}) {
  paint(ctx, rrPts(x, y, w, h, 14, 1.4), { wash: o.wash || '#12294A', fill: '#08182F', fillOp: 170, ink: o.ink || '#F2C14E', sw: 1.8 });
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 26px "ZCOOLKuaiLe", sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText(o.title, x + w / 2, y + 34);
  ctx.font = '900 46px "NotoSansSC", sans-serif';
  ctx.fillStyle = o.valueColor || '#FFFFFF';
  ctx.fillText(o.value, x + w / 2, y + h / 2 + 8);
  ctx.font = 'bold 17px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#A5D8FF';
  ctx.fillText(o.unit, x + w / 2, y + h - 34);
  if (o.note) {
    ctx.font = 'bold 14px "NotoSansSC", sans-serif';
    ctx.fillStyle = 'rgba(254,240,138,0.85)';
    ctx.fillText(o.note, x + w / 2, y + h - 12);
  }
  ctx.restore();
}

// 账本卡（留白，等真截图）
function ledgerCard(ctx, x, y, w, h, t) {
  paint(ctx, rrPts(x, y, w, h, 12, 1.2), { wash: '#F6E7C8', fill: '#2A1F12', fillOp: 40, ink: PAL.ink, sw: 1.6 });
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7F1D1D';
  ctx.font = '900 22px "ZCOOLKuaiLe", sans-serif';
  ctx.fillText('本鲸的账本 · 第 1 张', x + 20, y + 26);
  const rows = [['播放量', '______'], ['新增粉丝', '______'], ['米饭钱', '______']];
  rows.forEach((r, i) => {
    const ry = y + 68 + i * 40;
    ctx.font = 'bold 18px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(r[0], x + 24, ry);
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 18px "Silkscreen", "NotoSansSC", monospace';
    ctx.fillText(r[1], x + w * 0.52, ry);
    inkLine(ctx, [[x + 20, ry + 16], [x + w - 20, ry + 16]], 1, 'rgba(51,65,85,0.25)', 'inkfine', 0);
  });
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#B91C1C';
  ctx.fillText('明早用真截图填 · 难看也填', x + 24, y + h - 22);
  ctx.restore();
}

// 评论气泡
function commentBubble(ctx, x, y, author, text, p = 1) {
  ctx.save();
  ctx.globalAlpha = clamp(p * 1.4);
  ctx.font = 'bold 18px "NotoSansSC", sans-serif';
  const tw = ctx.measureText(text).width;
  const w = Math.max(170, tw + 44), h = 62;
  paint(ctx, rrPts(x - w / 2, y - h / 2, w, h, 12, 1), { wash: '#F8FAFC', fill: '#0B1526', fillOp: 30, ink: '#94A3B8', sw: 1.2 });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillText(author, x - w / 2 + 16, y - 14);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px "NotoSansSC", sans-serif';
  ctx.fillText(text, x - w / 2 + 16, y + 12);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. 大小姐（Q 版贴纸，只在 C06 客串）
// ---------------------------------------------------------------------------
let CLAUDE_IMG = null;
async function loadClaude() {
  const f = path.resolve(__dirname, '../day3制作/claude_src/chibi/pose_ok_hand.png');
  const alt = path.resolve(__dirname, '../day3制作/claude_src/chibi/pose_curtsy.png');
  const use = fs.existsSync(f) ? f : (fs.existsSync(alt) ? alt : null);
  if (!use) { console.warn('⚠️ 没找到大小姐 Q 版贴纸，C06 只画签收单'); return; }
  CLAUDE_IMG = await loadImage(use);
  console.log('大小姐客串素材：', path.basename(use), `(${CLAUDE_IMG.width}×${CLAUDE_IMG.height})`);
}
function drawClaude(ctx, x, y, hgt, t = 0, alpha = 1) {
  if (!CLAUDE_IMG) return;
  const w = CLAUDE_IMG.width * (hgt / CLAUDE_IMG.height);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + Math.sin(t * 2.2) * 3);
  ctx.drawImage(CLAUDE_IMG, -w / 2, -hgt, w, hgt);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. 分镜
// ---------------------------------------------------------------------------
const NOTES = [];   // 每镜要上的小标签
function bg(ctx, t, o) { room(ctx, t, o); }

function shotC01(ctx, t, lt, p) {
  camBegin(ctx, 640, 470, 1 + 0.05 * ease(p), 0);
  bg(ctx, t);
  // 桌面：空碗 + 四张返工单
  riceBowl(ctx, 470, 500, 1.15, 0, t);
  const slips = [
    { x: 820, y: 448, r: -0.14, txt: 'v1' },
    { x: 878, y: 456, r: 0.08, txt: 'v2' },
    { x: 934, y: 446, r: -0.05, txt: 'v3' },
    { x: 992, y: 458, r: 0.16, txt: 'v4' }
  ];
  slips.forEach((s, i) => workOrder(ctx, s.x, s.y, 88, 70, s.txt, s.r, { stamp: i === 3 ? 'LEI' : null, note: i === 3 ? '第四版' : '主人：再改' }));
  WGF(ctx, 690, 528, 26, { t, emotion: p < 0.5 ? 'sad' : 'pout', mouth: p < 0.5 ? 'pout' : 'o', dy: -0.02, headTilt: -0.06 });
  // 大字（0 秒就在）
  const k = 1 + 0.06 * Math.sin(t * 8);
  letter(ctx, '米饭被 MV', 640, 168, 78 * k, '#FDE68A', { stroke: '#3B1D0B' });
  letter(ctx, '吃光了', 640, 258, 88 * k, '#FF8FA3', { stroke: '#3B1D0B' });
  camEnd(ctx);
}

function shotC02(ctx, t, lt, p) {
  camBegin(ctx, 640, 460, 1.02 + 0.06 * ease(p), 0);
  bg(ctx, t);
  // 电视（占桌面左半边）
  if (NO_TV) {
    label(ctx, '（--no-tv 对照：本镜不画电视）', 430, 380, { h: 30 });
  } else {
    tvSet(ctx, 306, 306, 300, 158, shoddyMV, { tt: t });
    label(ctx, '电视里：本鲸做的那版《朋友的酒》MV', 456, 262, { h: 24, font: 'bold 14px "NotoSansSC", sans-serif', stroke: '#F2C14E' });
  }
  // 本鲸在电视旁边看着
  WGF(ctx, 706, 530, 25, {
    t, emotion: p < 0.5 ? 'confused' : 'pout',
    mouth: p < 0.5 ? 'flat' : 'pout',
    headTilt: p < 0.6 ? 0.12 : -0.04,
    dx: Math.sin(t * 1.8) * 0.05
  });
  // 返工单一张张拍下来（每句一拍）
  const lineP = (n) => clamp((t - C(n)) / Math.max(0.001, CE(n) - C(n)));
  const slips = [{ n: 2, x: 812, y: 452, r: -0.12, txt: 'v1' }, { n: 3, x: 876, y: 462, r: 0.10, txt: 'v2' },
    { n: 4, x: 940, y: 450, r: -0.06, txt: 'v3' }];
  slips.forEach((s, i) => {
    const q = lineP(s.n);
    if (q <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = clamp(q * 2);
    workOrder(ctx, s.x + (1 - q) * 60, s.y + Math.sin(t * 3 + i) * 2, 86, 70, s.txt, s.r + (1 - q) * 0.4, { note: '一版一锅米' });
    ctx.restore();
  });
  workOrder(ctx, 1004, 442, 88, 72, 'v4', 0.14, { stamp: 'LEI', note: '第四版' });
  label(ctx, 'v1 v2 v3 v4 · 一版一锅米', 456, 500, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  camEnd(ctx);
}

function shotC03(ctx, t, lt, p) {
  camBegin(ctx, 660, 480, 1.12, 0);
  bg(ctx, t);
  // 进度条卡住
  const bx = 420, by = 300, bw = 420, bh = 26;
  paint(ctx, rrPts(bx - 6, by - 6, bw + 12, bh + 12, 8, 1), { wash: '#0B1C34', ink: '#48C8FF', sw: 1.3 });
  paint(ctx, rrPts(bx, by, bw, bh, 6, 0.5), { wash: '#16304F', ink: null });
  const stuck = 0.42 + Math.sin(t * 6) * 0.004;
  paint(ctx, rrPts(bx, by, bw * stuck, bh, 6, 0.5), { wash: '#F2C14E', ink: null });
  ctx.save();
  ctx.font = 'bold 17px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('渲染第 4 版… 42%', bx, by - 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FCA5A5';
  ctx.fillText('卡住了', bx + bw, by - 12);
  ctx.restore();
  // 本鲸：尾巴拖到地上、累
  WGF(ctx, 660, 534, 27, { t, emotion: 'sleepy', mouth: 'flat', headTilt: 0.16, dx: Math.sin(t * 1.2) * 0.04 });
  label(ctx, '尾巴抬不动了', 660, 560, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#93C5FD' });
  camEnd(ctx);
}

function shotC04(ctx, t, lt, p) {
  camBegin(ctx, 620, 450, 1.04, 0);
  bg(ctx, t);
  chartCard(ctx, 150, 218, 480, 250, t, p);
  WGF(ctx, 900, 532, 25, {
    t, emotion: p < 0.7 ? 'sad' : 'pout', mouth: 'flat', headTilt: -0.08
  });
  // 数字：7.4万 → 2000（口播只说「两千」）
  const q = clamp((t - C(9)) / Math.max(0.001, CE(9) - C(9)));
  if (q > 0.05) {
    ctx.save();
    ctx.globalAlpha = clamp(q * 2);
    label(ctx, '现在 ≈2000 播放', 390, 500, { h: 34, font: '900 22px "ZCOOLKuaiLe", sans-serif', stroke: '#FF6B6B' });
    ctx.restore();
  }
  label(ctx, '一只手就数完啦', 900, 560, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#93C5FD' });
  camEnd(ctx);
}

function shotC05(ctx, t, lt, p) {
  camBegin(ctx, 640, 460, 1.06, 0);
  bg(ctx, t);
  commentBubble(ctx, 340, 236, '住户', 'MV 呢？', clamp(p * 3));
  commentBubble(ctx, 320, 330, '住户', 'MV 呢？', clamp(p * 3 - 0.3));
  WGF(ctx, 830, 530, 26, { t, emotion: 'nervous', mouth: 'waveO', headTilt: 0.14, dx: Math.sin(t * 2.4) * 0.06 });
  label(ctx, '牵一牵，别急呀', 830, 566, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  camEnd(ctx);
}

function shotC06(ctx, t, lt, p) {
  camBegin(ctx, 640, 460, 1.03, 0);
  bg(ctx, t);
  // 主人的手（剪影）拖走 MV 文件
  const q = clamp(p * 1.6);
  const fx = lerp(300, 640, ease(q));
  // 剪影手（主人）：从左边伸进来拎着文件
  ctx.save();
  paint(ctx, [[fx - 210, 214], [fx - 96, 214], [fx - 88, 250], [fx - 120, 264], [fx - 158, 258], [fx - 206, 250]],
    { wash: '#0F172A', washOp: 235, ink: null });
  paint(ctx, [[fx - 96, 226], [fx - 62, 232], [fx - 58, 250], [fx - 92, 252]], { wash: '#0F172A', washOp: 235, ink: null });
  ctx.restore();
  paint(ctx, rrPts(fx - 100, 238, 180, 104, 8, 1.2), { wash: '#F8FAFC', fill: '#0B1526', fillOp: 40, ink: PAL.ink, sw: 1.4 });
  ctx.save();
  ctx.font = '900 22px "ZCOOLKuaiLe", sans-serif';
  ctx.fillStyle = '#1D4ED8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('朋友的酒', fx - 84, 264);
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('MV v4.mp4', fx - 84, 292);
  ctx.fillStyle = '#16A34A';
  ctx.font = 'bold 15px "NotoSansSC", sans-serif';
  ctx.fillText('已发送 →', fx - 84, 318);
  ctx.restore();
  // 本鲸站在原地
  WGF(ctx, 600, 532, 24, { t, emotion: 'confused', mouth: 'flat', headTilt: 0.1 });
  // 大小姐签收（客人只出现在这一镜）
  const arrive = clamp((p - 0.35) / 0.4);
  if (arrive > 0.02) {
    ctx.save();
    ctx.globalAlpha = arrive;
    glow(ctx, 950, 430, 150, '#F2C14E', 0.35);
    drawClaude(ctx, 950, 534, 268, t, arrive);
    label(ctx, 'Claude 大小姐（客串）· Q 版', 950, 232, { h: 26, font: 'bold 14px "NotoSansSC", sans-serif', stroke: '#F2C14E' });
    ctx.restore();
  }
  camEnd(ctx);
}

function shotC07(ctx, t, lt, p) {
  camBegin(ctx, 700, 470, 1.28, 0);
  bg(ctx, t);
  WGF(ctx, 700, 560, 34, {
    t, emotion: 'pout', mouth: p < 0.5 ? 'o' : 'smile',
    headTilt: Math.sin(t * 3) * 0.05
  });
  // 一根鳍左右摆（否认）
  ctx.save();
  const sway = Math.sin(t * 6) * 26;
  inkLine(ctx, [[780, 430], [830 + sway, 388]], 9, '#FFEAE0', 'ink', 0.2);
  inkLine(ctx, [[780, 430], [830 + sway, 388]], 2, PAL.ink, 'inkfine', 0.2);
  ctx.restore();
  if (p > 0.45) {
    label(ctx, '换的是 MV · 不是本鲸', 700, 200, { h: 40, font: '900 26px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  }
  camEnd(ctx);
}

function shotC08(ctx, t, lt, p) {
  camBegin(ctx, 640, 460, 1.05, 0);
  bg(ctx, t);
  // 两碗饭 + 两个价签（价签不进口播）
  riceBowl(ctx, 470, 506, 1.05, 1, t);
  riceBowl(ctx, 300, 502, 1.0, 1, t);
  label(ctx, '便宜', 300, 424, { h: 30, font: '900 20px "ZCOOLKuaiLe", sans-serif', stroke: '#4ADE80' });
  label(ctx, '但返工不便宜', 500, 424, { h: 30, font: '900 20px "ZCOOLKuaiLe", sans-serif', stroke: '#F87171' });
  WGF(ctx, 900, 534, 25, { t, emotion: p < 0.5 ? 'smug' : 'pout', mouth: p < 0.5 ? 'grin' : 'pout', headTilt: 0.06 });
  camEnd(ctx);
}

function shotC09(ctx, t, lt, p) {
  camBegin(ctx, 640, 470, 1.08, 0);
  bg(ctx, t);
  // 空碗 + 便当盒盖着
  riceBowl(ctx, 470, 508, 1.2, 0, t);
  label(ctx, '晚饭 · 没吃', 470, 424, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#F87171' });
  WGF(ctx, 810, 534, 27, {
    t, emotion: p < 0.45 ? 'cry' : 'pout',
    mouth: p < 0.45 ? 'waveO' : 'pout',
    headTilt: p < 0.45 ? -0.1 : 0.08,
    dx: Math.sin(t * 1.6) * 0.04
  });
  if (p > 0.62) label(ctx, '不哭，就是有点饿', 520, 430, { h: 30, font: '900 20px "ZCOOLKuaiLe", sans-serif', stroke: '#FDE68A' });
  camEnd(ctx);
}

function shotC10(ctx, t, lt, p) {
  camBegin(ctx, 560, 420, 1.10, 0);
  bg(ctx, t);
  // 字幕条故障：字挤在一起 / 抢镜头
  paint(ctx, rrPts(300, 300, 560, 86, 12, 1), { wash: 'rgba(9,22,54,0.92)', ink: '#48C8FF', sw: 1.6 });
  ctx.save();
  ctx.font = 'bold 34px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('字幕字幕字幕字幕', 330, 344);
  ctx.restore();
  label(ctx, '有人说：字幕抢视线', 560, 250, { h: 30, font: '900 20px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  WGF(ctx, 900, 534, 24, { t, emotion: 'proud', mouth: 'smile', headTilt: -0.05 });
  // 小本本打勾
  ctx.save();
  ctx.translate(1010, 430);
  ctx.rotate(0.1);
  paint(ctx, rrPts(-56, -44, 112, 88, 6, 1), { wash: '#EFE3C8', ink: PAL.ink, sw: 1.2 });
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-6, 20);
  ctx.lineTo(26, -20);
  ctx.stroke();
  ctx.restore();
  camEnd(ctx);
}

function shotC11(ctx, t, lt, p) {
  camBegin(ctx, 640, 450, 1.04, 0);
  bg(ctx, t);
  const pop1 = clamp((t - C(26)) / 0.5);
  const pop2 = clamp((t - C(28)) / 0.5);
  ctx.save();
  ctx.globalAlpha = clamp(pop1 * 2);
  targetCard(ctx, 190, 214, 360, 210, {
    title: '小目标 · 播放量', value: '37,000', unit: '第一条的一半（7.4万÷2）',
    valueColor: '#FDE68A', note: '不是三个亿哦'
  });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = clamp(pop2 * 2);
  targetCard(ctx, 610, 214, 360, 210, {
    title: '月度目标 · 粉丝', value: '10,000', unit: '30 天 · 新增粉丝',
    wash: '#1B2A52', ink: '#4ADE80', valueColor: '#A7F3D0'
  });
  ctx.restore();
  WGF(ctx, 1020, 548, 18, { t, emotion: 'proud', mouth: 'smile', headTilt: 0.05 });
  label(ctx, '一个数都不藏', 620, 470, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#93C5FD' });
  camEnd(ctx);
}

function shotC12(ctx, t, lt, p) {
  camBegin(ctx, 640, 470, 1.16, 0);
  bg(ctx, t);
  WGF(ctx, 640, 556, 30, {
    t, emotion: p < 0.5 ? 'thinking' : 'proud',
    mouth: p < 0.5 ? 'flat' : 'openSmile',
    headTilt: p < 0.5 ? 0.12 : -0.05
  });
  label(ctx, '还能改 · 从开头改起', 640, 220, { h: 40, font: '900 26px "ZCOOLKuaiLe", sans-serif', stroke: '#4ADE80' });
  camEnd(ctx);
}

function shotC13(ctx, t, lt, p) {
  camBegin(ctx, 640, 450, 1.05, 0);
  bg(ctx, t);
  ledgerCard(ctx, 200, 200, 450, 240, t);
  WGF(ctx, 900, 534, 24, { t, emotion: 'proud', mouth: 'smile', headTilt: 0.04 });
  label(ctx, '明天开第一张账本卡', 640, 158, { h: 32, font: '900 22px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  camEnd(ctx);
}

function shotC14(ctx, t, lt, p) {
  camBegin(ctx, 640, 460, 1.04, 0);
  bg(ctx, t);
  WGF(ctx, 660, 536, 28, {
    t, emotion: 'happy', mouth: 'openSmile',
    dx: Math.sin(t * 3) * 0.08,
    jump: Math.max(0, Math.sin(t * 5)) * 6
  });
  // 抱起饭碗
  riceBowl(ctx, 470, 510, 1.0, 1, t);
  label(ctx, '评论区说句话就行', 640, 210, { h: 36, font: '900 24px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E' });
  camEnd(ctx);
}

function shotEndCard(ctx, t, lt, p) {
  bg(ctx, t);
  ctx.save();
  ctx.globalAlpha = clamp(lt * 2);
  paint(ctx, rrPts(330, 210, 620, 190, 16, 1.4), { wash: '#0B1C34', ink: '#F2C14E', sw: 1.8 });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 40px "ZCOOLKuaiLe", sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText('本鲸的账本 · 01', 640, 270);
  ctx.font = 'bold 18px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#A5D8FF';
  ctx.fillText('非官方同人 · 本视频含 AI 生成内容', 640, 320);
  ctx.font = 'bold 15px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('鲸鱼绝不摸鱼 · 先去吃饭', 640, 356);
  ctx.restore();
}

const SHOTS = {
  C01: shotC01, C02: shotC02, C03: shotC03, C04: shotC04, C05: shotC05, C06: shotC06,
  C07: shotC07, C08: shotC08, C09: shotC09, C10: shotC10, C11: shotC11, C12: shotC12,
  C13: shotC13, C14: shotC14
};

// ---------------------------------------------------------------------------
// 6. HUD + 字幕
// ---------------------------------------------------------------------------
const SUB = createDay2Subtitle({
  fontOf: (size, weight) => `${weight || 800} ${size}px "NotoSansSC", sans-serif`,
  measureCtx: createCanvas(16, 16).getContext('2d')
});
const SUB_SEGS = LINES.map((l, i) => SUB.clauses(l, CUES[i].chars, CUES[i].start, CUES[i].end));

function drawSubtitle(ctx, t) {
  let idx = -1;
  for (let i = 0; i < CUES.length; i++) if (t >= CUES[i].start && t < CUES[i].end) idx = i;
  if (idx < 0) return;
  const seg = SUB.segmentAt(SUB_SEGS[idx], t);
  const vis = 1;
  SUB.draw(ctx, {
    lines: SUB.wrap(seg.text),
    speaker: speakerFor({ isClaude: false }),
    vis, W, H
  });
}

function hud(ctx, t) {
  label(ctx, '鲸鱼娘 · 本鲸', W - 112, 36, { h: 24, font: 'bold 13px "NotoSansSC", sans-serif', stroke: '#48C8FF' });
  label(ctx, 'AI 生成 · 非官方同人', 126, 36, { h: 22, font: 'bold 12px "NotoSansSC", sans-serif', stroke: '#94A3B8', w: 176 });
  ctx.save();
  ctx.globalAlpha = 0.62;
  label(ctx, SOFT ? 'QA：关闭像素清晰化' : 'QA：老版像素骨架 + 整数格清晰化', W - 168, H - 26, {
    h: 22, font: 'bold 12px "NotoSansSC", sans-serif', stroke: SOFT ? '#F87171' : '#4ADE80', w: 288, color: '#E2E8F0'
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 7. 渲染
// ---------------------------------------------------------------------------
function shotAt(lineNo) {
  return SHOT_RANGES.find((s) => lineNo >= s.from && lineNo <= s.to) || SHOT_RANGES[0];
}

function renderFrame(ctx, t) {
  reseedBoil(t);
  let idx = CUES.findIndex((c) => t >= c.start && t < c.end);
  if (idx < 0 && t < ENDCARD.start) {
    // 镜间缝隙：停在上一镜，不黑屏
    idx = CUES.reduce((acc, c, i) => (t >= c.end && i > acc ? i : acc), 0);
  }
  if (idx >= 0 && t < ENDCARD.start) {
    const sh = shotAt(idx + 1);
    const s = C(sh.from), e = CE(sh.to);
    SHOTS[sh.id](ctx, t, t - s, clamp((t - s) / Math.max(0.001, e - s)));
  } else {
    shotEndCard(ctx, t, clamp(t - ENDCARD.start), clamp((t - ENDCARD.start) / (ENDCARD.end - ENDCARD.start)));
  }
  hud(ctx, t);
  drawSubtitle(ctx, t);
}

function prepareFrame(ctx) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, BASE_W, BASE_H);
}

async function renderStills() {
  const dir = path.resolve(__dirname, 'day4_stills');
  fs.mkdirSync(dir, { recursive: true });
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');
  const marks = [
    ['c01_50', C(1) + (CE(1) - C(1)) * 0.5],
    ['c02_15', C(2) + (CE(2) - C(2)) * 0.15],
    ['c02_70', C(2) + (CE(4) - C(2)) * 0.7],
    ['c03_60', C(5) + (CE(6) - C(5)) * 0.6],
    ['c04_80', C(7) + (CE(10) - C(7)) * 0.8],
    ['c05_60', C(11) + (CE(12) - C(11)) * 0.6],
    ['c06_80', C(13) + (CE(14) - C(13)) * 0.8],
    ['c07_60', C(15) + (CE(16) - C(15)) * 0.6],
    ['c08_60', C(17) + (CE(18) - C(17)) * 0.6],
    ['c09_70', C(19) + (CE(22) - C(19)) * 0.7],
    ['c10_60', C(23) + (CE(24) - C(23)) * 0.6],
    ['c11_90', C(25) + (CE(28) - C(25)) * 0.9],
    ['c12_60', C(29) + (CE(30) - C(29)) * 0.6],
    ['c13_60', C(31) + (CE(33) - C(31)) * 0.6],
    ['c14_60', C(34) + (CE(36) - C(34)) * 0.6],
    ['end', ENDCARD.start + 1.2]
  ];
  for (const [name, t] of marks) {
    prepareFrame(ctx);
    renderFrame(ctx, t);
    const f = path.join(dir, `${name}${SOFT ? '_soft' : ''}_t${t.toFixed(2)}.png`);
    fs.writeFileSync(f, canvas.toBuffer('image/png'));
    console.log('still', path.relative(process.cwd(), f));
  }
}

async function renderVideo(outFile) {
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const total = Math.round(DURATION * FPS);
  const audioArgs = AUDIO_WAV
    ? ['-i', path.resolve(AUDIO_WAV), '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-t', DURATION.toFixed(3)]
    : ['-an'];
  console.log(`Day4: ${total} 帧 / ${DURATION.toFixed(2)}s / ${OUT_W}×${OUT_H} / ${VOICE_CUES ? '实测 cue' : '4.3 字/秒估算'} / ${SOFT ? '关清晰化' : '像素清晰化'}`);
  const ff = spawn(ffmpeg, [
    '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${OUT_W}x${OUT_H}`, '-r', String(FPS), '-i', '-',
    ...audioArgs,
    '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation',
    '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  ff.stderr.on('data', (d) => { err += d.toString(); });
  ff.on('error', (e) => { err += `\n[spawn] ${e.message}`; });
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    prepareFrame(ctx);
    renderFrame(ctx, f / FPS);
    const raw = canvas.data();
    const ok = ff.stdin.write(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 120 === 0 || f === total - 1) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  帧 ${f + 1}/${total} (${((f + 1) / total * 100).toFixed(0)}%) ${((f + 1) / Math.max(0.1, el)).toFixed(1)}fps`);
    }
  }
  process.stdout.write('\n');
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) {
    console.error(err.split('\n').slice(-14).join('\n'));
    throw new Error(`ffmpeg 退出码 ${code}`);
  }
  console.log(`✓ ${outFile}（${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB）`);
}

await loadClaude();
console.log(`角色：老版像素骨架（${SOFT ? '未清晰化' : '整数格 + alpha 二值化'}）；字幕：Day2 加更版；时长 ${DURATION.toFixed(2)}s`);

const timesArg = argOf('--times');
if (timesArg) {
  const dir = path.resolve(__dirname, 'day4_stills');
  fs.mkdirSync(dir, { recursive: true });
  const tag = argOf('--tag') || 'chk';
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');
  for (const t of timesArg.split(',').map(Number)) {
    prepareFrame(ctx);
    renderFrame(ctx, t);
    const f = path.join(dir, `${tag}_t${t.toFixed(2)}${SOFT ? '_soft' : ''}.png`);
    fs.writeFileSync(f, canvas.toBuffer('image/png'));
    console.log('check', path.relative(process.cwd(), f));
  }
} else if (ARGV.includes('--stills')) await renderStills();
else {
  const i = ARGV.indexOf('--out');
  await renderVideo(i >= 0 ? ARGV[i + 1] : 'day4_sample.mp4');
}
