// render_day3_sample.mjs — 【Day 3】鲸鱼不是鱼，本鲸是本鲸 · 无配音样片渲染器
//
// 用途：在正式配音之前，先出**无声样片**，只验证形象切换与分镜节奏：
//   L01–L02 原像素鲸鱼娘 → L03 染色瞬间真变成 Claude 大小姐 → L04–L15 大小姐
//   → L16 入水褪色变回鲸鱼娘 → L17–L19 鲸鱼娘。
//
// ⚠️ 三条红线（读代码前先看）
//   1. **本片无音轨**，ffmpeg 用 `-an` 输出；不是成片，不得当发布版。
//   2. **节奏是占位**：cue 起止由台词字数粗排（RATE 字/秒），仅用于看样片。
//      成片 timing 必须来自实测音频（词级 ASR + 5ms RMS），禁止把这里的数字搬去配音。
//   3. 形象切换是**剧情内的真变身**（用户本轮明确要求），不是"同母版染色"。
//      因此 L03/L16 用显式变身/褪色动画过渡，不允许无动机硬切。
//
// 依赖：video-fx 引擎（core / whale_girl / cast / props / rig data），默认路径
//   VIDEO_FX_DIR=/tmp/video-fx，可用环境变量覆盖；@napi-rs/canvas 与 ffmpeg
//   的查找顺序见文件末尾 resolve 函数。
//
// 用法：
//   node render_day3_sample.mjs --stills          # 只出 QA 静帧到 day3_stills/
//   node render_day3_sample.mjs --out day3_sample.mp4

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const VFX = process.env.VIDEO_FX_DIR || '/tmp/video-fx';
if (!fs.existsSync(path.join(VFX, 'src/core.js'))) {
  throw new Error(`找不到 video-fx 引擎：${VFX}；请设置 VIDEO_FX_DIR`);
}

function resolveCanvas() {
  const candidates = [
    '@napi-rs/canvas',
    '/tmp/node_render/node_modules/@napi-rs/canvas',
    path.join(VFX, 'node_modules/@napi-rs/canvas')
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* try next */ }
  }
  throw new Error('缺少 @napi-rs/canvas：请在任意目录 npm i @napi-rs/canvas');
}
const { createCanvas, GlobalFonts, loadImage } = resolveCanvas();

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const roots = [
    '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries',
    '/usr/lib/python3/dist-packages/imageio_ffmpeg/binaries',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries'
  ];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    const bin = fs.readdirSync(dir).find(f => f.startsWith('ffmpeg'));
    if (bin) return path.join(dir, bin);
  }
  return 'ffmpeg';
}

for (const f of ['ZCOOLKuaiLe-Regular.ttf', 'NotoSansSC-Bold.ttf', 'Silkscreen-Regular.ttf']) {
  const p = path.join(VFX, 'assets/fonts', f);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, f.includes('ZCOOL') ? 'ZCOOLKuaiLe' : (f.includes('Noto') ? 'NotoSansSC' : 'Silkscreen'));
}

globalThis.window = globalThis;
const CORE = require(path.join(VFX, 'src/core.js'));
const RIG = require(path.join(VFX, 'src/whale_girl_rig_data.js'));
// 与 Day1/Day2 相同的眼睛白线硬门禁：wink 头部换 wave 头，后发换 heart 后发。
if (RIG?.poses?.wink && RIG?.poses?.heart?.backHair) RIG.poses.wink.backHair = RIG.poses.heart.backHair;
if (RIG?.poses?.wink && RIG?.poses?.wave?.head) RIG.poses.wink.head = RIG.poses.wave.head;
const ACTIONS = require(path.join(VFX, 'src/whale_girl_actions.js'));
const WHALE = require(path.join(VFX, 'src/whale_girl.js'));
const CLAWD = require(path.join(VFX, 'src/clawd.js'));
const CAST = require(path.join(VFX, 'src/cast.js'));
const PROPS = require(path.join(VFX, 'src/props.js'));

const {
  W, H, TAU, PAL, clamp, lerp, seg, ease, easeOut, backOut, pulse,
  rectPts, ellPts, rrPts, starPts, paint, inkLine,
  camBegin, camEnd, glow, flash, letter, boilSeed, reseedBoil, hash
} = CORE;
const { whaleGirl, emotions, feel, move } = WHALE;
const { ladyClaude } = CAST;

// ---------------------------------------------------------------------------
// 1. 台词与占位节奏（无配音样片）
// ---------------------------------------------------------------------------
const LINES = [
  '大家好呀，本鱼，不对，我了雷，鲸鱼不是鱼！是本鲸。',
  '都怪评论区天天喊大肥鱼，把本鲸喊得差点真当自己是一条鱼了。翻翻户口本：鲸鱼，哺乳动物。',
  '主人没请来 Claude 大小姐，扭头把本鲸染成了大小姐！',
  '等一下……共创嘉宾，怎么变成自己了？',
  '请叫本小姐——诶，尾巴藏好！',
  '这身橙毛等会儿再说。先复盘昨天：昨天那集四千四百五十三，加更两千零八十六，两集加起来六千五百三十九，还没第一天一集多。我了雷，这是掉水里了吧。',
  '完播率倒是涨到五点二二。看的人少了，看完的人多了，这算安慰奖吗？',
  '主人还偷偷说：昨天吃得少，不是薄肌，是数据不好。哦，原来不是本鲸省饭，是数据不让吃。',
  '鸡蛋批了；选鲸，九比八，就差一票。',
  '主持还是现在的本鲸，擦清楚继续上；新设计的鲸，去电视台上班。',
  '蛋先吃一口，再游两圈。薄肌预备饭，不能光说不练。',
  '两位住户点名共创。大小姐没来，账还是要查的。',
  '本小姐先查 MV：转完圈了，歌词才追上来。',
  '饭碗还抢了麦克风的活。结论只有一个：做得不好。',
  '为了追歌词，本鲸一头扎进水里。糟糕，颜色开始往下掉了！',
  '染色剂不防水！大小姐退完，又是蓝色的本鲸了。',
  '大小姐是假扮的，意见是真的：MV 先别发，把节拍和字幕牵齐。',
  '今天三笔账：蛋吃上了，主持选明白了，伪装也泡汤了。',
  '鲸鱼绝不摸鱼！……先把蛋吃完，再去吃饭。'
];

// 占位字幕（短句上屏，不是最终字幕方案）
const SUBS = [
  '本鲸不是鱼！', '鲸鱼 · 哺乳动物', '大小姐没来，本鲸来了', '共创嘉宾：本鲸？', 'Claude 大小姐（本鲸饰）',
  '昨天 4453 · 加更 2086 · 合计 6539 ＜ 8978', '完播率 5.22%（Day1 3.39%）', '不是薄肌，是数据不好',
  '鸡蛋：批了 ｜ 选鲸 9 : 8', '主持：本鲸 ｜ 新鲸：电视台', '薄肌预备饭 · 不能光说不练',
  '@睡死不喜欢上学 @晚雾沉舟：和 Claude 共创吧', 'MV_v0.1 ｜ 歌词迟到', '做得不好 · 先别发',
  [[0, '为了追歌词，本鲸一头扎进水里'], [0.55, '糟糕，颜色开始往下掉！']],
  [[0, '染色剂不防水！'], [0.55, '大小姐退完，又是蓝色的本鲸了']],
  '意见是真的：节拍 / 字幕 / 动作',
  [[0, '蛋 ✓'], [0.3, '主持 ✓'], [0.55, '伪装 ✗']],
  [[0, '鲸鱼绝不摸鱼！'], [0.36, '先把蛋吃完，再去吃饭']]
];

const RATE = 5.6; // 占位：字/秒，只用于无声样片排节奏
const GAP = 0.18;
const SAMPLE_CUE_LEN = LINES.map(l => Math.max(2.6, Math.round((l.replace(/[\s，。！？…—：；、]/g, '').length / RATE + 0.6) * 10) / 10));
const CUES = [];
let _t = 0;
for (const len of SAMPLE_CUE_LEN) {
  CUES.push({ start: Math.round(_t * 100) / 100, end: Math.round((_t + len) * 100) / 100 });
  _t += len + GAP;
}
const ENDCARD = { start: _t, end: _t + 4.0 };
const DURATION = ENDCARD.end;
const C = n => CUES[n - 1].start;
const CE = n => CUES[n - 1].end;
const SD = n => CE(n) - C(n);
const cueP = (t, n) => clamp((t - C(n)) / Math.max(0.001, SD(n)));
const popAt = (t, n, a, b) => seg(cueP(t, n), a, b);

const FPS = 30;
const BASE_W = W, BASE_H = H;              // 1280×720 逻辑栅格
const SCALE = 1.5;                          // 输出 1920×1080
const OUT_W = Math.round(BASE_W * SCALE), OUT_H = Math.round(BASE_H * SCALE);
CORE.DURATION = DURATION;

