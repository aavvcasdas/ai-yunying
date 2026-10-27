// ============================================================================
// render_pengyou_dj_replica.mjs —— 《朋友的酒 (DJ版)》1:1 纯净复刻引擎
//
// 对标分支参考视频 `/home/user/ai-yunying/朋友的酒.mp4` (03:10.40, 1280×720@30fps, 5712帧)
// 与参考音频 `/home/user/ai-yunying/《朋友的酒Dj版》.mp3` (130.000 BPM, ph0=0.237s)：
//   1. 纯净无水印画面（严格遵照用户指示删去顶部表情包计数与底部版权角标文字，零遮挡、零胶囊框）；
//   2. 真实 3D 圆柱透视环绕霓虹字《朋友的酒DJ版》（5.000s/圈，后半圈 z>0 缩小镜像穿行于巨物脑后，
//      前半圈 z<=0 放大发光掠过巨物面前，左右切点自然透视压缩）；
//   3. Windows XP 草坡前后遮挡群像构图（基于 `bg_xp_hill_clean.png` + 实测三次山脊线 `xp_hill_ridge.json`）：
//      · 原版 (`--edition base`)：山后巨物本鲸（12张高清立绘随乐句切换）+ 草坡前景15席透视列队轮播全部39张DSH表情包；
//      · Claude大小姐客串版 (`--edition claude`)：在原版基础上，山后由本鲸与Q版Claude大小姐双巨物同框合跳，
//        前景草坡15席由本鲸DSH表情包与Claude大小姐全部14张Q版姿态交替列队齐跳；
//   4. 完整复刻原片40句纯净白字黑边底部歌词（左滑入 / 右滑出）、62.6s & 126.1s 两处副歌高潮推镜动感模糊、
//      以及 190.03s–190.40s 结尾黑场仅留 3D 霓虹光环的彩蛋收尾。
//
// 用法：
//   # 1) 关键帧抽检
//   node tools/day3制作/render_pengyou_dj_replica.mjs --edition base --times 1.0,1.8,3.5,48.0,63.3,126.6,190.1
//   node tools/day3制作/render_pengyou_dj_replica.mjs --edition claude --times 1.0,1.8,3.5,48.0,63.3,126.6,190.1
//
//   # 2) 渲染完整 03:10.40 原版与 Claude大小姐客串版
//   node tools/day3制作/render_pengyou_dj_replica.mjs --edition base \
//     --out Day3/成片/MV/朋友的酒_DJ版_复刻原版.mp4
//   node tools/day3制作/render_pengyou_dj_replica.mjs --edition claude \
//     --out Day3/成片/MV/朋友的酒_DJ版_Claude大小姐客串版.mp4
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

function resolveCanvas() {
  for (const c of [
    '@napi-rs/canvas',
    '/tmp/node_render/node_modules/@napi-rs/canvas',
    path.join(process.env.VIDEO_FX_DIR || path.join(REPO, 'video-fx'), 'node_modules/@napi-rs/canvas')
  ]) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('缺少 @napi-rs/canvas');
}
const { createCanvas, loadImage, GlobalFonts } = resolveCanvas();

const FONT_DIR = path.join(process.env.VIDEO_FX_DIR || path.join(REPO, 'video-fx'), 'assets/fonts');
for (const [f, name] of [
  ['NotoSansSC-Bold.ttf', 'NotoSansSC'],
  ['ZCOOLKuaiLe-Regular.ttf', 'ZCOOLKuaiLe']
]) {
  const p = path.join(FONT_DIR, f);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, name);
}

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const venv = '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries';
  if (fs.existsSync(venv)) {
    const b = fs.readdirSync(venv).find((x) => x.startsWith('ffmpeg'));
    if (b) return path.join(venv, b);
  }
  return 'ffmpeg';
}

// ---------------------------------------------------------------- CLI 参数
const ARGV = process.argv.slice(2);
const argOf = (flag, dflt = null) => {
  const i = ARGV.indexOf(flag);
  return i >= 0 && i + 1 < ARGV.length ? ARGV[i + 1] : dflt;
};

const EDITION = argOf('--edition', 'base'); // 'base' | 'claude'
if (EDITION !== 'base' && EDITION !== 'claude') {
  throw new Error(`--edition 仅支持 base 或 claude，收到: ${EDITION}`);
}

const W = 1280;
const H = 720;
const FPS = 30;
const TOTAL_FRAMES = Number(argOf('--frames', '5712')); // 5712 frames = 190.400s (1:1 对齐 朋友的酒.mp4)
const TOTAL_DUR = TOTAL_FRAMES / FPS;

const AUDIO = argOf('--audio', path.join(REPO, '《朋友的酒Dj版》.mp3'));
const DEFAULT_OUT = path.join(
  REPO,
  EDITION === 'claude'
    ? 'Day3/成片/MV/朋友的酒_DJ版_Claude大小姐客串版.mp4'
    : 'Day3/成片/MV/朋友的酒_DJ版_复刻原版.mp4'
);
const OUT = argOf('--out', DEFAULT_OUT);