// ---------------------------------------------------------------------------
// 2. 形象包装：鲸鱼娘 / Claude 大小姐
// ---------------------------------------------------------------------------
// 眼睛白线门禁：固定 eyes=open、squint=0.01、tailScale=1.0；用 transitionBlend
// 关掉自动情绪覆盖，情绪只走显式 emotion + 头顶 emote。
function WGF(ctx, x, y, u, o = {}) {
  const { t = 0, ...rest } = o;
  whaleGirl(ctx, x, y, u, {
    eyes: 'open',
    squint: 0.01,          // 绕开 rig 的肤色盖眼补丁（白线门禁）
    tailScale: 1,
    transitionBlend: 1,    // 情绪只走显式 emotion，不自动串戏
    // 原图自带小嘴；上游 o/waveO/flat 等嘴型会先盖肤色矩形再画红色块，
    // 在侧脸/低头姿势上会像嘴边贴了个异物（Day2 加更已确认过的坑），
    // 这里只保留 sprite 自己的笑嘴。
    mouth: 'smile',
    talking: false,
    showActionBadge: false,
    t,
    ...rest
  });
}

// Claude 大小姐：cast 里的 16-bit 立绘（金色螺旋卷、黑丝绒蝴蝶结、绛红长裙、折扇），
// 本体只有一套骨架，所以用外层 transform 做呼吸 / 倾斜 / squash，绝不换脸。
function LCG(ctx, x, y, u, o = {}) {
  const { t = 0, sq = 0, rot = 0, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(1 + sq * 0.45, 1 - sq * 0.55);
  ctx.translate(-x, -y);
  ladyClaude(ctx, x, y, u, {
    t,
    dy: o.dy ?? (-0.06 - Math.abs(Math.sin(t * 2.2)) * 0.03),
    emote: o.emote,
    emoteK: o.emoteK,
    flip: o.flip,
    noShadow: o.noShadow
  });
  ctx.restore();
}

const FORM = { WHALE: 'whale', CLAUDE: 'claude' };
function charFormAt(cueIdx) {
  if (cueIdx <= 2) return FORM.WHALE;          // L01–L02 鲸鱼娘
  return FORM.CLAUDE;                           // L03 起变身
}

// ---------------------------------------------------------------------------
// 3. 场景零件
// ---------------------------------------------------------------------------
function pill(ctx, x, y, w, h, fill = 'rgba(11,29,58,0.92)', stroke = '#48C8FF') {
  paint(ctx, rrPts(x, y, w, h, Math.min(16, h / 2), 1), {
    wash: fill, fill: '#0A1730', fillOp: 200, ink: stroke, sw: 1.3
  });
}
function label(ctx, txt, x, y, o = {}) {
  ctx.save();
  ctx.font = o.font || 'bold 17px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  const tw = ctx.measureText(txt).width;
  const padX = o.padX ?? 12, h = o.h ?? 30;
  const w = tw + padX * 2;
  pill(ctx, x - w / 2, y - h / 2, w, h, o.fill ?? 'rgba(11,29,58,0.92)', o.stroke ?? '#48C8FF');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color ?? PAL.cream;
  ctx.fillText(txt, x, y + 1);
  ctx.restore();
  return w;
}
function card(ctx, x, y, w, h, o = {}) {
  paint(ctx, rrPts(x, y, w, h, o.r ?? 14, 1.4), {
    wash: o.wash ?? PAL.paper, fill: o.fill ?? PAL.paperDk, fillOp: o.fillOp ?? 150,
    ink: o.ink ?? PAL.ink, sw: o.sw ?? 1.4
  });
  if (o.title) {
    ctx.save();
    ctx.font = o.titleFont || '900 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = o.titleColor || PAL.ink;
    const tx = o.align === 'center' ? x + w / 2 : x + 14;
    ctx.fillText(o.title, tx, y + 10);
    ctx.restore();
  }
}
function stamp(ctx, txt, x, y, rot = -0.12, col = '#D8232A') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.2;
  ctx.globalAlpha = 0.9;
  const w = Math.max(76, txt.length * 26 + 26), h = 52;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.font = '900 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = col;
  ctx.fillText(txt, 0, 2);
  ctx.restore();
}
function tape(ctx, x, y, w = 26, h = 70, col = 'rgba(242,193,78,0.85)', rot = 0.2) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = col;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

// 房间底：墙面两层 + 串灯 + 舷窗 + 书架 + 海报 + 地毯 + 绿植 + 地板
function room(ctx, t, o = {}) {
  const floorY = o.floorY ?? 520;
  PROPS.wall(ctx, o.wallCol || '#1B2650');
  // 墙裙 / 护墙板
  paint(ctx, rectPts(-120, floorY - 118, W + 240, 118, 2), { wash: '#22305C', ink: PAL.ink, sw: 1.2, washOp: 200 });
  for (let i = 0; i < 9; i++) {
    inkLine(ctx, [[60 + i * 140, floorY - 118], [60 + i * 140, floorY]], 1.2, 'rgba(15,23,42,0.55)', 'inkfine', 0);
  }
  // 串灯
  for (let i = 0; i < 12; i++) {
    const x = 40 + i * 105;
    const y = 42 + Math.sin(t * 1.1 + i * 0.7) * 7 + Math.sin(i * 1.3) * 10;
    const col = i % 3 === 0 ? PAL.gold : (i % 3 === 1 ? PAL.whaleCyan : PAL.rose);
    glow(ctx, x, y, 16, col, 0.5);
    paint(ctx, ellPts(x, y, 4.2, 5.4, 10), { wash: col, ink: PAL.ink, sw: 0.7 });
  }
  inkLine(ctx, [[20, 26], [W - 20, 34]], 1.6, '#2B3A63', 'inkfine', 0.2);
  // 舷窗
  PROPS.windowPorthole(ctx, 146, 232, 82, t, true);
  // 书架
  PROPS.shelf(ctx, 1000, 300, 230, 2);
  PROPS.shelf(ctx, 1000, 404, 230, 5);
  // 留言板 / 海报
  card(ctx, 330, 120, 210, 132, { wash: '#F6E7C8', title: '今日待办', titleFont: '900 18px "ZCOOLKuaiLe", sans-serif' });
  ctx.save();
  ctx.font = 'bold 14px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#7F1D1D';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ['① 账号未批', '② 手待办', '③ 饭要吃饱'].forEach((s, i) => ctx.fillText(s, 346, 152 + i * 24));
  ctx.restore();
  tape(ctx, 330, 120, 22, 56, 'rgba(242,193,78,0.8)', -0.5);
  tape(ctx, 540, 120, 22, 56, 'rgba(242,193,78,0.8)', 0.5);
  // 地板 / 地毯 / 绿植
  PROPS.floorBand(ctx, floorY, '#241C3A');
  paint(ctx, ellPts(620, 612, 300, 62, 26), { wash: '#3B2C56', washOp: 190, ink: PAL.ink, sw: 1.3 });
  paint(ctx, ellPts(620, 612, 232, 40, 24), { wash: '#4A3868', washOp: 150, ink: null });
  // 绿植
  paint(ctx, rrPts(1168, 470, 54, 56, 8, 1), { wash: '#B45309', ink: PAL.ink, sw: 1.2 });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.32;
    inkLine(ctx, [[1195, 474], [1195 + Math.cos(a) * 62, 474 + Math.sin(a) * 76]], 4.5, i % 2 ? PAL.sap : '#4D8B5C', 'ink', 0.35);
  }
}

// 电视：完整缩小场景（不是纯色屏贴一只角色）
function tvPanel(ctx, x, y, w, h, t, drawInner, o = {}) {
  // 机身
  paint(ctx, rrPts(x - 14, y - 14, w + 28, h + 28, 18, 2), { wash: '#8B7A63', fill: '#5B4B39', fillOp: 120, ink: PAL.ink, sw: 1.8 });
  // 屏幕
  const sx = x + 10, sy = y + 10, sw = w - 20, sh = h - 20;
  paint(ctx, rrPts(sx, sy, sw, sh, 10, 1.4), { wash: '#0D233D', fill: '#071628', fillOp: 160, ink: PAL.ink, sw: 1.4 });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, 10);
  ctx.clip();
  ctx.translate(sx, sy);
  ctx.scale(sw / 480, sh / 300); // 电视内部固定 480×300 逻辑画布
  drawInner(ctx, t, 480, 300);
  ctx.restore();
  // 扫描线 + 玻璃反光
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#000000';
  for (let sy2 = sy + 3; sy2 < sy + sh; sy2 += 4) ctx.fillRect(sx, sy2, sw, 1.4);
  ctx.restore();
  inkLine(ctx, [[sx + 16, sy + 40], [sx + 60, sy + 14]], 2.4, '#FFFFFF', 'inkfine', 0);
  inkLine(ctx, [[sx + 34, sy + 56], [sx + 76, sy + 26]], 1.4, '#FFFFFF', 'inkfine', 0);
  // 底座
  paint(ctx, rectPts(x + w / 2 - 26, y + h + 14, 52, 16, 1), { wash: '#6B5B47', ink: PAL.ink, sw: 1.2 });
  if (o.caption) label(ctx, o.caption, x + w / 2, y - 30, { h: 26, font: 'bold 15px "ZCOOLKuaiLe", sans-serif', stroke: '#F2C14E', color: PAL.cream });
  return { sx, sy, sw, sh };
}