// 实测《朋友的酒Dj版》.mp3 低频底鼓 (<170Hz)：130.000 BPM，首拍相位 0.237s
const BPM = Number(argOf('--bpm', '130.0'));
const BEAT = 60.0 / BPM;
const BEAT_PHASE_0 = Number(argOf('--beat-offset', '0.237'));

// ---------------------------------------------------------------- 角色资产权威清单
export const STICKER_POSE_CATALOG_39 = [
  'idle-cute', 'greet', 'celebrate', 'cool-shades', 'wink',
  'meme-smug', 'meme-doge', 'star', 'game-happy', 'daily-done',
  'meme-music', 'blush', 'teasing',
  'meme-heart', 'bold', 'curious', 'meme-yes', 'meme-cry',
  'meme-no', 'failure', 'react-head', 'react-tail', 'tail-swing',
  'levelup', 'game-win', 'success',
  'work-deadline', 'work-debug', 'work-review', 'work-idea', 'thinking',
  'running', 'daily-stretch', 'sleep', 'daily-eat', 'eat',
  'react-belly', 'daily-gaming', 'angry'
];

const WHALE_GIANT_KEYS = [
  'ciallo_wink', 'cheer', 'idol_mic_sing', 'toast_cheers',
  'confident_hips', 'playful_fists', 'rose_bouquet', 'tail_wag_dance',
  'jump_joy', 'sparkler_firework', 'coin_hug', 'idle'
];

// Claude 大小姐全部 14 张 Q 版立绘（tools/day3制作/claude_src/chibi/pose_*.png）
const CLAUDE_CHIBI_KEYS = [
  'cheer', 'sing', 'dance', 'wave_hi', 'ok_hand',
  'megaphone', 'curtsy', 'pointing_viewer', 'noodles', 'reading_book',
  'question', 'no_sign', 'panic', 'tremble'
];

// ---------------------------------------------------------------- 对标 朋友的酒.mp4 逐帧实测的 40 句歌词时间轴
const SUBTITLES_40 = [
  { t0:   3.30, t1:  10.90, text: '昨日一去不复回 哦耶耶' },
  { t0:  10.95, t1:  18.12, text: '开心比什么都贵' },
  { t0:  18.18, t1:  25.68, text: '覆水不能再收回 哦耶耶' },
  { t0:  25.73, t1:  32.85, text: '桃花谢了有玫瑰' },
  { t0:  32.90, t1:  36.72, text: '人生几十年总会有风雨来陪' },
  { t0:  36.77, t1:  40.40, text: '潇潇洒洒赴会 今不醉不归' },
  { t0:  40.45, t1:  43.56, text: '往事后不后悔 慢慢去体会' },
  { t0:  43.62, t1:  46.23, text: '此刻朋友这杯酒最珍贵' },
  { t0:  46.28, t1:  51.36, text: '快把酒满上 干了这杯 大声歌唱' },
  { t0:  51.42, t1:  55.06, text: '好朋友好朋友 今宵多欢畅' },
  { t0:  55.12, t1:  58.00, text: '理想改变了我们的模样' },
  { t0:  58.06, t1:  62.48, text: '也让我懂得了要珍惜朋友的肩膀' },
  { t0:  62.54, t1:  66.22, text: '阳光总会在风雨之后撒向苍茫' },
  { t0:  66.27, t1:  69.82, text: '让我们抬起头 学会了坚强' },
  { t0:  69.88, t1:  73.46, text: '就像朋友的这杯烈酒 烫我心上' },
  { t0:  73.52, t1:  82.98, text: '温暖我凡事别再放心上' },
  { t0:  83.05, t1:  90.46, text: '今天我们来相会 哦耶耶' },
  { t0:  90.52, t1:  97.52, text: '深情斟满了酒杯' },
  { t0:  97.58, t1: 105.06, text: '岁月匆匆如流水 哦耶耶' },
  { t0: 105.12, t1: 112.36, text: '管他昨天谁是谁' },
  { t0: 112.42, t1: 116.14, text: '人生的旅程有苦有甜也有泪' },
  { t0: 116.20, t1: 119.82, text: '好汉不提当年 酒再干一杯' },
  { t0: 119.88, t1: 123.00, text: '往事决不后悔 不必再理会' },
  { t0: 123.06, t1: 127.08, text: '此刻朋友这杯酒最珍贵' },
  { t0: 127.14, t1: 130.70, text: '快把酒满上 干了这杯 大声歌唱' },
  { t0: 130.76, t1: 134.50, text: '好朋友好朋友 今宵多欢畅' },
  { t0: 134.56, t1: 137.66, text: '理想改变了我们的模样' },
  { t0: 137.72, t1: 141.84, text: '也让我懂得了要珍惜朋友的肩膀' },
  { t0: 141.90, t1: 145.44, text: '阳光总会在风雨之后撒向苍茫' },
  { t0: 145.50, t1: 149.32, text: '让我们抬起头 学会了坚强' },
  { t0: 149.38, t1: 152.70, text: '就像朋友的这杯烈酒 烫我心上' },
  { t0: 152.76, t1: 156.76, text: '温暖我凡事别再放心上' },
  { t0: 156.82, t1: 160.58, text: '快把酒满上 干了这杯 大声歌唱' },
  { t0: 160.64, t1: 164.32, text: '好朋友好朋友 今宵多欢畅' },
  { t0: 164.38, t1: 167.58, text: '理想改变了我们的模样' },
  { t0: 167.64, t1: 171.64, text: '也让我懂得了要珍惜朋友的肩膀' },
  { t0: 171.70, t1: 175.34, text: '阳光总会在风雨之后撒向苍茫' },
  { t0: 175.40, t1: 178.96, text: '让我们抬起头 学会了坚强' },
  { t0: 179.02, t1: 182.80, text: '就像朋友的这杯烈酒 烫我心上' },
  { t0: 182.86, t1: 187.82, text: '温暖我凡事别再放心上' }
];

// 乐段切换时间点（用于在正拍压扁最低点无痕轮换前景多表情包与巨物表情）
const PHRASE_SWITCH_BEATS = [
  0, 16, 39, 55, 71, 86, 100, 112, 136, 152,
  180, 196, 212, 228, 244, 260, 275, 292, 310, 340, 372
];

// 前景草坡 15 席透视列队坐标（1:1 测量自 朋友的酒.mp4 f54_upright.png，从远左至近右）
const HILL_SLOTS_15 = [
  // 远景左四席
  { x:  432, dy: 11, h:  56 },
  { x:  462, dy: 11, h:  59 },
  { x:  494, dy: 11, h:  62 },
  { x:  528, dy: 12, h:  65 },
  // 中远景四席
  { x:  586, dy: 10, h:  70 },
  { x:  626, dy: 10, h:  74 },
  { x:  676, dy: 11, h:  80 },
  { x:  726, dy: 11, h:  85 },
  // 山脊中右三席（位于巨物胸前草坡）
  { x:  780, dy: 12, h:  90 },
  { x:  836, dy: 12, h:  93 },
  { x:  892, dy: 13, h:  96 },
  // 近景右四席（错落坐于前坡草地，复刻原片右下角四人前排透视层次）
  { x:  948, yAbs: 432, h: 106 },
  { x: 1020, yAbs: 429, h: 108 },
  { x: 1094, yAbs: 414, h: 110 },
  { x: 1168, yAbs: 416, h: 106 }
];

// ---------------------------------------------------------------- 数学工具
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (v) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- 对标原片 30fps 实测波形的梯形糯感 Q 弹曲线
// 原片每周期呈现鲜明的「高立保持 → 极速下压 → 宽扁贴坡保持 → 弹性起跳微过冲」梯形节奏，
// 并严格锁相到《朋友的酒Dj版》.mp3 实测 130.000 BPM 底鼓正拍！
function replicaBounce(beatFloat) {
  const p = ((beatFloat % 1) + 1) % 1; // p=0 对应正拍砸扁落点
  let squash; // 1 = 最扁麻薯态, 0 = 正常直立态, <0 = 竖向微拉伸过冲
  if (p < 0.34) {
    // 贴在草坡上的糯叽叽宽脸保持段
    const edge = p > 0.28 ? smoothstep((p - 0.28) / 0.06) * 0.08 : 0;
    squash = 1.0 - edge;
  } else if (p < 0.48) {
    // 极速Q弹弹起并带一点点果冻拉伸过冲
    const u = smoothstep((p - 0.34) / 0.14);
    squash = lerp(0.92, -0.18, u);
  } else if (p < 0.86) {
    // 直立高挑保持段（微回落至标准态）
    const u = smoothstep((p - 0.48) / 0.16);
    squash = lerp(-0.18, 0.0, u);
  } else {
    // 快速向下一拍底鼓砸扁
    const u = smoothstep((p - 0.86) / 0.14);
    squash = lerp(0.0, 1.0, u);
  }

  let sy, sx;
  if (squash >= 0) {
    sy = lerp(1.0, 0.47, squash);
    sx = lerp(1.0, 1.44, squash);
  } else {
    const st = -squash;
    sy = lerp(1.0, 1.06, st);
    sx = lerp(1.0, 0.96, st);
  }
  return { sy, sx, squash: Math.max(0, squash), p };
}

// ---------------------------------------------------------------- 两处高潮推镜动感模糊曲线 (实测 62.35–64.15s & 125.65–127.45s)
function getWhipCamera(t) {
  for (const tDrop of [63.40, 126.70]) {
    const dt = t - tDrop;
    if (dt >= -1.05 && dt < 0.0) {
      // 1.05s 指数加速推镜 (1.00x -> 1.58x) + 径向推镜残影
      const u = (dt + 1.05) / 1.05;
      const curve = Math.pow(u, 2.35);
      const zoom = lerp(1.0, 1.58, curve);
      const blur = lerp(0.0, 0.075, Math.pow(u, 1.8));
      return { active: true, zoom, fx: 930, fy: 295, blur };
    }
    if (dt >= 0.0 && dt <= 0.78) {
      // 正拍 Drop 瞬间拉远回弹 (0.91x -> 1.00x)
      const u = dt / 0.78;
      const zoom = lerp(0.91, 1.0, 1 - Math.pow(1 - u, 2.6));
      const blur = lerp(0.045, 0.0, Math.min(1, u * 2.2));
      return { active: true, zoom, fx: 900, fy: 295, blur };
    }
  }
  return { active: false, zoom: 1.0, fx: 640, fy: 360, blur: 0 };
}