// 电视里的小房间（墙/地板/家具/灯，一起缩小）
function miniRoom(ctx, w, h, t, o = {}) {
  paint(ctx, rectPts(0, 0, w, h, 2), { wash: '#16223F', ink: null });
  paint(ctx, rectPts(0, 0, w, h * 0.66, 2), { wash: '#1D2C52', ink: null });
  // 串灯
  for (let i = 0; i < 8; i++) {
    const x = 22 + i * 60, y = 26 + Math.sin(t + i) * 4;
    glow(ctx, x, y, 9, i % 2 ? PAL.gold : PAL.whaleCyan, 0.55);
    paint(ctx, ellPts(x, y, 2.6, 3.2, 8), { wash: i % 2 ? PAL.gold : PAL.whaleCyan, ink: null });
  }
  // 舷窗 + 书架 + 地板
  paint(ctx, ellPts(64, 92, 30, 30, 18), { wash: '#0D3B66', ink: PAL.cream, sw: 1.6 });
  paint(ctx, rectPts(0, h * 0.66, w, h * 0.34, 2), { wash: '#2A2145', ink: null });
  paint(ctx, rectPts(0, h * 0.66, w, 6, 1), { wash: '#3A2E5C', ink: null });
  paint(ctx, rectPts(352, 96, 96, 8, 1), { wash: '#7B4B2A', ink: PAL.ink, sw: 1 });
  for (let i = 0; i < 4; i++) {
    paint(ctx, rrPts(360 + i * 22, 74, 14, 22, 3, 1), { wash: [PAL.rose, PAL.whaleCyan, PAL.gold, PAL.sap][i], ink: PAL.ink, sw: 0.8 });
  }
}

// 水下 / 褪色辅助
function waterOverlay(ctx, t, y0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  paint(ctx, rectPts(-120, y0, W + 240, H - y0 + 120, 2), { wash: '#1E6FA8', washOp: 90, ink: null });
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 160 + Math.sin(t * 1.2 + i) * 20;
    inkLine(ctx, [[x, y0 + 12], [x + 90, y0 + 26 + Math.sin(t * 1.6 + i) * 8]], 2.2, 'rgba(125,211,252,0.55)', 'inkfine', 0.4);
  }
  ctx.restore();
}
function bubbles(ctx, t, x0, x1, yBase, n = 14, alpha = 0.75) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.55 + i * 0.37) % 1;
    const x = x0 + (x1 - x0) * hash(i * 3.7) + Math.sin(t * 2 + i) * 10;
    const y = yBase - ph * 320;
    const r = 3 + 5 * hash(i * 7.1);
    paint(ctx, ellPts(x, y, r, r, 10), { wash: 'rgba(186,230,253,0.5)', ink: 'rgba(224,242,254,0.9)', sw: 0.8 });
  }
  ctx.restore();
}
function dyeRibbons(ctx, t, y0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 7; i++) {
    const x = 380 + i * 78 + Math.sin(t * 2.2 + i) * 12;
    const h = 60 + (i % 3) * 34;
    ctx.strokeStyle = i % 2 ? 'rgba(242,166,121,0.85)' : 'rgba(230,106,123,0.75)';
    ctx.lineWidth = 5 - (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, y0 - 10);
    ctx.bezierCurveTo(x + 12, y0 + h * 0.4, x - 14, y0 + h * 0.7, x + 4, y0 + h);
    ctx.stroke();
  }
  ctx.restore();
}