// ---------------------------------------------------------------- 3D 圆柱环绕彩虹霓虹字《朋友的酒DJ版》预烘焙与透视投影
const RING_CHARS = ['《', '朋', '友', '的', '酒', 'D', 'J', '版', '》'];
const RING_HUES = [332, 16, 48, 128, 186, 286, 345, 42, 162, 198];

function buildNeonRingGlyphs() {
  const S = 240;
  const glyphs = [];
  for (let i = 0; i < RING_CHARS.length; i++) {
    const ch = RING_CHARS[i];
    const h0 = RING_HUES[i];
    const h1 = RING_HUES[i + 1];
    const cv = createCanvas(S, S);
    const cx = cv.getContext('2d');
    const isAscii = ch === 'D' || ch === 'J';
    const fontPx = isAscii ? 116 : 110;
    cx.font = `900 ${fontPx}px "NotoSansSC", sans-serif`;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.lineJoin = 'round';

    const gradNeon = cx.createLinearGradient(S * 0.18, 0, S * 0.82, 0);
    gradNeon.addColorStop(0, `hsl(${h0}, 100%, 62%)`);
    gradNeon.addColorStop(1, `hsl(${h1}, 100%, 62%)`);

    const gradCore = cx.createLinearGradient(S * 0.18, 0, S * 0.82, 0);
    gradCore.addColorStop(0, `hsl(${h0}, 100%, 84%)`);
    gradCore.addColorStop(1, `hsl(${h1}, 100%, 84%)`);

    const gradFill = cx.createLinearGradient(S * 0.18, S * 0.25, S * 0.82, S * 0.75);
    gradFill.addColorStop(0, `hsla(${h0}, 100%, 64%, 0.46)`);
    gradFill.addColorStop(1, `hsla(${h1}, 100%, 64%, 0.46)`);

    // 1. 外层柔光霓虹辉光
    cx.save();
    cx.shadowColor = `hsl(${h0}, 100%, 60%)`;
    cx.shadowBlur = 24;
    cx.strokeStyle = gradNeon;
    cx.lineWidth = 11;
    cx.strokeText(ch, S / 2, S / 2);
    cx.restore();

    // 2. 中层高饱和霓虹轮廓 + 半透明内发光填充（复刻原片灯管空心立体感）
    cx.save();
    cx.shadowColor = `hsl(${h1}, 100%, 65%)`;
    cx.shadowBlur = 10;
    cx.fillStyle = gradFill;
    cx.fillText(ch, S / 2, S / 2);
    cx.strokeStyle = gradNeon;
    cx.lineWidth = 7.5;
    cx.strokeText(ch, S / 2, S / 2);
    cx.restore();

    // 3. 内芯高亮灯丝描边
    cx.strokeStyle = gradCore;
    cx.lineWidth = 3.2;
    cx.strokeText(ch, S / 2, S / 2);

    glyphs.push({ cv, size: S });
  }
  return glyphs;
}

// 计算单个圆柱方位角 theta 在 1280×720 相机平面的 3D 透视投影点
function projectRingTheta(theta) {
  const R = 0.535;
  const Z_CAM = 1.00;
  const PITCH = 15.6 * (Math.PI / 180); // 俯仰角：后半圈(z>0)升高至 y≈52，前半圈(z<0)落至 y≈242
  const ROLL = -3.8 * (Math.PI / 180);  // 微倾角：呼应左低右高草坡

  const x0 = R * Math.sin(theta);
  const z0 = -R * Math.cos(theta); // theta=0 为正前方最近点 (z0 = -R < 0)

  const y1 = -z0 * Math.sin(PITCH);
  const z1 = z0 * Math.cos(PITCH);

  const x2 = x0 * Math.cos(ROLL) - y1 * Math.sin(ROLL);
  const y2 = x0 * Math.sin(ROLL) + y1 * Math.cos(ROLL);

  const depth = Z_CAM + z1;
  const F = 532;
  const CX = 656;
  const CY = 122;

  return {
    sx: CX + (F * x2) / depth,
    sy: CY + (F * y2) / depth,
    depth,
    z1
  };
}

function computeRingItems(t, glyphs) {
  const OMEGA = TAU / 5.0;        // 严格 5.000s 一整圈
  const D_THETA = 15.6 * (Math.PI / 180);
  const THETA_START = 35.0 * (Math.PI / 180);
  const items = [];

  for (let i = 0; i < glyphs.length; i++) {
    const theta = THETA_START - OMEGA * t + i * D_THETA;
    const p0 = projectRingTheta(theta);
    const pPlus = projectRingTheta(theta + 0.025);
    const pMinus = projectRingTheta(theta - 0.025);

    const tx = (pPlus.sx - pMinus.sx) / 0.05;
    const ty = (pPlus.sy - pMinus.sy) / 0.05;

    // 正前方 (depth = 1 - R*cos(pitch) ≈ 0.485) 时基准缩放 = 0.96，横向略宽还原原片饱满方字比例
    const scaleY = 0.465 / p0.depth;
    const fullTx = (532 * 0.535) / p0.depth;
    let foreshorten = clamp((tx / fullTx) * 1.16, -1.12, 1.12);
    if (Math.abs(foreshorten) < 0.07) {
      foreshorten = (foreshorten >= 0 ? 1 : -1) * 0.07;
    }
    const scaleX = scaleY * foreshorten;
    const slope = clamp(ty / (Math.abs(tx) + 90), -0.22, 0.22) * (foreshorten >= 0 ? 1 : -1);

    items.push({
      glyph: glyphs[i],
      sx: p0.sx,
      sy: p0.sy,
      depth: p0.depth,
      isBack: p0.z1 > 0,
      scaleX,
      scaleY,
      slope,
      alpha: p0.z1 > 0 ? 0.88 : 0.99
    });
  }
  return items;
}

function drawRingPass(ctx, items, backPass, padX = 0, padY = 0) {
  const subset = items.filter((it) => it.isBack === backPass);
  // 由远及近排序
  subset.sort((a, b) => b.depth - a.depth);
  for (const it of subset) {
    const S = it.glyph.size;
    ctx.save();
    ctx.globalAlpha = it.alpha;
    ctx.translate(it.sx + padX, it.sy + padY);
    ctx.transform(it.scaleX, it.slope * Math.abs(it.scaleX), 0, it.scaleY, 0, 0);
    ctx.drawImage(it.glyph.cv, -S / 2, -S / 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 纯净底部白字黑边滑入/滑出歌词渲染
function drawCleanSubtitle(ctx, t) {
  let active = null;
  for (let i = 0; i < SUBTITLES_40.length; i++) {
    const s = SUBTITLES_40[i];
    if (t >= s.t0 && t <= s.t1) { active = s; break; }
  }
  if (!active) return;

  const SLIDE_DUR = 0.18; // ~5.4 帧左滑入 / 右滑出，复刻 shake_lyric_30fps.jpg
  let dx = 0;
  let alpha = 1.0;
  if (t - active.t0 < SLIDE_DUR) {
    const u = clamp((t - active.t0) / SLIDE_DUR);
    const e = 1 - Math.pow(1 - u, 2.4);
    dx = lerp(-155, 0, e);
    alpha = clamp(u * 1.25);
  } else if (active.t1 - t < SLIDE_DUR) {
    const u = clamp((active.t1 - t) / SLIDE_DUR);
    const e = 1 - Math.pow(1 - u, 2.4);
    dx = lerp(155, 0, e);
    alpha = clamp(u * 1.25);
  }

  const x = W / 2 + dx;
  const y = 666;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '900 45px "NotoSansSC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // 柔和底影 + 干净深色描边 + 纯白字芯（无底框、无角标、无水印）
  ctx.shadowColor = 'rgba(0, 0, 0, 0.58)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.lineWidth = 7.5;
  ctx.strokeStyle = 'rgba(8, 12, 8, 0.94)';
  ctx.strokeText(active.text, x, y);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(active.text, x, y);
  ctx.restore();
}

// ---------------------------------------------------------------- 精灵裁剪预缩放与背景层预构建（带磁盘 BBox 缓存）
const BBOX_CACHE_PATH = '/tmp/replica_trim_bbox_cache.json';
let BBOX_CACHE = {};
try {
  if (fs.existsSync(BBOX_CACHE_PATH)) BBOX_CACHE = JSON.parse(fs.readFileSync(BBOX_CACHE_PATH, 'utf8'));
} catch { BBOX_CACHE = {}; }

async function loadTrimmedSprite(filePath, targetMaxDim = 540) {
  const img = await loadImage(filePath);
  const st = fs.statSync(filePath);
  const key = `${filePath}:${st.mtimeMs}:${img.width}x${img.height}`;
  let box = BBOX_CACHE[key];
  if (!box) {
    const tmp = createCanvas(img.width, img.height);
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0);
    const data = tx.getImageData(0, 0, img.width, img.height).data;
    let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        if (data[(y * img.width + x) * 4 + 3] > 18) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < x0) throw new Error(`空白透明图像: ${filePath}`);
    box = { x0, y0, bw: x1 - x0 + 1, bh: y1 - y0 + 1 };
    BBOX_CACHE[key] = box;
  }
  const { x0, y0, bw, bh } = box;
  const scale = Math.min(1.0, targetMaxDim / Math.max(bw, bh));
  const cw = Math.max(1, Math.round(bw * scale));
  const ch = Math.max(1, Math.round(bh * scale));
  const cv = createCanvas(cw, ch);
  const cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(img, x0, y0, bw, bh, 0, 0, cw, ch);
  return { cv, w: cw, h: ch, aspect: cw / ch };
}

function drawAnchoredSprite(ctx, sp, anchorX, anchorY, baseH, sx, sy, shadow = false, pivotFrac = 1.0) {
  // pivotFrac = 1.0 表示以脚底为压扁锚点（前景小人）；pivotFrac ≈ 0.76 表示以山脊胸腹线为压扁锚点（山后巨物，压扁时大脸刚好贴在草坡顶！）
  const drawH = baseH * sy;
  const drawW = baseH * sp.aspect * sx;
  if (shadow) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 24, 6, 0.42)';
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY - 2, drawW * 0.42, Math.max(4, baseH * 0.065), 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.drawImage(sp.cv, anchorX - drawW / 2, anchorY - drawH * pivotFrac, drawW, drawH);
}