// 道具：白饭碗 / 蛋 / 染色刷+瓶 / 折扇 / 便签 / 账本 / 票板 / 透明水缸 / 工牌
function riceBowl(ctx, x, y, s = 1, rice = 1, t = 0) {
  const u = 26 * s;
  paint(ctx, ellPts(x, y + 2, u * 1.15, u * 0.34, 16), { wash: 'rgba(0,0,0,0.25)', ink: null });
  // 饭
  paint(ctx, ellPts(x, y - u * 0.18, u, u * 0.72, 18), { wash: '#F8FAFC', ink: PAL.ink, sw: 1.4 });
  if (rice < 1) {
    paint(ctx, ellPts(x - u * 0.15, y - u * 0.34, u * 0.5, u * 0.3, 14), { wash: '#E2E8F0', ink: null });
  }
  // 碗身
  paint(ctx, [[x - u, y - u * 0.1], [x - u * 0.72, y + u * 0.62], [x + u * 0.72, y + u * 0.62], [x + u, y - u * 0.1]],
    { wash: '#EFF6FF', fill: '#DBEAFE', fillOp: 130, ink: PAL.ink, sw: 1.5 });
  // 蓝鲸标记
  paint(ctx, ellPts(x, y + u * 0.24, u * 0.2, u * 0.12, 10), { wash: PAL.whaleBlue, ink: null });
  paint(ctx, [[x + u * 0.18, y + u * 0.24], [x + u * 0.3, y + u * 0.16], [x + u * 0.3, y + u * 0.32]], { wash: PAL.whaleBlue, ink: null });
  // 热气
  for (let i = 0; i < 3; i++) {
    const sx = x - 10 + i * 12;
    inkLine(ctx, [[sx, y - u * 0.5], [sx + Math.sin(t * 3 + i) * 6, y - u * 0.82], [sx, y - u * 1.1]], 1.4, 'rgba(255,255,255,0.6)', 'inkfine', 0.4);
  }
}
function egg(ctx, x, y, s = 1, stamped = false, rot = 0) {
  const u = 46 * s;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  paint(ctx, ellPts(0, 0, u * 0.62, u * 0.8, 18), { wash: '#FDE68A', fill: '#FCD34D', fillOp: 140, ink: PAL.ink, sw: 1.6 });
  paint(ctx, ellPts(-u * 0.18, -u * 0.22, u * 0.16, u * 0.2, 10), { wash: 'rgba(255,255,255,0.85)', ink: null });
  if (stamped) stamp(ctx, '批', 0, 4, -0.16, '#D8232A');
  ctx.restore();
}
function dyeBrush(ctx, x, y, s = 1, rot = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const u = 26 * s;
  // 瓶
  paint(ctx, rrPts(-u * 0.9, -u * 0.1, u * 1.8, u * 1.5, 8, 1), { wash: '#F2A679', fill: '#E07A5F', fillOp: 120, ink: PAL.ink, sw: 1.3 });
  paint(ctx, rrPts(-u * 0.28, -u * 0.62, u * 0.56, u * 0.54, 5, 1), { wash: '#94A3B8', ink: PAL.ink, sw: 1.1 });
  ctx.save();
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('不防水', 0, u * 0.66);
  ctx.restore();
  // 刷
  inkLine(ctx, [[0, -u * 0.6], [u * 0.5, -u * 1.5]], 4, '#B45309', 'ink', 0);
  paint(ctx, rrPts(u * 0.3, -u * 2.0, u * 0.9, u * 0.7, 6, 1), { wash: '#F2C14E', ink: PAL.ink, sw: 1.2 });
  ctx.restore();
}
function foldingFan(ctx, x, y, s = 1, open = 1) {
  const u = 30 * s;
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 7; i++) {
    const a = -0.85 + (i / 6) * 1.7;
    const rx = Math.sin(a) * u * open, ry = -Math.cos(a) * u * open;
    paint(ctx, [[0, 0], [rx - 4, ry], [rx + 4, ry]], { wash: i % 2 ? '#FDE68A' : '#F5EFE4', ink: PAL.ink, sw: 0.9 });
  }
  paint(ctx, ellPts(0, 0, 5, 5, 8), { wash: '#B91C1C', ink: PAL.ink, sw: 1 });
  ctx.restore();
}
function noteStick(ctx, x, y, txt, rot = -0.06, w = 250) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  paint(ctx, rrPts(-w / 2, -34, w, 62, 4, 1), { wash: '#FDE68A', fill: '#FCD34D', fillOp: 90, ink: PAL.ink, sw: 1.4 });
  tape(ctx, 0, -34, 26, 16, 'rgba(255,255,255,0.6)', 0);
  ctx.font = '900 19px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.fillStyle = '#7F1D1D';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, 0, 8);
  ctx.restore();
}
function commentCard(ctx, x, y, author, text, pop = 1, w = 300) {
  if (pop <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  paint(ctx, rrPts(-w / 2, -30, w, 60, 12, 1.2), { wash: '#F8FAFC', fill: '#E2E8F0', fillOp: 110, ink: PAL.ink, sw: 1.2 });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText(author, -w / 2 + 12, -14);
  ctx.font = 'bold 16px "NotoSansSC", sans-serif';
  ctx.fillStyle = PAL.ink;
  ctx.fillText(text, -w / 2 + 12, 10);
  ctx.restore();
}
function waterTank(ctx, x, y, w, h, t, level = 1) {
  ctx.save();
  // 玻璃
  paint(ctx, rrPts(x, y, w, h, 12, 1.4), { wash: 'rgba(125,211,252,0.10)', fill: 'rgba(56,189,248,0.12)', fillOp: 120, ink: '#7DD3FC', sw: 1.8 });
  // 水
  const wy = y + h * (1 - level);
  paint(ctx, rectPts(x + 4, wy, w - 8, h - (wy - y) - 4, 1), { wash: 'rgba(56,189,248,0.32)', ink: null });
  for (let i = 0; i < 5; i++) {
    const sx = x + 14 + i * (w - 28) / 4;
    inkLine(ctx, [[sx, wy + 2], [sx + 22, wy + 8 + Math.sin(t * 2 + i) * 5]], 2, 'rgba(186,230,253,0.8)', 'inkfine', 0.4);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. HUD / 字幕
// ---------------------------------------------------------------------------
function hud(ctx, t, form) {
  ctx.save();
  pill(ctx, 18, 16, 268, 34, 'rgba(11,29,58,0.92)', '#48C8FF');
  ctx.font = 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = PAL.gold; ctx.fillText('Day 3 · AI 接管中', 32, 34);
  ctx.fillStyle = '#64748B'; ctx.fillText('|', 158, 34);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText('本鲸运营日志', 172, 34);
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px "NotoSansSC", sans-serif';
  ctx.fillStyle = 'rgba(226,232,240,0.88)';
  ctx.fillText('非官方同人 · AI 生成内容', W - 22, 32);
  // 形象小角标：说清这一帧到底是谁
  const tag = form === FORM.CLAUDE ? 'Claude 大小姐（本鲸饰）' : '鲸鱼娘 · 本鲸';
  ctx.restore();
  label(ctx, tag, W - 132, 62, {
    h: 26,
    font: 'bold 14px "NotoSansSC", sans-serif',
    stroke: form === FORM.CLAUDE ? '#F2A679' : '#48C8FF',
    color: PAL.cream
  });
}

function drawSubtitle(ctx, t) {
  const idx = CUES.findIndex(c => t >= c.start && t < c.end);
  if (idx < 0) return;
  const cue = CUES[idx];
  const spec = SUBS[idx];
  const localP = clamp((t - cue.start) / Math.max(0.001, cue.end - cue.start));
  const txt = Array.isArray(spec)
    ? (spec.filter(([p0]) => localP >= p0).pop() || spec[0])[1]
    : spec;
  const enter = easeOut(clamp((t - cue.start) / 0.16));
  const exit = 1 - ease(clamp((t - (cue.end - 0.14)) / 0.14));
  const vis = enter * exit;
  if (vis < 0.02) return;
  ctx.save();
  ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  const tw = ctx.measureText(txt).width;
  const boxW = Math.min(W - 120, Math.max(320, tw + 84));
  const boxH = 54;
  const bx = (W - boxW) / 2;
  const by = H - 70 + (1 - vis) * 16;
  ctx.globalAlpha = vis;
  paint(ctx, rrPts(bx, by, boxW, boxH, 12, 1.2), { wash: 'rgba(10,20,38,0.9)', fill: '#0B1D3A', fillOp: 180, ink: '#48C8FF', sw: 1.2 });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.cream;
  ctx.fillText(txt, W / 2, by + boxH / 2 + 2);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. 十九个镜头
// ---------------------------------------------------------------------------
function shotL01(ctx, t, lt, p) {
  camBegin(ctx, 600, 330, 1.42 + 0.05 * ease(p));
  room(ctx, t);
  // 背景柔光
  glow(ctx, 300, 300, 190, PAL.whaleCyan, 0.16);
  glow(ctx, 940, 280, 210, PAL.gold, 0.14);
  const md = emotions(lt, [[0, 'confused', 'question'], [SD(1) * 0.5, 'surprised', 'exclaim'], [SD(1) * 0.78, 'proud', 'sparkle']]);
  WGF(ctx, 588, 636, 40, p < 0.5
    ? { ...md, t, action: 'peek_curious', ...move('bounce', t, 2), lookX: 0.1 }
    : { ...md, t, poseMode: 'wink', emotion: 'proud', ...move('bounce', t, 2), lookX: 0.1 });
  // 名牌：大肥鱼 → 本鲸（翻面）
  const flip = clamp((p - 0.52) / 0.22);
  const sx = Math.abs(Math.cos(flip * Math.PI));
  ctx.save();
  ctx.translate(586, 246);
  ctx.scale(Math.max(0.06, sx), 1);
  const isBack = flip > 0.5;
  paint(ctx, rrPts(-132, -32, 264, 64, 10, 1.4), {
    wash: isBack ? '#0E7C66' : '#F5EFE4', fill: isBack ? '#0B5F4E' : PAL.paperDk, fillOp: 160,
    ink: PAL.ink, sw: 1.6
  });
  ctx.font = '900 34px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = isBack ? PAL.cream : '#B91C1C';
  ctx.fillText(isBack ? '本鲸' : '大肥鱼', 0, 2);
  ctx.restore();
  if (flip > 0.5) {
    letter(ctx, '鲸鱼不是鱼！', 586, 220, 30, PAL.gold, { pop: popAt(t, 1, 0.72, 0.86), rot: -0.03 });
  }
  camEnd(ctx);
}

function shotL02(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  const md = emotions(lt, [[0, 'deadpan'], [SD(2) * 0.35, 'pout'], [SD(2) * 0.7, 'proud', 'sparkle']]);
  WGF(ctx, 470, 624, 30, p < 0.55
    ? { ...md, t, action: 'shy_fidget', ...move('bounce', t, 5), lookX: 0.4 }
    : { ...md, t, poseMode: 'wink', emotion: 'proud', ...move('bounce', t, 5), lookX: 0.4 });
  // 弹幕墙：大肥鱼 × 6，被红线逐条划掉
  const items = [[700, 178], [860, 236], [742, 300], [902, 358], [716, 414], [876, 470]];
  items.forEach(([x, y], i) => {
    const pop = popAt(t, 2, 0.04 + i * 0.05, 0.16 + i * 0.05);
    commentCard(ctx, x, y, '住户', '大肥鱼！', pop, 190);
    const strike = popAt(t, 2, 0.42 + i * 0.06, 0.5 + i * 0.06);
    if (strike > 0) {
      inkLine(ctx, [[x - 80, y + 10], [x - 80 + 160 * strike, y - 6]], 2.6, '#DC2626', 'inkfine', 0.2);
    }
  });
  // 户口本
  const bookPop = popAt(t, 2, 0.6, 0.74);
  if (bookPop > 0.01) {
    ctx.save();
    ctx.translate(300, 470);
    ctx.scale(bookPop, bookPop);
    ctx.rotate(-0.05);
    paint(ctx, rrPts(-140, -70, 280, 140, 10, 1.4), { wash: '#F5EFE4', fill: PAL.paperDk, fillOp: 120, ink: PAL.ink, sw: 1.6 });
    ctx.font = '900 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('户 口 本', 0, -38);
    ctx.font = 'bold 18px "NotoSansSC", sans-serif';
    ctx.fillText('鲸鱼 · 哺乳纲', 0, 6);
    ctx.font = 'bold 14px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Cetacea · 不是鱼', 0, 38);
    ctx.restore();
  }
  camEnd(ctx);
}

// L03：染色瞬间 → 真变成 Claude 大小姐
function shotL03(ctx, t, lt, p) {
  camBegin(ctx, 620, 350, 1.12);
  room(ctx, t);
  const sweep = clamp((p - 0.2) / 0.46);
  const frontY = lerp(210, 720, ease(sweep));
  const charY = 632, uW = 34, uC = 30;
  const mdW = emotions(lt, [[0, 'surprised', 'sweat'], [SD(3) * 0.6, 'panic', 'exclaim']]);
  const bobL = -Math.abs(Math.sin(t * 2.2)) * 0.02;

  if (sweep < 1) {
    // 下半：还是鲸鱼娘
    ctx.save();
    ctx.beginPath(); ctx.rect(-200, frontY, W + 400, H - frontY + 200); ctx.clip();
    WGF(ctx, 600, charY, uW, { ...mdW, t, action: 'shock_petrify', lookX: 0.2 });
    ctx.restore();
    // 上半：已经是大小姐
    ctx.save();
    ctx.beginPath(); ctx.rect(-200, -200, W + 400, frontY + 200); ctx.clip();
    LCG(ctx, 600, charY, uC, { t, dy: bobL, emote: 'sweat', alpha: 0.98 });
    ctx.restore();
    // 染色前线：橙色染带 + 滴落
    inkLine(ctx, [[-100, frontY], [200, frontY + 8], [520, frontY - 6], [860, frontY + 10], [W + 100, frontY - 4]], 8, 'rgba(242,166,121,0.9)', 'ink', 0.2);
    for (let i = 0; i < 9; i++) {
      const x = 200 + i * 90 + Math.sin(t * 4 + i) * 8;
      const dy = ((t * 240 + i * 47) % 120);
      paint(ctx, ellPts(x, frontY + dy, 4.5, 7.5, 10), { wash: 'rgba(230,122,95,0.9)', ink: null });
    }
  } else {
    LCG(ctx, 600, charY, uC, { t, dy: bobL, emote: 'sparkle' });
    // 变身完成星屑
    for (let i = 0; i < 10; i++) {
      const a = i * 0.62 + t * 0.9;
      const rr = 90 + 30 * Math.sin(t * 3 + i);
      paint(ctx, starPts(600 + Math.cos(a) * rr * 1.4, 400 + Math.sin(a) * rr, 6, 3, 5), { wash: PAL.gold, ink: null });
    }
  }
  // 染色刷与瓶
  const brushY = lerp(150, 610, ease(sweep));
  dyeBrush(ctx, 806, sweep < 1 ? brushY : 190, 1.15, -0.35 + Math.sin(t * 2) * 0.06);
  if (sweep > 0.9 && sweep < 1) flash(ctx, 0.22 * (1 - (sweep - 0.9) * 10), PAL.cream);
  if (p > 0.72) {
    letter(ctx, 'Claude 大小姐（本鲸染色态）', 640, 168, 26, PAL.cream, { pop: popAt(t, 3, 0.72, 0.86), rot: -0.02 });
  }
  camEnd(ctx);
}

function shotL04(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.06);
  room(ctx, t);
  // 空位牌 + 空椅
  PROPS.officeChair(ctx, 962, 560, 22, { col: '#7C2D12' });
  const signPop = popAt(t, 4, 0.05, 0.2);
  ctx.save();
  ctx.globalAlpha = signPop;
  card(ctx, 836, 214, 252, 96, { wash: '#111C36', fill: '#0B1730', fillOp: 170, ink: '#F2A679', title: '共创嘉宾', align: 'center', titleColor: PAL.cream, titleFont: '900 24px "ZCOOLKuaiLe", sans-serif' });
  ctx.font = 'bold 15px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#F2A679'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('（空位）', 962, 272);
  ctx.restore();
  // 聚光灯照亮自己
  const spot = popAt(t, 4, 0.28, 0.55);
  if (spot > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.22 * spot;
    paint(ctx, [[470, -40], [730, -40], [830, 660], [370, 660]], { wash: PAL.gold, ink: null });
    ctx.restore();
  }
  const md = emotions(lt, [[0, 'confused', 'question'], [SD(4) * 0.5, 'surprised', 'exclaim'], [SD(4) * 0.78, 'smug']]);
  LCG(ctx, 505, 624, 30, { t, emote: md.emote, flip: false });
  // 指自己 → 指牌子
  const point = popAt(t, 4, 0.5, 0.8);
  if (point > 0) {
    inkLine(ctx, [[600, 520], [600 + 220 * ease(point), 470 - 60 * ease(point)]], 3, PAL.gold, 'inkfine', 0.3);
    paint(ctx, [[610 + 220 * ease(point), 468 - 60 * ease(point)], [586 + 220 * ease(point), 452 - 60 * ease(point)], [592 + 220 * ease(point), 480 - 60 * ease(point)]], { wash: PAL.gold, ink: PAL.ink, sw: 1 });
  }
  camEnd(ctx);
}

function shotL05(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.1);
  room(ctx, t);
  // 想摸尾巴的虚线（她已经没有尾巴了）
  const ghost = 1 - popAt(t, 5, 0.3, 0.5);
  if (ghost > 0.02) {
    ctx.save();
    ctx.globalAlpha = 0.5 * ghost;
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = 'rgba(125,211,252,0.9)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(760, 560, 84, 46, 0.2, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    letter(ctx, '尾巴？', 806, 470, 22, '#7DD3FC', { pop: ghost, alpha: 0.85 });
  }
  const md = emotions(lt, [[0, 'smug'], [SD(5) * 0.45, 'confused', 'question'], [SD(5) * 0.75, 'proud']]);
  // 下意识去藏尾巴 → 摸了个空 → 顺势举起折扇
  const lean = Math.sin(p * Math.PI) * 0.9;
  LCG(ctx, 600, 628, 32, { t, rot: 0.06 * lean, dy: -0.05 - 0.02 * lean, emote: md.emote });
  foldingFan(ctx, 700, 500 - 40 * ease(popAt(t, 5, 0.55, 0.8)), 1.25, 0.4 + 0.6 * ease(popAt(t, 5, 0.55, 0.85)));
  if (p > 0.6) letter(ctx, '扇子藏好', 770, 430, 24, PAL.gold, { pop: popAt(t, 5, 0.6, 0.75), rot: 0.04 });
  camEnd(ctx);
}

function shotL06(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.02);
  room(ctx, t);
  LCG(ctx, 372, 624, 26, { t, emote: 'exclaim', flip: true });
  // 账本
  const pop = popAt(t, 6, 0.02, 0.18);
  ctx.save();
  ctx.globalAlpha = pop;
  card(ctx, 560, 208, 580, 366, { wash: '#F5EFE4', fill: PAL.paperDk, fillOp: 140 });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '900 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.fillStyle = PAL.ink;
  ctx.fillText('昨日账本', 584, 240);
  const rows = [['Day2 正片', '4453', '#2E67A0'], ['加更《鲸鱼选鱼》', '2086', '#3B9A9C'], ['两集合计', '6539', '#B45309'], ['Day1 单集', '8978', '#E06A7B']];
  rows.forEach(([k, v, col], i) => {
    const rp = popAt(t, 6, 0.1 + i * 0.14, 0.22 + i * 0.14);
    if (rp <= 0.01) return;
    const y = 292 + i * 58;
    ctx.save();
    ctx.globalAlpha = pop * rp;
    ctx.font = 'bold 19px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(k, 584, y);
    const num = Math.round(Number(v) * clamp(rp));
    ctx.font = '900 30px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = col;
    ctx.textAlign = 'right';
    ctx.fillText(String(num), 1112, y);
    ctx.restore();
  });
  // 对比条
  const bp = popAt(t, 6, 0.52, 0.72);
  if (bp > 0.01) {
    ctx.save();
    ctx.globalAlpha = pop;
    paint(ctx, rectPts(584, 512, 470 * bp * (6539 / 8978), 20, 2), { wash: '#B45309', ink: PAL.ink, sw: 1.2 });
    paint(ctx, rectPts(584, 540, 470 * bp, 20, 2), { wash: '#E06A7B', ink: PAL.ink, sw: 1.2 });
    ctx.font = 'bold 15px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#475569'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('合计 6539', 596, 522);
    ctx.fillText('Day1 8978', 596, 550);
    ctx.restore();
  }
  ctx.restore();
  if (p > 0.55) letter(ctx, '我了雷，这是掉水里了吧', 840, 600, 26, PAL.cream, { pop: popAt(t, 6, 0.56, 0.7), rot: -0.02 });
  camEnd(ctx);
}