// 预构建带外延边距 (PAD_X=128, PAD_Y=72) 的全背景画布与前景草坡遮罩画布（支持推镜拉远零黑边）
const PAD_X = 128;
const PAD_Y = 72;
const EXT_W = W + PAD_X * 2;
const EXT_H = H + PAD_Y * 2;

async function buildStageLayers() {
  const bgPath = path.join(HERE, 'bg_xp_hill_clean.png');
  const ridgePath = path.join(HERE, 'xp_hill_ridge.json');
  const bgImg = await loadImage(bgPath);
  const { y_ridge: yRidgeArr } = JSON.parse(fs.readFileSync(ridgePath, 'utf8'));

  // 1. 构建带无缝镜像边缘外延的完整背景层 bgExtCanvas
  const bgExt = createCanvas(EXT_W, EXT_H);
  const bx = bgExt.getContext('2d');
  // 中心原图
  bx.drawImage(bgImg, PAD_X, PAD_Y, W, H);
  // 左右镜像延展
  bx.save(); bx.translate(PAD_X, PAD_Y); bx.scale(-1, 1);
  bx.drawImage(bgImg, 0, 0, PAD_X, H, 0, 0, PAD_X, H);
  bx.restore();
  bx.save(); bx.translate(PAD_X + W * 2, PAD_Y); bx.scale(-1, 1);
  bx.drawImage(bgImg, W - PAD_X, 0, PAD_X, H, W - PAD_X, 0, PAD_X, H);
  bx.restore();
  // 上下镜像延展（涵盖四角）
  const topStrip = createCanvas(EXT_W, PAD_Y);
  const tsx = topStrip.getContext('2d');
  tsx.translate(0, PAD_Y); tsx.scale(1, -1);
  tsx.drawImage(bgExt, 0, PAD_Y, EXT_W, PAD_Y, 0, 0, EXT_W, PAD_Y);
  bx.drawImage(topStrip, 0, 0);

  const botStrip = createCanvas(EXT_W, PAD_Y);
  const bsx = botStrip.getContext('2d');
  bsx.translate(0, PAD_Y); bsx.scale(1, -1);
  bsx.drawImage(bgExt, 0, PAD_Y + H - PAD_Y, EXT_W, PAD_Y, 0, 0, EXT_W, PAD_Y);
  bx.drawImage(botStrip, 0, PAD_Y + H);

  // 2. 构建前景草坡遮罩画布 fgGrassExt（仅保留 y >= y_ridge(x) 的草坡像素，边缘 1.8px 抗锯齿羽化）
  const fgGrassExt = createCanvas(EXT_W, EXT_H);
  const fx = fgGrassExt.getContext('2d');
  fx.drawImage(bgExt, 0, 0);
  const imgData = fx.getImageData(0, 0, EXT_W, EXT_H);
  const d = imgData.data;

  const ridgeAtExtX = (ex) => {
    const gx = ex - PAD_X;
    if (gx < 0) return yRidgeArr[0] + (-gx) * 0.08;
    if (gx >= W) return yRidgeArr[W - 1] - (gx - (W - 1)) * 0.02;
    return yRidgeArr[gx];
  };

  for (let ex = 0; ex < EXT_W; ex++) {
    const yr = ridgeAtExtX(ex) + PAD_Y;
    const yCut0 = Math.floor(yr - 1.2);
    for (let ey = 0; ey < EXT_H; ey++) {
      const idx = (ey * EXT_W + ex) * 4 + 3;
      if (ey <= yCut0) {
        d[idx] = 0;
      } else if (ey < yr + 1.2) {
        const a = clamp((ey - (yr - 1.0)) / 2.0);
        d[idx] = Math.round(a * 255);
      }
    }
  }
  fx.putImageData(imgData, 0, 0);

  return { bgExt, fgGrassExt, yRidgeArr };
}

async function loadAllAssets() {
  const stage = await buildStageLayers();
  const ringGlyphs = buildNeonRingGlyphs();

  // 39 张 DSH 表情包 (预缩放到 220px 供前景草坡列队高速绘制)
  const dshDir = path.join(REPO, 'tools/day2制作/video-fx源码快照/day2_poses');
  const stickers = [];
  for (const id of STICKER_POSE_CATALOG_39) {
    const p = path.join(dshDir, `dsh-whale-state-${id}.webp`);
    stickers.push(await loadTrimmedSprite(p, 220));
  }

  // 本鲸高清立绘 (预缩放到 540px 供山后巨物高速绘制)
  const whaleDir = path.join(HERE, 'whale_girl_src');
  const whaleGiants = [];
  for (const k of WHALE_GIANT_KEYS) {
    const p = path.join(whaleDir, `whale_${k}.png`);
    whaleGiants.push(await loadTrimmedSprite(p, 540));
  }

  // Claude 大小姐全部 14 张 Q 版立绘 (预缩放到 520px 兼顾山后巨物客串与前景列队)
  const claudeDir = path.join(HERE, 'claude_src/chibi');
  const claudeChibis = [];
  for (const k of CLAUDE_CHIBI_KEYS) {
    const p = path.join(claudeDir, `pose_${k}.png`);
    claudeChibis.push(await loadTrimmedSprite(p, 520));
  }
  try { fs.writeFileSync(BBOX_CACHE_PATH, JSON.stringify(BBOX_CACHE)); } catch { /* ignore */ }

  console.log(
    `✓ [${EDITION}] 资产就绪：DSH表情包 ${stickers.length}/39 | 本鲸巨物 ${whaleGiants.length} | Claude大小姐Q版 ${claudeChibis.length}/14`
  );
  return { ...stage, ringGlyphs, stickers, whaleGiants, claudeChibis };
}