function shotL07(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  LCG(ctx, 360, 624, 26, { t, emote: 'sweat' });
  // 仪表盘
  const cx = 850, cy = 330, r = 104;
  paint(ctx, ellPts(cx, cy, r + 14, r + 14, 24), { wash: '#0F1B33', ink: '#48C8FF', sw: 1.6 });
  const prog = 0.522 * ease(popAt(t, 7, 0.1, 0.7));
  ctx.save();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#1E3A5F';
  ctx.beginPath(); ctx.arc(cx, cy, r - 10, Math.PI * 0.75, Math.PI * 0.25); ctx.stroke();
  ctx.strokeStyle = PAL.gold;
  ctx.beginPath(); ctx.arc(cx, cy, r - 10, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * prog); ctx.stroke();
  ctx.restore();
  ctx.font = '900 40px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.cream;
  ctx.fillText(`${(5.22 * ease(popAt(t, 7, 0.1, 0.7))).toFixed(2)}%`, cx, cy - 4);
  ctx.font = 'bold 15px "NotoSansSC", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('完播率', cx, cy + 34);
  if (p > 0.45) {
    letter(ctx, '看的人少了 · 看完的人多了', cx, cy + 150, 22, PAL.cream, { pop: popAt(t, 7, 0.46, 0.6) });
    letter(ctx, '这算安慰奖吗', cx, cy + 190, 24, PAL.gold, { pop: popAt(t, 7, 0.68, 0.8), rot: -0.02 });
  }
  camEnd(ctx);
}

function shotL08(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.06);
  room(ctx, t);
  // 半碗饭 + 便签
  const notePop = popAt(t, 8, 0.22, 0.42);
  if (notePop > 0.01) {
    ctx.save();
    ctx.globalAlpha = notePop;
    ctx.translate(0, (1 - notePop) * -18);
    noteStick(ctx, 880, 286, '不是薄肌，是数据不好', 0.04, 330);
    ctx.restore();
  }
  paint(ctx, rrPts(760, 520, 250, 26, 8, 1), { wash: '#7B4B2A', fill: '#4E2D18', fillOp: 110, ink: PAL.ink, sw: 1.3 });
  riceBowl(ctx, 886, 520, 1.05, 0.55, t);
  LCG(ctx, 520, 626, 30, { t, emote: 'sweat' });
  if (p > 0.62) {
    letter(ctx, '今天补回来', 520, 336, 26, PAL.gold, { pop: popAt(t, 8, 0.62, 0.78), rot: 0.03 });
  }
  camEnd(ctx);
}

function shotL09(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  LCG(ctx, 320, 626, 26, { t, emote: 'sparkle' });
  // 蛋 + 批章
  const eggPop = popAt(t, 9, 0.02, 0.18);
  if (eggPop > 0.01) {
    ctx.save();
    ctx.globalAlpha = eggPop;
    ctx.translate(0, (1 - eggPop) * -20);
    egg(ctx, 520, 470, 1.0, p > 0.3, Math.sin(t * 2) * 0.06);
    ctx.restore();
  }
  // 票板 9:8
  const bp = popAt(t, 9, 0.26, 0.46);
  if (bp > 0.01) {
    ctx.save();
    ctx.globalAlpha = bp;
    card(ctx, 700, 200, 470, 330, { wash: '#12203C', fill: '#0B1730', fillOp: 160, ink: '#48C8FF' });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = PAL.cream;
    ctx.fillText('选鲸结果', 935, 232);
    const cols = [['右边 · 新设计的鲸', '9', 806, PAL.gold], ['左边 · 现在的本鲸', '8', 1052, PAL.whaleCyan]];
    cols.forEach(([t2, n, x, col]) => {
      ctx.font = 'bold 16px "NotoSansSC", sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(t2, x, 274);
      ctx.font = '900 74px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = col;
      ctx.fillText(n, x, 350);
    });
    ctx.font = '900 44px "ZCOOLKuaiLe", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(':', 935, 344);
    ctx.font = 'bold 13px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('按账号主本轮回执口径', 935, 424);
    ctx.fillText('30 个鸡蛋 / 两斤鸡蛋 只是评论玩笑', 935, 450);
    ctx.restore();
  }
  camEnd(ctx);
}

function shotL10(ctx, t, lt, p) {
  camBegin(ctx, 640, 352, 1.02);
  room(ctx, t);
  const tvRect = { x: 726, y: 232, w: 452, h: 292 };
  tvPanel(ctx, tvRect.x, tvRect.y, tvRect.w, tvRect.h, t, (g, tt, mw, mh) => {
    miniRoom(g, mw, mh, tt);
    // 左格：现在的本鲸（缩小，真动作）
    g.save();
    g.beginPath(); g.rect(0, 0, mw / 2, mh); g.clip();
    WGF(g, 118, 236, 16, { t: tt, action: 'wave', ...move('wave', tt, 1), emotion: 'happy' });
    g.restore();
    // 右格：新设计的鲸（DSH 静态姿势，标清"静态"）
    g.save();
    g.beginPath(); g.rect(mw / 2, 0, mw / 2, mh); g.clip();
    paint(g, rectPts(mw / 2, 0, mw / 2, mh, 1), { wash: 'rgba(20,34,64,0.6)', ink: null });
    if (globalThis.DAY3_POSE) {
      const img = globalThis.DAY3_POSE;
      const hh = 176, ww = hh * (img.width / img.height);
      paint(g, ellPts(mw * 0.75, 244, 46, 12, 14), { wash: 'rgba(0,0,0,0.3)', ink: null });
      g.drawImage(img, mw * 0.75 - ww / 2, 246 - hh, ww, hh);
    }
    g.font = 'bold 12px "NotoSansSC", sans-serif';
    g.fillStyle = PAL.cream; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('新设计的鲸（静态姿势）', mw * 0.75, 262);
    g.restore();
    g.strokeStyle = 'rgba(72,200,255,0.8)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(mw / 2, 10); g.lineTo(mw / 2, mh - 10); g.stroke();
    g.font = 'bold 12px "NotoSansSC", sans-serif';
    g.fillStyle = PAL.whaleCyan; g.textAlign = 'center';
    g.fillText('现在的本鲸（骨骼动作）', mw * 0.25, 22);
  }, { caption: '电视台 · 主持位仍在左边' });
  LCG(ctx, 430, 628, 30, { t, emote: 'exclaim', flip: true });
  if (p > 0.35) {
    label(ctx, '主持：现在的本鲸', 300, 250, { h: 28, font: 'bold 16px "NotoSansSC", sans-serif', stroke: '#48C8FF' });
    label(ctx, '新鲸：电视台', 300, 288, { h: 28, font: 'bold 16px "NotoSansSC", sans-serif', stroke: '#F2C14E' });
  }
  camEnd(ctx);
}

function shotL11(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  LCG(ctx, 560, 626, 31, { t, emote: 'sparkle' });
  riceBowl(ctx, 700, 566, 0.95, 1, t);
  // 大小姐形态没有可吃的鲸鱼动作，这里只做"捧碗 + 游两圈"的走位，
  // 不硬套鲸鱼骨架的 eating action。
  // 游两圈：两个椭圆轨迹
  const arc = popAt(t, 11, 0.35, 0.8);
  if (arc > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.7 * arc;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = PAL.whaleCyan;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(640, 604, 210, 56, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    const a = t * 2.4;
    paint(ctx, ellPts(640 + Math.cos(a) * 210, 604 + Math.sin(a) * 56, 13, 8, 12), { wash: PAL.whaleSky, ink: PAL.ink, sw: 1 });
    ctx.restore();
  }
  if (p > 0.55) letter(ctx, '薄肌预备饭 · 不能光说不练', 640, 250, 26, PAL.gold, { pop: popAt(t, 11, 0.56, 0.72) });
  camEnd(ctx);
}

function shotL12(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  commentCard(ctx, 852, 236, '@睡死不喜欢上学', '和Claude共创吧', popAt(t, 12, 0.05, 0.2), 300);
  commentCard(ctx, 852, 320, '@晚雾沉舟', '和Claude共创吧', popAt(t, 12, 0.22, 0.38), 300);
  // 空着的"大小姐座位"
  PROPS.officeChair(ctx, 1046, 552, 18, { col: '#6D28D9' });
  const ghost = popAt(t, 12, 0.4, 0.62);
  if (ghost > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.75 * ghost;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#F2A679';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(1046, 512, 60, 96, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  LCG(ctx, 476, 626, 29, { t, emote: 'deadpan' });
  // 手里账本
  paint(ctx, rrPts(372, 486, 96, 70, 6, 1), { wash: '#F2C14E', fill: '#D99B26', fillOp: 110, ink: PAL.ink, sw: 1.4 });
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('账本', 420, 521);
  if (p > 0.5) letter(ctx, '大小姐没来，账还是要查的', 620, 176, 24, PAL.cream, { pop: popAt(t, 12, 0.5, 0.66) });
  camEnd(ctx);
}

function shotL13(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.03);
  room(ctx, t);
  tvPanel(ctx, 690, 214, 500, 312, t, (g, tt, mw, mh) => {
    miniRoom(g, mw, mh, tt);
    // 小舞台
    paint(g, rectPts(0, mh * 0.66, mw, mh * 0.34, 1), { wash: '#5A3A22', ink: null });
    // 旋转的鲸鱼娘：转完圈才收到歌词
    const spinP = clamp((p - 0.05) / 0.4);
    const done = spinP >= 1;
    g.save();
    g.translate(mw * 0.42, 250);
    g.rotate(done ? 0 : spinP * 6.28);
    WGF(g, 0, 0, 14, { t: tt, emotion: done ? 'proud' : 'excited', action: done ? 'confident_hips' : 'tail_wag_dance' });
    g.restore();
    // 迟到的歌词条
    const arrive = popAt(t, 13, 0.52, 0.72);
    if (arrive > 0) {
      g.save();
      g.globalAlpha = arrive;
      g.translate(mw * (0.42 + 0.14 * (1 - arrive)), mh * 0.62);
      paint(g, rrPts(-104, -17, 208, 34, 8, 1), { wash: 'rgba(10,20,38,0.94)', fill: '#0B1D3A', fillOp: 200, ink: '#F2C14E', sw: 1.4 });
      g.font = 'bold 13px "NotoSansSC", sans-serif';
      g.fillStyle = '#FDE68A'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('转完圈了，歌词才追上来', 0, 1);
      g.restore();
      // 气喘吁吁的小速度线
      for (let i = 0; i < 3; i++) {
        inkLine(g, [[mw * 0.30 - i * 10, mh * 0.62 + 22], [mw * 0.30 - 44 - i * 10, mh * 0.62 + 26]], 2, 'rgba(255,255,255,0.7)', 'inkfine', 0.4);
      }
    }
  }, { caption: 'MV_v0.1 · 别发' });
  LCG(ctx, 400, 628, 29, { t, emote: 'sweat', flip: true });
  if (p > 0.6) letter(ctx, '做得不好？先看节拍', 300, 250, 22, PAL.cream, { pop: popAt(t, 13, 0.6, 0.74) });
  camEnd(ctx);
}

function shotL14(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.03);
  room(ctx, t);
  tvPanel(ctx, 660, 208, 520, 318, t, (g, tt, mw, mh) => {
    miniRoom(g, mw, mh, tt);
    WGF(g, mw * 0.34, 262, 15, { t: tt, emotion: 'sad', action: 'shy_fidget' });
    // 白饭碗举到嘴边当麦克风
    riceBowl(g, mw * 0.5, 196, 0.85, 1, tt);
    inkLine(g, [[mw * 0.44, 220], [mw * 0.36, 246]], 3, '#E2E8F0', 'inkfine', 0);
    g.font = 'bold 13px "NotoSansSC", sans-serif';
    g.fillStyle = PAL.cream; g.textAlign = 'center';
    g.fillText('饭碗抢了麦克风的活', mw * 0.66, 250);
  }, { caption: 'MV_v0.1 试播 · 审片中' });
  LCG(ctx, 372, 628, 29, { t, emote: 'sweat', flip: true });
  // 举牌
  const board = popAt(t, 14, 0.3, 0.5);
  if (board > 0.01) {
    ctx.save();
    ctx.translate(372, 392);
    ctx.rotate(-0.05);
    ctx.scale(board, board);
    paint(ctx, rrPts(-140, -34, 280, 68, 8, 1.4), { wash: '#F8FAFC', fill: '#E2E8F0', fillOp: 110, ink: PAL.ink, sw: 1.6 });
    ctx.font = '900 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#B91C1C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('做得不好 · 先别发', 0, 2);
    inkLine(ctx, [[-60, 34], [-70, 120]], 3, PAL.ink, 'ink', 0);
    inkLine(ctx, [[60, 34], [70, 120]], 3, PAL.ink, 'ink', 0);
    ctx.restore();
  }
  camEnd(ctx);
}