// 计算当前乐句波次索引（严格量化到正拍压扁最低点切换，避免弹跳半空突兀变形）
function getPhraseWaveIndex(beatFloat) {
  const bInt = Math.floor(beatFloat + 0.02);
  let wave = 0;
  for (let i = 0; i < PHRASE_SWITCH_BEATS.length; i++) {
    if (bInt >= PHRASE_SWITCH_BEATS[i]) wave = i;
  }
  return wave;
}

// ---------------------------------------------------------------- 渲染主场景（绘制在 EXT_W × EXT_H 舞台画布上）
function renderStageScene(sctx, fIdx, t, assets, ringItems) {
  const beatFloat = (t - BEAT_PHASE_0) / BEAT;
  const { sy, sx } = replicaBounce(beatFloat);
  const wave = getPhraseWaveIndex(beatFloat);
  const { bgExt, fgGrassExt, yRidgeArr, stickers, whaleGiants, claudeChibis } = assets;

  // 190.03s (frame 5701) 起复刻原片结尾黑场彩蛋：背景与角色切黑，仅保留 3D 彩虹光环旋转！
  if (fIdx >= 5701) {
    sctx.fillStyle = '#000000';
    sctx.fillRect(0, 0, EXT_W, EXT_H);
    drawRingPass(sctx, ringItems, true, PAD_X, PAD_Y);
    drawRingPass(sctx, ringItems, false, PAD_X, PAD_Y);
    return;
  }

  // Layer 1: Windows XP 晴空积云 + 草坡全景底图
  sctx.drawImage(bgExt, 0, 0);

  // Layer 2: 3D 彩虹霓虹环绕字 —— 后半圈 (z > 0，位于巨物脑后)
  drawRingPass(sctx, ringItems, true, PAD_X, PAD_Y);

  // Layer 3: 山脊后方巨物角色（以山脊胸腹线 pivotFrac=0.76 为锚点：直立时头顶达 y≈28 傲立云端，压扁时大脸刚好贴在草坡顶！）
  if (EDITION === 'base') {
    const giantSp = whaleGiants[wave % whaleGiants.length];
    const gx = 968 + PAD_X;
    const gyPivot = yRidgeArr[968] + 34 + PAD_Y;
    drawAnchoredSprite(sctx, giantSp, gx, gyPivot, 474, sx, sy, false, 0.76);
  } else {
    // Claude大小姐客串版：在原版基础上，山后左侧草坡加入 Q 版 Claude 大小姐巨物客串，右侧保留本鲸主角 C 位，双脸零遮挡！
    const claudeSp = claudeChibis[wave % claudeChibis.length];
    const cx = 716 + PAD_X;
    const cyPivot = yRidgeArr[716] + 30 + PAD_Y;
    drawAnchoredSprite(sctx, claudeSp, cx, cyPivot, 376, sx, sy, false, 0.77);

    const whaleSp = whaleGiants[wave % whaleGiants.length];
    const wx = 1018 + PAD_X;
    const wyPivot = yRidgeArr[1018] + 34 + PAD_Y;
    drawAnchoredSprite(sctx, whaleSp, wx, wyPivot, 464, sx, sy, false, 0.76);
  }

  // Layer 4: 前景翠绿山坡遮挡层（精准遮住山后巨物下半身）
  sctx.drawImage(fgGrassExt, 0, 0);

  // Layer 5: 前景草坡 15 席透视列队（全员同步 Q 弹 + 脚底接触暗影）
  // 错开 3 组波次偏移确保 39 张 DSH 表情包与 14 张大小姐 Q 版姿态全片完整轮播亮相
  for (let i = 0; i < HILL_SLOTS_15.length; i++) {
    const slot = HILL_SLOTS_15[i];
    const ax = slot.x + PAD_X;
    const ay = (slot.yAbs !== undefined ? slot.yAbs : yRidgeArr[slot.x] + slot.dy) + PAD_Y;

    let miniSp;
    if (EDITION === 'claude' && i % 2 === 1) {
      // 奇数席位由 Claude 大小姐 Q 版姿态客串列队
      const cIdx = (Math.floor(i / 2) + wave * 3) % claudeChibis.length;
      miniSp = claudeChibis[cIdx];
    } else {
      // 原版全部 15 席（及客串版偶数席）轮播全部 39 张本鲸 DSH 表情包
      const sIdx = (i + wave * 8) % stickers.length;
      miniSp = stickers[sIdx];
    }
    drawAnchoredSprite(sctx, miniSp, ax, ay, slot.h, sx, sy, true);
  }

  // Layer 6: 3D 彩虹霓虹环绕字 —— 前半圈 (z <= 0，发光掠过巨物面前)
  drawRingPass(sctx, ringItems, false, PAD_X, PAD_Y);
}