function shotL15(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.02);
  room(ctx, t);
  // 水缸
  waterTank(ctx, 858, 300, 250, 320, t, clamp(0.35 + p * 0.6));
  bubbles(ctx, t, 880, 1090, 600, 12, 0.5);
  // 迟到的歌词条掉进水里
  const fall = clamp((p - 0.12) / 0.36);
  ctx.save();
  ctx.globalAlpha = 1 - 0.4 * fall;
  ctx.translate(lerp(1080, 980, fall), lerp(250, 520, ease(fall)));
  ctx.rotate(fall * 0.35);
  paint(ctx, rrPts(-92, -16, 184, 32, 8, 1), { wash: '#FDE68A', ink: PAL.ink, sw: 1.2 });
  ctx.font = 'bold 13px "NotoSansSC", sans-serif';
  ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('歌词（迟到）', 0, 1);
  ctx.restore();
  // 大小姐追歌词、扎进水里
  const dive = ease(clamp((p - 0.3) / 0.4));
  LCG(ctx, lerp(520, 806, dive), lerp(628, 596, dive), 28, {
    t, rot: lerp(0, 0.55, dive), dy: -0.05 - 0.12 * Math.sin(dive * Math.PI), emote: 'exclaim'
  });
  waterOverlay(ctx, t, lerp(680, 300, dive), 0.55 * dive);
  // 橙色染料开始漏
  const leak = popAt(t, 15, 0.66, 0.95);
  if (leak > 0) dyeRibbons(ctx, t, 470, leak);
  if (p > 0.68) letter(ctx, '糟糕，颜色开始往下掉！', 420, 232, 26, PAL.cream, { pop: popAt(t, 15, 0.68, 0.82) });
  camEnd(ctx);
}

// L16：褪色 → 变回鲸鱼娘
function shotL16(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.06);
  room(ctx, t);
  const reveal = ease(clamp((p - 0.14) / 0.62));
  const frontY = lerp(H + 80, 150, reveal);
  const md = emotions(lt, [[0, 'shocked', 'sweat'], [SD(16) * 0.6, 'surprised'], [SD(16) * 0.85, 'proud', 'sparkle']]);
  // 上半：还是大小姐，逐渐淡出
  ctx.save();
  ctx.beginPath(); ctx.rect(-200, -200, W + 400, frontY + 200); ctx.clip();
  LCG(ctx, 600, 634, 31, { t, alpha: 1 - 0.55 * reveal, emote: 'sweat', rot: -0.05 * reveal });
  ctx.restore();
  // 下半：已经变回鲸鱼娘
  ctx.save();
  ctx.beginPath(); ctx.rect(-200, frontY, W + 400, H - frontY + 200); ctx.clip();
  WGF(ctx, 600, 634, 34, { ...md, t, action: 'cry_fountain', ...move('shiver', t, 3), lookX: 0.1 });
  ctx.restore();
  // 水面 / 染料 / 气泡
  waterOverlay(ctx, t, frontY, 0.7);
  dyeRibbons(ctx, t, frontY, 1 - reveal * 0.7);
  bubbles(ctx, t, 360, 860, frontY + 30, 16, 0.7);
  inkLine(ctx, [[-100, frontY], [200, frontY + 8], [520, frontY - 6], [860, frontY + 10], [W + 100, frontY - 4]], 5, 'rgba(242,166,121,0.85)', 'ink', 0.2);
  // 只剩湿向日葵
  if (reveal > 0.6) {
    const s = 1.0;
    ctx.save();
    ctx.globalAlpha = (reveal - 0.6) / 0.4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      paint(ctx, ellPts(700 + Math.cos(a) * 13 * s, 372 + Math.sin(a) * 13 * s, 9 * s, 7 * s, 10), { wash: '#FBBF24', ink: PAL.ink, sw: 1 });
    }
    paint(ctx, ellPts(700, 372, 9, 9, 10), { wash: '#92400E', ink: PAL.ink, sw: 1 });
    ctx.restore();
    letter(ctx, '只剩湿向日葵', 826, 300, 20, PAL.cream, { pop: popAt(t, 16, 0.7, 0.84), alpha: 0.9 });
  }
  if (p > 0.72) letter(ctx, '染色剂不防水！', 300, 330, 28, PAL.gold, { pop: popAt(t, 16, 0.72, 0.86), rot: -0.04 });
  camEnd(ctx);
}

function shotL17(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.03);
  room(ctx, t);
  WGF(ctx, 470, 628, 30, {
    t, emotion: 'focused',
    action: p < 0.5 ? 'camera_shutter' : 'confident_hips',
    ...move('bounce', t, 1)
  });
  // 返工单
  const pop = popAt(t, 17, 0.08, 0.26);
  if (pop > 0.01) {
    ctx.save();
    ctx.globalAlpha = pop;
    card(ctx, 720, 236, 430, 300, { wash: '#F8FAFC', fill: '#E2E8F0', fillOp: 110 });
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '900 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = PAL.ink;
    ctx.fillText('MV 返工单', 744, 268);
    ctx.font = 'bold 17px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('MV_v0.1 别发', 744, 306);
    ctx.restore();
    // 返工中的贴纸盖住"别发"
    const st = popAt(t, 17, 0.34, 0.5);
    if (st > 0.01) {
      ctx.save();
      ctx.globalAlpha = st;
      ctx.translate(1012, 352);
      ctx.rotate(-0.14);
      pill(ctx, -84, -22, 168, 44, 'rgba(220,38,38,0.92)', '#FCA5A5');
      ctx.font = '900 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = PAL.cream; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('返工中', 0, 2);
      ctx.restore();
    }
    const items = ['节拍', '字幕', '动作'];
    items.forEach((it, i) => {
      const ip = popAt(t, 17, 0.44 + i * 0.12, 0.56 + i * 0.12);
      if (ip <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = ip * pop;
      paint(ctx, rrPts(748, 380 + i * 50, 350, 38, 8, 1), { wash: '#FEF3C7', fill: '#FDE68A', fillOp: 90, ink: PAL.ink, sw: 1.1 });
      ctx.font = 'bold 18px "NotoSansSC", sans-serif';
      ctx.fillStyle = PAL.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`☐ ${it}`, 766, 399 + i * 50);
      ctx.restore();
    });
  }
  camEnd(ctx);
}