// ---------------------------------------------------------------- 合成最终 1280×720 帧（含高潮推镜动感模糊与纯净字幕）
function renderFinalFrame(outCtx, stageCanvas, sctx, fIdx, assets) {
  const t = fIdx / FPS;
  const ringItems = computeRingItems(t, assets.ringGlyphs);
  renderStageScene(sctx, fIdx, t, assets, ringItems);

  const cam = getWhipCamera(t);
  if (!cam.active || fIdx >= 5701) {
    outCtx.drawImage(stageCanvas, PAD_X, PAD_Y, W, H, 0, 0, W, H);
  } else {
    // 复刻 62.6s & 126.1s 高潮推镜 + 多重径向缩放残影 (Zoom Motion Blur)
    const TAPS = 5;
    outCtx.clearRect(0, 0, W, H);
    const fxExt = cam.fx + PAD_X;
    const fyExt = cam.fy + PAD_Y;
    for (let k = 0; k < TAPS; k++) {
      const frac = TAPS === 1 ? 0 : (k / (TAPS - 1)) - 0.5;
      const z = Math.max(0.84, cam.zoom * (1 + frac * cam.blur));
      const srcW = W / z;
      const srcH = H / z;
      const srcX = clamp(fxExt - (cam.fx / z), 0, EXT_W - srcW);
      const srcY = clamp(fyExt - (cam.fy / z), 0, EXT_H - srcH);
      outCtx.save();
      outCtx.globalAlpha = k === 0 ? 1.0 : 1.0 / (k + 1);
      outCtx.drawImage(stageCanvas, srcX, srcY, srcW, srcH, 0, 0, W, H);
      outCtx.restore();
    }
  }

  // Layer 7: 纯净底部白字黑边滑入/滑出歌词（零水印、零计数、零杂物）
  if (fIdx < 5701) {
    drawCleanSubtitle(outCtx, t);
  }
}

// ---------------------------------------------------------------- 主入口：支持关键帧抽检与全片高速流式编码
async function main() {
  const assets = await loadAllAssets();
  const stageCanvas = createCanvas(EXT_W, EXT_H);
  const sctx = stageCanvas.getContext('2d');
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';

  const outCanvas = createCanvas(W, H);
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  const timesArg = argOf('--times');
  if (timesArg) {
    const dir = argOf('--stills-dir', path.join('/tmp/replica_stills', EDITION));
    fs.mkdirSync(dir, { recursive: true });
    for (const ts of timesArg.split(',').map((s) => Number(s.trim()))) {
      const fIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(ts * FPS)));
      renderFinalFrame(outCtx, stageCanvas, sctx, fIdx, assets);
      const outPng = path.join(dir, `t_${ts.toFixed(2)}s.png`);
      fs.writeFileSync(outPng, outCanvas.toBuffer('image/png'));
      console.log(`  still -> ${outPng}`);
    }
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const ffmpegBin = resolveFfmpeg();
  const ffArgs = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`,
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO,
    '-af', `apad=whole_dur=${TOTAL_DUR.toFixed(3)}`,
    '-t', TOTAL_DUR.toFixed(3),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '24',
    '-maxrate', '1450k',
    '-bufsize', '2900k',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    OUT
  ];

  console.log(`▶ 开始渲染 [${EDITION}] -> ${OUT} (${W}x${H}@${FPS}fps, ${TOTAL_FRAMES}帧 = ${TOTAL_DUR.toFixed(2)}s)`);
  const tStart = Date.now();
  const ff = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'inherit', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', (d) => { ffErr += d.toString(); });

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    renderFinalFrame(outCtx, stageCanvas, sctx, f, assets);
    const raw = outCtx.getImageData(0, 0, W, H).data;
    const buf = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    if (!ff.stdin.write(buf)) {
      await new Promise((r) => ff.stdin.once('drain', r));
    }
    if ((f + 1) % 900 === 0 || f + 1 === TOTAL_FRAMES) {
      const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
      const fpsNow = ((f + 1) / Math.max(0.1, (Date.now() - tStart) / 1000)).toFixed(1);
      console.log(`  [${EDITION}] ${f + 1}/${TOTAL_FRAMES} (${(((f + 1) / TOTAL_FRAMES) * 100).toFixed(0)}%) | ${elapsed}s | ${fpsNow} fps`);
    }
  }
  ff.stdin.end();

  const code = await new Promise((resolve) => ff.on('close', resolve));
  if (code !== 0) {
    throw new Error(`ffmpeg 编码失败 (exit=${code}):\n${ffErr.slice(-1200)}`);
  }
  const szMb = (fs.statSync(OUT).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ 渲染完成: ${OUT} (${szMb} MB, 用时 ${((Date.now() - tStart) / 1000).toFixed(1)}s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