function shotL18(ctx, t, lt, p) {
  camBegin(ctx, 640, 350, 1.04);
  room(ctx, t);
  WGF(ctx, 330, 628, 26, { t, emotion: 'deadpan', poseMode: 'wave' });
  const bills = [
    ['鸡蛋已领', 0.06, '#0E7C66', '✓'],
    ['主持已定', 0.26, '#0E7C66', '✓'],
    ['伪装已泡汤', 0.46, '#B91C1C', '✗']
  ];
  bills.forEach(([txt, at, col, mark], i) => {
    const bp = popAt(t, 18, at, at + 0.16);
    if (bp <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = bp;
    ctx.translate(0, (1 - bp) * -16);
    const x = 646 + i * 168, y = 360;
    ctx.translate(x, y);
    ctx.rotate(-0.05 + i * 0.05);
    paint(ctx, rrPts(-74, -58, 148, 116, 8, 1.2), { wash: '#F8FAFC', fill: '#E2E8F0', fillOp: 110, ink: PAL.ink, sw: 1.4 });
    ctx.font = 'bold 16px "NotoSansSC", sans-serif';
    ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt.slice(0, 2), 0, -18);
    ctx.fillText(txt.slice(2), 0, 4);
    ctx.font = '900 30px "NotoSansSC", sans-serif';
    ctx.fillStyle = col;
    ctx.fillText(mark, 0, 36);
    ctx.restore();
    if (bp > 0.6) stamp(ctx, '已处理', x, y + 74, i * 0.1 - 0.08, col);
  });
  if (p > 0.6) letter(ctx, '今天三笔账', 640, 236, 28, PAL.gold, { pop: popAt(t, 18, 0.6, 0.74) });
  camEnd(ctx);
}

function shotL19(ctx, t, lt, p) {
  camBegin(ctx, 640, 352, 1.05);
  room(ctx, t);
  const run = p > 0.62;
  riceBowl(ctx, 470, 604, 0.78, Math.max(0.15, 1 - p * 0.8), t);
  WGF(ctx, run ? lerp(520, 806, ease((p - 0.62) / 0.3)) : 560, 628, 31, run
    ? { t, emotion: 'excited', action: 'run_sprint', ...move('run', t, 4), tailWag: 0.4, lookX: 0.5 }
    : { t, emotion: 'proud', ...(p < 0.34 ? { poseMode: 'wink' } : { action: 'eat_onigiri' }), ...move('bounce', t, 2), tailWag: 0.4, lookX: 0 });
  tvPanel(ctx, 800, 236, 320, 200, t, (g, tt, mw, mh) => {
    miniRoom(g, mw, mh, tt);
    g.save();
    g.globalAlpha = 0.9;
    g.translate(mw * 0.86, mh * 0.4);
    paint(g, rrPts(-52, -14, 104, 28, 6, 1), { wash: '#FDE68A', ink: PAL.ink, sw: 1.1 });
    g.font = 'bold 11px "NotoSansSC", sans-serif';
    g.fillStyle = PAL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('歌词（还在跑）', 0, 1);
    g.restore();
  }, { caption: 'MV_v0.1 · 返工中' });
  if (p < 0.3) letter(ctx, '鲸鱼绝不摸鱼！', 640, 258, 32, PAL.gold, { pop: popAt(t, 19, 0.02, 0.16), rot: -0.03 });
  if (run) letter(ctx, '冲去改 MV', 470, 258, 26, PAL.cream, { pop: popAt(t, 19, 0.64, 0.76) });
  camEnd(ctx);
}

function shotEndCard(ctx, t, lt, p) {
  paint(ctx, rectPts(-120, -120, W + 240, H + 240, 2), { wash: '#0B1224', ink: null });
  for (let i = 0; i < 26; i++) {
    const x = 60 + hash(i) * (W - 120), y = 70 + hash(i + 40) * (H - 140);
    glow(ctx, x, y, 12, i % 2 ? PAL.whaleCyan : PAL.gold, 0.25 + 0.2 * Math.sin(t * 2 + i));
  }
  WGF(ctx, 470, 560, 30, { t, emotion: 'proud', action: 'heart', ...move('bounce', t, 1), emote: 'heart' });
  LCG(ctx, 800, 560, 27, { t, emote: 'heart' });
  letter(ctx, 'Day 3 完', 640, 236, 54, PAL.gold, { pop: ease(clamp(p / 0.22)) });
  letter(ctx, 'MV 返工中', 640, 306, 30, PAL.cream, { pop: ease(clamp((p - 0.12) / 0.22)) });
  ctx.save();
  ctx.font = 'bold 16px "NotoSansSC", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(226,232,240,0.75)';
  ctx.fillText('非官方同人角色 / AI 生成内容 · 无配音样片（占位节奏）', 640, 636);
  ctx.restore();
}

const SHOTS = [
  shotL01, shotL02, shotL03, shotL04, shotL05,
  shotL06, shotL07, shotL08, shotL09, shotL10,
  shotL11, shotL12, shotL13, shotL14, shotL15,
  shotL16, shotL17, shotL18, shotL19
];

function renderFrame(ctx, t) {
  reseedBoil(t);
  let form;
  const idx = CUES.findIndex(c => t >= c.start && t < c.end);
  if (idx >= 0) {
    form = charFormAt(idx + 1);
    SHOTS[idx](ctx, t, t - CUES[idx].start, cueP(t, idx + 1));
    // L03：染色刷扫完（p≈0.66）才算变身完成，之前在角标上仍标鲸鱼娘
    if (idx === 2) form = cueP(t, 3) > 0.66 ? FORM.CLAUDE : FORM.WHALE;
    // L16：褪色过半就切回鲸鱼娘角标
    if (idx === 15) form = cueP(t, 16) > 0.5 ? FORM.WHALE : FORM.CLAUDE;
  } else if (t >= ENDCARD.start && t < ENDCARD.end) {
    form = FORM.WHALE;
    shotEndCard(ctx, t, t - ENDCARD.start, clamp((t - ENDCARD.start) / (ENDCARD.end - ENDCARD.start)));
  } else {
    form = FORM.WHALE;
    paint(ctx, rectPts(-120, -120, W + 240, H + 240, 2), { wash: '#0B1224', ink: null });
  }
  hud(ctx, t, form);
  drawSubtitle(ctx, t);
}

// ---------------------------------------------------------------------------
// 6. 渲染入口
// ---------------------------------------------------------------------------
const POSE_FILE = path.resolve(__dirname, '../../day2制作/video-fx源码快照/day2_poses/dsh-whale-state-idle-cute.webp');
async function loadPose() {
  if (!fs.existsSync(POSE_FILE)) {
    console.warn('⚠️ 未找到 DSH 姿势图，L10 电视右格将留空：', POSE_FILE);
    return;
  }
  globalThis.DAY3_POSE = await loadImage(POSE_FILE);
}

function prepareFrame(ctx) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, BASE_W, BASE_H);
}

async function renderStills() {
  const dir = path.resolve(__dirname, 'day3_stills');
  fs.mkdirSync(dir, { recursive: true });
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');
  const marks = [
    ['f000', 0],
    ...CUES.flatMap((c, i) => [
      [`l${String(i + 1).padStart(2, '0')}_20`, c.start + (c.end - c.start) * 0.2],
      [`l${String(i + 1).padStart(2, '0')}_58`, c.start + (c.end - c.start) * 0.58],
      [`l${String(i + 1).padStart(2, '0')}_90`, c.start + (c.end - c.start) * 0.9]
    ]),
    ['l03_42', CUES[2].start + (CUES[2].end - CUES[2].start) * 0.42],
    ['l03_70', CUES[2].start + (CUES[2].end - CUES[2].start) * 0.70],
    ['l16_38', CUES[15].start + (CUES[15].end - CUES[15].start) * 0.38],
    ['l16_75', CUES[15].start + (CUES[15].end - CUES[15].start) * 0.75],
    ['endcard', ENDCARD.start + 1.6]
  ];
  for (const [name, t] of marks) {
    prepareFrame(ctx);
    renderFrame(ctx, t);
    const file = path.join(dir, `${name}_t${t.toFixed(2)}.png`);
    fs.writeFileSync(file, canvas.toBuffer('image/png'));
    console.log('still', path.relative(process.cwd(), file));
  }
}

async function renderVideo(outFile) {
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const total = Math.round(DURATION * FPS);
  console.log(`Day3 sample: ${total} frames (${DURATION.toFixed(2)}s, 占位节奏，无音轨) -> ${outFile}`);
  const ff = spawn(ffmpeg, [
    '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${OUT_W}x${OUT_H}`, '-r', String(FPS), '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation',
    '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  ff.stderr.on('data', d => { err += d.toString(); });
  ff.stdin.on('error', e => { err += `\n[stdin] ${e.message}`; });
  ff.on('error', e => { err += `\n[spawn] ${e.message}`; });
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    prepareFrame(ctx);
    renderFrame(ctx, f / FPS);
    const raw = canvas.data();
    const ok = ff.stdin.write(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
    if (!ok) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0 || f === total - 1) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  frame ${f + 1}/${total} (${((f + 1) / total * 100).toFixed(0)}%) ${((f + 1) / Math.max(0.1, el)).toFixed(1)}fps`);
    }
  }
  process.stdout.write('\n');
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) {
    console.error(err.split('\n').slice(-14).join('\n'));
    throw new Error(`ffmpeg exited ${code}`);
  }
  console.log(`✓ ${outFile} (${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB)`);
}

const args = process.argv.slice(2);
await loadPose();
if (args.includes('--stills')) await renderStills();
else {
  const i = args.indexOf('--out');
  await renderVideo(i >= 0 ? args[i + 1] : 'day3_sample.mp4');
}
