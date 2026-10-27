// ============================================================================
// render_mv_qtan_multi.mjs —— 《朋友的酒》通透小曲 · 多表情包草坡 Q 弹 MV 渲染引擎 (v2)
//
// 对标拆解自参考视频（《邦友的酒(DJ版)》活跃黑江乐 / 通透小曲 Q 弹视频教程）+ `SSSimpleC/chibi-squash-spin`：
//   1. 视觉母体：Windows XP《Bliss》高饱和蓝天积云 + 斜向翠绿山坡（「看一眼整个人都通透了」），
//      四段天光随乐句演进（晴空积云 → 桃花玫瑰双彩虹 → 雨过天晴金辉 → 副歌琥珀狂欢）；
//   2. 前后双层经典群像构图（参考片 0.0s–14.0s 1:1 几何对位）：
//      · 后景山脊巨物主唱本鲸（12 张高清立绘随乐句切换）：锚点置于山脊线后方，弹起时半身傲立云端，
//        压扁时（sy=0.48, sx=1.48）沉入山脊后只露出一张超宽糯叽叽大脸贴在草坡顶；
//      · 前景草坡「多表情包」合唱团：完整挂载并核验仓库登记的全部 39 张 DSH 鲸鱼娘表情包
//        （`STICKER_POSE_CATALOG_39`，每张按真实 Alpha BBox 独立脚底锚定草坡 + 接触暗影），
//        分 3 波（13×3=39 零重复全覆盖）+ 副歌双排 20~26 枚同屏大合唱；
//      · C 位 360° 真·四向三视图弹转领舞（提取自 `dafeiyu-chibi-character-sheet.png` 正/左/背/右 Q 版母版）：
//        复刻教程后半段 & `chibi-squash-spin` 4 拍一整圈（1.846s/圈）连续转身 + 逐拍 Q 弹；
//      · 副歌「好朋友好朋友今宵多欢畅」惊喜客串：Q 版 Claude 大小姐（`claude_src/chibi/`）山后同框碰杯；
//   3. 实测 130.00 BPM（拍长 0.461538s）麻薯果冻物理曲线 + 四种编舞阵型（齐压 / 草坡人浪 / 奇偶对跳 / 副歌欢跳）；
//   4. 严格遵守项目默认规则：
//      · 字幕直接 `import { createDay2Subtitle } from '../字幕/day2_style_sub.mjs'`（一屏一句，不做逐字点亮）；
//      · 第 0 帧即封面（大字口令 alpha=1 直出 + 全员动作中段，零黑场零淡入，直击 2s 跳出率）；
//      · 角色零违规装饰堆叠，自称「本鲸」，保留非官方同人 / AI 生成与 MIT / CC BY-NC-SA 4.0 归属。
//
// 用法：
//   # 1) 抖音竖屏完整正片 (1080×1920, 56.00s)
//   node tools/day3制作/render_mv_qtan_multi.mjs --aspect 9:16 \
//     --audio /tmp/vfx/朋友的酒.mp3 --from 18 --dur 56 \
//     --out Day3/成片/MV/朋友的酒_多表情包Q弹MV_v2.mp4
//
//   # 2) 横屏经典草坡全景版 (1920×1080, 56.00s)
//   node tools/day3制作/render_mv_qtan_multi.mjs --aspect 16:9 \
//     --audio /tmp/vfx/朋友的酒.mp3 --from 18 --dur 56 \
//     --out Day3/成片/MV/朋友的酒_多表情包Q弹MV_v2_横屏16x9.mp4
//
//   # 3) 参考视频《邦友的酒(DJ版)》纯净原声精华复刻版 (1920×1080, 15.70s)
//   node tools/day3制作/render_mv_qtan_multi.mjs --aspect 16:9 --mode ref-dj \
//     --audio /tmp/ref_dj_clean_16s.wav --from 0 --dur 15.7 \
//     --out Day3/成片/MV/朋友的酒_邦友DJ原声复刻_16s.mp4
//
//   # 4) 关键帧抽检
//   node tools/day3制作/render_mv_qtan_multi.mjs --aspect 9:16 --times 0,0.33,0.56,8.5,25.0,36.0,49.0
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

import { createDay2Subtitle } from '../字幕/day2_style_sub.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

function resolveCanvas() {
  for (const c of [
    '@napi-rs/canvas',
    '/tmp/node_render/node_modules/@napi-rs/canvas',
    path.join(process.env.VIDEO_FX_DIR || path.join(REPO, 'video-fx'), 'node_modules/@napi-rs/canvas')
  ]) {
    try { return require(c); } catch { /* try next */ }
  }
  throw new Error('缺少 @napi-rs/canvas');
}
const { createCanvas, loadImage, GlobalFonts } = resolveCanvas();

const FONT_DIR = path.join(process.env.VIDEO_FX_DIR || path.join(REPO, 'video-fx'), 'assets/fonts');
for (const [f, name] of [
  ['NotoSansSC-Bold.ttf', 'NotoSansSC'],
  ['ZCOOLKuaiLe-Regular.ttf', 'ZCOOLKuaiLe'],
  ['Silkscreen-Regular.ttf', 'Silkscreen']
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

const ASPECT = argOf('--aspect', '9:16');
const IS_VERT = ASPECT === '9:16';
const W = IS_VERT ? 1080 : 1920;
const H = IS_VERT ? 1920 : 1080;
const FPS = 30;

const MODE = argOf('--mode', 'full'); // 'full' | 'ref-dj'
const AUDIO = argOf('--audio', path.join(REPO, 'video-fx/assets/pengyou_de_jiu.mp3'));
const FROM = Number(argOf('--from', MODE === 'ref-dj' ? '0' : '18'));
const DUR = Number(argOf('--dur', MODE === 'ref-dj' ? '15.7' : '56'));
// 实测低频底鼓 (<180Hz) 节拍：130.000 BPM，18.00s 切片首拍落在 +0.332s（参考视频 DJ 原片首拍落在 +0.402s）
const BPM = Number(argOf('--bpm', '130.0'));
const BEAT = 60 / BPM;
const BEAT_PHASE_0 = Number(argOf('--beat-offset', MODE === 'ref-dj' ? '0.402' : '0.332'));
const GUEST_MODE = argOf('--guest', 'claude'); // 'claude' | 'none'
const HOOK_TEXT = argOf('--hook', '所有人！|保持Q弹！');
const HOOK_DUR = Number(argOf('--hook-dur', '2.6'));
const LIMIT = ARGV.includes('--hook-out') ? Math.min(DUR, Number(argOf('--hook-len', '4'))) : DUR;
const OUT = argOf(
  '--hook-out',
  argOf('--out', path.join(REPO, IS_VERT
    ? 'Day3/成片/MV/朋友的酒_多表情包Q弹MV_v2.mp4'
    : 'Day3/成片/MV/朋友的酒_多表情包Q弹MV_v2_横屏16x9.mp4'))
);

// ---------------------------------------------------------------- 39 张 DSH 鲸鱼娘表情包权威目录（agent.md §0.3 & §0.4）
export const STICKER_POSE_CATALOG_39 = [
  // Wave A: 通透开场组 (13)
  'idle-cute', 'greet', 'celebrate', 'cool-shades', 'wink',
  'meme-smug', 'meme-doge', 'star', 'game-happy', 'daily-done',
  'meme-music', 'blush', 'teasing',
  // Wave B: 桃花玫瑰反差萌组 (13)
  'meme-heart', 'bold', 'curious', 'meme-yes', 'meme-cry',
  'meme-no', 'failure', 'react-head', 'react-tail', 'tail-swing',
  'levelup', 'game-win', 'success',
  // Wave C: 打工苦尽甘来干饭组 (13)
  'work-deadline', 'work-debug', 'work-review', 'work-idea', 'thinking',
  'running', 'daily-stretch', 'sleep', 'daily-eat', 'eat',
  'react-belly', 'daily-gaming', 'angry'
];

if (STICKER_POSE_CATALOG_39.length !== 39 || new Set(STICKER_POSE_CATALOG_39).size !== 39) {
  throw new Error(`STICKER_POSE_CATALOG_39 门禁失败：必须严格为 39 张不重复表情包`);
}

// 山后巨物本鲸 12 张高清主唱姿势（tools/day3制作/whale_girl_src/whale_*.png）
const GIANT_POSE_KEYS = [
  'cheer', 'idol_mic_sing', 'confident_hips', 'ciallo_wink',
  'playful_fists', 'rose_bouquet', 'umbrella_stroll', 'tail_wag_dance',
  'toast_cheers', 'coin_hug', 'sparkler_firework', 'jump_joy'
];

// 副歌客串 Q 版 Claude 大小姐姿势（tools/day3制作/claude_src/chibi/pose_*.png）
const CLAUDE_CHIBI_KEYS = ['cheer', 'dance', 'sing', 'wave_hi', 'ok_hand', 'megaphone'];

// ---------------------------------------------------------------- 声学复核后的歌词时间轴
// 经 350–3200Hz 人声带通包络实测核验（与 `朋友的酒.mp3` 18.00s–74.00s 精确对齐）
const LYRICS_FULL = [
  { t0: 18.31, t1: 25.90, text: '昨日一去不复回 哦耶', speaker: '本鲸' },
  { t0: 26.00, t1: 34.00, text: '开心比什么都贵', speaker: '本鲸' },
  { t0: 34.10, t1: 41.92, text: '覆水不能再收回 哦耶', speaker: '本鲸' },
  { t0: 41.99, t1: 50.00, text: '桃花谢了有玫瑰', speaker: '本鲸' },
  { t0: 50.10, t1: 53.88, text: '人生几十年总会有风雨来陪', speaker: '本鲸' },
  { t0: 53.95, t1: 57.92, text: '潇潇洒洒赴会今不醉不归', speaker: '本鲸' },
  { t0: 58.00, t1: 61.44, text: '往事后不后悔慢慢去体会', speaker: '本鲸' },
  { t0: 61.50, t1: 66.00, text: '此刻朋友这杯酒最珍贵', speaker: '本鲸 & 表情包团' },
  { t0: 66.05, t1: 69.90, text: '快把酒满上干了这杯大声歌唱', speaker: '全场齐唱' },
  { t0: 69.94, t1: 73.95, text: '好朋友好朋友今宵多欢畅', speaker: GUEST_MODE === 'claude' ? '本鲸 & 大小姐' : '全场齐唱' }
];

// 参考视频《邦友的酒(DJ版)》15.70s 纯净原声精华轨字幕
const LYRICS_REF_DJ = [
  { t0: 0.20, t1: 7.45, text: '昨日一去不复回 哦耶～', speaker: '本鲸 (邦友DJ调)' },
  { t0: 7.50, t1: 8.55, text: '开心比什么都贵！', speaker: '本鲸 (邦友DJ调)' },
  { t0: 8.60, t1: 12.15, text: '哦耶耶～桃花谢了有玫瑰～', speaker: '39表情包合唱' },
  { t0: 12.20, t1: 15.55, text: '哦耶耶～桃花谢了有玫瑰～', speaker: '全员Q弹转圈' }
];

const LYRICS = MODE === 'ref-dj' ? LYRICS_REF_DJ : LYRICS_FULL;

// ---------------------------------------------------------------- 项目统一默认字幕组件 (`day2_style_sub.mjs`)
const subFontOf = (size, weight) => `${weight} ${size}px "NotoSansSC", "Noto Sans SC", sans-serif`;
const subMeasure = createCanvas(8, 8).getContext('2d');
const SUB_K = IS_VERT ? 1.72 : 1.32;
const SUB_MAX_W = IS_VERT ? 480 : 720;
const SUB = createDay2Subtitle({
  fontOf: subFontOf,
  measureCtx: subMeasure,
  cfg: { maxTextWidth: SUB_MAX_W }
});

// ---------------------------------------------------------------- 数学工具
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (v) => 1 - Math.pow(1 - clamp(v), 2.4);
const easeIn = (v) => Math.pow(clamp(v), 2.1);
const smoothstep = (v) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); }

function strokeFillText(ctx, str, x, y, size, fill, opts = {}) {
  ctx.save();
  const italic = opts.italic ? 'italic ' : '';
  ctx.font = `${italic}${opts.weight || 900} ${size}px ${opts.font || '"NotoSansSC", sans-serif'}`;
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (opts.shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillText(str, x + (opts.sx || 4), y + (opts.sy || 5));
  }
  if (opts.stroke !== false) {
    ctx.lineWidth = opts.sw || Math.max(4, size * 0.15);
    ctx.strokeStyle = opts.strokeColor || '#08111E';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// ---------------------------------------------------------------- 麻薯果冻 Q 弹物理模型（对标参考片实测曲线）
// beatIndex: 当前节拍浮点值（整数 = 底鼓正拍落点！）
// 正拍 p=0 处角色刚好砸到最扁麻薯饼 (sy=minSy, sx=maxSx)，随后弹性拉伸至 p≈0.52 最高点，再重力加速砸向下一拍！
function qtanMochi(beatFloat, opts = {}) {
  const minSy = opts.minSy ?? 0.52;
  const maxSx = opts.maxSx ?? 1.48;
  const stretchSy = opts.stretchSy ?? 1.07;
  const stretchSx = opts.stretchSx ?? 0.94;
  const hopPx = opts.hopPx ?? 0;

  const p = ((beatFloat % 1) + 1) % 1; // 0..1, 0 = exact kick hit
  let squash; // 1 = max pancake squash, 0 = neutral, <0 = tall stretch
  if (p < 0.13) {
    // 糯感贴地微停留 (0.00 -> 0.13)
    const u = p / 0.13;
    squash = 1.0 - 0.12 * (u * u);
  } else if (p < 0.54) {
    // Q弹快速回弹并向上拉伸过冲 (0.13 -> 0.54)
    const u = (p - 0.13) / 0.41;
    squash = lerp(0.88, -1.0, easeOut(u));
  } else {
    // 从顶点重力加速砸向下一拍底鼓 (0.54 -> 1.00)
    const u = (p - 0.54) / 0.46;
    squash = lerp(-1.0, 1.0, easeIn(u));
  }

  let sy, sx;
  if (squash >= 0) {
    sy = lerp(1.0, minSy, squash);
    sx = lerp(1.0, maxSx, squash);
  } else {
    const st = -squash;
    sy = lerp(1.0, stretchSy, st);
    sx = lerp(1.0, stretchSx, st);
  }

  // 副歌欢跳抛物线（抬升期离地跃起，正拍落回草地压扁）
  let liftY = 0;
  if (hopPx > 0 && p > 0.14 && p < 0.88) {
    const hu = (p - 0.14) / 0.74;
    liftY = Math.sin(hu * Math.PI) * hopPx;
  }
  return { sy, sx, squash: Math.max(0, squash), liftY, p };
}

// ---------------------------------------------------------------- Windows XP《Bliss》草坡山脊几何
// u ∈ [0, 1] 横向归一化坐标 -> 山脊线像素 Y（左低右高弧形山坡，完美复刻参考视频 t_1.0.png！）
function ridgeY(u) {
  if (IS_VERT) {
    // 竖屏：留足顶部钩子大字蓝天呼吸区，左侧 y=1092 斜向抬升至 u=0.76 坡顶 y=932，右侧微收 y=952
    const rise = Math.sin(clamp(u / 0.82, 0, 1) * (Math.PI * 0.5));
    const dip = u > 0.76 ? Math.pow((u - 0.76) / 0.24, 1.6) * 20 : 0;
    return 1092 - rise * 160 + dip;
  } else {
    // 横屏 16:9：左侧 y=706 斜向抬升至 u=0.76 坡顶 y=518，右侧微收 y=540
    const rise = Math.sin(clamp(u / 0.80, 0, 1) * (Math.PI * 0.5));
    const dip = u > 0.76 ? Math.pow((u - 0.76) / 0.24, 1.6) * 22 : 0;
    return 706 - rise * 188 + dip;
  }
}

// 章节阶段判定（0..3）
function getSection(t) {
  if (MODE === 'ref-dj') {
    if (t < 8.60) return 0; // 前半：邦友草坡经典群像
    return 1;               // 后半：桃花玫瑰彩虹 + 360° 弹转高潮
  }
  const abs = t + FROM;
  if (abs < 34.05) return 0; // Section I: 晴空积云经典通透 (18..34s)
  if (abs < 50.08) return 1; // Section II: 覆水难收 · 桃花玫瑰双彩虹 (34..50s)
  if (abs < 61.48) return 2; // Section III: 风雨来陪 → 金辉破云 360° 弹转领舞 (50..61.5s)
  return 3;                  // Section IV: 副歌把酒满上 · 26表情包双排 + 大小姐碰杯狂欢 (61.5..74s)
}

// ---------------------------------------------------------------- 绘制蓝天积云 + 四段氛围天光
function drawSkyAndAtmosphere(ctx, t, beatFloat, sec) {
  const pulse = Math.exp(-(((beatFloat % 1) + 1) % 1) * 4.5);

  // 1. 经典 Windows XP Bliss 天空渐变（按章节微调冷暖氛围，保持高通透蓝底）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.68);
  if (sec === 0) {
    skyGrad.addColorStop(0.0, '#1B56C8');
    skyGrad.addColorStop(0.48, '#3F86E6');
    skyGrad.addColorStop(1.0, '#8CC4FA');
  } else if (sec === 1) {
    skyGrad.addColorStop(0.0, '#1E5BD0');
    skyGrad.addColorStop(0.48, '#4A8FEA');
    skyGrad.addColorStop(1.0, '#A2D2FF');
  } else if (sec === 2) {
    // 先微凉雨雾后破云金光
    const abs = t + FROM;
    const goldK = MODE === 'ref-dj' ? 1 : smoothstep((abs - 53.5) / 2.0);
    skyGrad.addColorStop(0.0, goldK > 0.5 ? '#1D5AC4' : '#244E9C');
    skyGrad.addColorStop(0.52, goldK > 0.5 ? '#4C8FE6' : '#4E7EC8');
    skyGrad.addColorStop(1.0, goldK > 0.5 ? '#FFE0A3' : '#9DC2E8');
  } else {
    // 副歌：通透晴空叠琥珀晴霞（「把酒满上 · 今宵多欢畅」）
    skyGrad.addColorStop(0.0, '#1A52C0');
    skyGrad.addColorStop(0.45, '#3E84E4');
    skyGrad.addColorStop(0.82, '#8BC4F9');
    skyGrad.addColorStop(1.0, '#FFE4A8');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.72);

  // 2. 右上方通透太阳光晕与随拍呼吸光束
  const sunX = W * 0.82, sunY = H * (IS_VERT ? 0.14 : 0.16);
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, W * 0.55);
  sunGlow.addColorStop(0, `rgba(255,252,232,${0.36 + 0.12 * pulse})`);
  sunGlow.addColorStop(0.35, `rgba(210,236,255,${0.16 + 0.06 * pulse})`);
  sunGlow.addColorStop(1, 'rgba(210,236,255,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, H * 0.7);

  // 3. 双彩虹拱桥（Section 1「桃花谢了有玫瑰」& Section 3 副歌狂欢，致敬参考片 t_16.5.png！）
  if (sec === 1 || sec === 3) {
    const rbAlpha = sec === 1 ? 0.30 + 0.08 * pulse : 0.22 + 0.08 * pulse;
    const cx = W * 0.50, cy = H * (IS_VERT ? 0.58 : 0.72);
    const baseR = W * (IS_VERT ? 0.62 : 0.50);
    const colors = ['#FF5964', '#FF9F1C', '#FFE74C', '#4CD964', '#35A7FF', '#6C63FF', '#B565F7'];
    ctx.save();
    ctx.globalAlpha = rbAlpha;
    for (let i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = IS_VERT ? 12 : 15;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR - i * (IS_VERT ? 11 : 13), Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. 体积感层积云（XP 标志性蓬松白云缓慢右移）
  const clouds = [
    { u: 0.14, y: 0.18, s: 1.05, sp: 0.008 },
    { u: 0.48, y: 0.11, s: 0.82, sp: 0.006 },
    { u: 0.84, y: 0.24, s: 1.22, sp: 0.010 },
    { u: 0.28, y: 0.34, s: 0.90, sp: 0.007 },
    { u: 0.68, y: 0.31, s: 0.76, sp: 0.009 }
  ];
  for (const cl of clouds) {
    const cx = (((cl.u + t * cl.sp) % 1.28) - 0.14) * W;
    const cy = cl.y * H * (IS_VERT ? 0.82 : 1.0);
    const r0 = (IS_VERT ? 68 : 84) * cl.s;
    drawFluffyCloud(ctx, cx, cy, r0);
  }

  // 5. Section 2 前半句「风雨来陪」轻盈太阳雨丝 → 后半句金光丁达尔束
  if (sec === 2 && MODE !== 'ref-dj') {
    const abs = t + FROM;
    if (abs < 53.95) {
      ctx.save();
      ctx.strokeStyle = 'rgba(225,242,255,0.34)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 42; i++) {
        const rx = ((hash(i * 3.1) * W + t * 220) % W);
        const ry = ((hash(i * 7.7) * H * 0.6 + t * 920) % (H * 0.62));
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 10, ry + 36);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(sunX, sunY);
      for (let i = 0; i < 6; i++) {
        const ang = 2.05 + i * 0.16 + Math.sin(t * 0.7 + i) * 0.02;
        const lg = ctx.createLinearGradient(0, 0, Math.cos(ang) * H, Math.sin(ang) * H);
        lg.addColorStop(0, `rgba(255,238,168,${0.14 + 0.06 * pulse})`);
        lg.addColorStop(1, 'rgba(255,238,168,0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, H * 1.1, ang - 0.045, ang + 0.045);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawFluffyCloud(ctx, cx, cy, r) {
  ctx.save();
  // 云底淡蓝紫立体暗部
  const lobes = [
    [-0.95, 0.18, 0.68], [-0.42, -0.18, 0.88], [0.18, -0.26, 0.96],
    [0.76, -0.02, 0.78], [1.18, 0.22, 0.58], [0.0, 0.22, 0.85]
  ];
  ctx.fillStyle = 'rgba(182, 208, 245, 0.52)';
  ctx.beginPath();
  for (const [dx, dy, sr] of lobes) {
    ctx.moveTo(cx + dx * r + sr * r, cy + (dy + 0.10) * r);
    ctx.arc(cx + dx * r, cy + (dy + 0.10) * r, sr * r, 0, TAU);
  }
  ctx.fill();

  // 云顶纯净高光白
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r * 0.6);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(232,243,255,0.82)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (const [dx, dy, sr] of lobes) {
    ctx.moveTo(cx + dx * r + sr * r * 0.96, cy + dy * r);
    ctx.arc(cx + dx * r, cy + dy * r, sr * r * 0.96, 0, TAU);
  }
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- 绘制山后巨物本鲸（+ 副歌大小姐同框客串）
// 关键视觉秘密：在绿草坡之前绘制！这样下半身自然被山脊遮挡，压扁时大脸刚好贴在草坡顶上！
function drawBehindHillGiants(ctx, t, beatFloat, sec, assets) {
  const abs = t + FROM;
  // 根据乐句语义精准挑选山后巨物本鲸姿势
  let poseKey = 'cheer';
  if (MODE === 'ref-dj') {
    const idx = Math.floor(beatFloat / 4);
    const seq = ['cheer', 'ciallo_wink', 'idol_mic_sing', 'rose_bouquet', 'toast_cheers'];
    poseKey = seq[idx % seq.length];
  } else if (abs < 26.0) poseKey = (Math.floor(beatFloat / 8) % 2 === 0) ? 'cheer' : 'ciallo_wink';
  else if (abs < 34.1) poseKey = (Math.floor(beatFloat / 8) % 2 === 0) ? 'confident_hips' : 'coin_hug';
  else if (abs < 42.0) poseKey = (Math.floor(beatFloat / 8) % 2 === 0) ? 'playful_fists' : 'tail_wag_dance';
  else if (abs < 50.1) poseKey = 'rose_bouquet';
  else if (abs < 53.95) poseKey = 'umbrella_stroll';
  else if (abs < 61.5) poseKey = (Math.floor(beatFloat / 8) % 2 === 0) ? 'toast_cheers' : 'idol_mic_sing';
  else poseKey = ['toast_cheers', 'idol_mic_sing', 'sparkler_firework', 'jump_joy'][Math.floor(beatFloat / 4) % 4];

  const sprite = assets.giants[poseKey] || assets.giants.cheer;
  const q = qtanMochi(beatFloat, { minSy: 0.48, maxSx: 1.48, stretchSy: 1.06, stretchSx: 0.95 });

  const hasClaudeGuest = (sec === 3 && GUEST_MODE === 'claude' && assets.claude.length > 0);
  const giantU = hasClaudeGuest ? (IS_VERT ? 0.37 : 0.56) : (IS_VERT ? 0.54 : 0.65);
  const gx = giantU * W;
  const rY = ridgeY(giantU);

  // 目标高度：直立时露出 82% 半身傲立山后，压扁时 sy=0.48 沉到山脊线但整张超宽糯脸+双眼完全露出不被前排挡！
  const targetH = IS_VERT ? (hasClaudeGuest ? 690 : 790) : (hasClaudeGuest ? 520 : 585);
  const sinkBelowRidge = targetH * (IS_VERT ? 0.18 : 0.155);
  const yFoot = rY + sinkBelowRidge;

  drawAnchoredSprite(ctx, sprite, gx, yFoot, targetH, q.sx, q.sy, W * (hasClaudeGuest ? 0.68 : 0.92), false);

  // 副歌惊喜客串：Q 版 Claude 大小姐在右侧山头一起 Q 弹举杯欢呼！
  if (hasClaudeGuest) {
    const claudeSprite = assets.claude[Math.max(0, Math.floor(beatFloat / 4)) % assets.claude.length];
    const cu = IS_VERT ? 0.76 : 0.80;
    const cx = cu * W;
    const crY = ridgeY(cu);
    const cTargetH = IS_VERT ? 610 : 470;
    const cq = qtanMochi(beatFloat - 0.06, { minSy: 0.50, maxSx: 1.46, stretchSy: 1.06, stretchSx: 0.95 });
    drawAnchoredSprite(ctx, claudeSprite, cx, crY + cTargetH * 0.165, cTargetH, cq.sx, cq.sy, W * 0.58, false);
  }
}

// ---------------------------------------------------------------- 绘制 Windows XP《Bliss》翠绿山坡主体与草叶肌理
function drawGrassHill(ctx, t, beatFloat) {
  const pulse = Math.exp(-(((beatFloat % 1) + 1) % 1) * 5.0);

  // 远景右侧副山峦（增加立体纵深）
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.32, ridgeY(0.32) + 40);
  for (let i = 0; i <= 32; i++) {
    const u = 0.32 + (i / 32) * 0.68;
    const y = ridgeY(u) - Math.sin((i / 32) * Math.PI) * (IS_VERT ? 34 : 26) + 12;
    ctx.lineTo(u * W, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(W * 0.32, H);
  ctx.closePath();
  const farG = ctx.createLinearGradient(0, ridgeY(0.75) - 30, 0, H * 0.75);
  farG.addColorStop(0, '#5CB632');
  farG.addColorStop(1, '#367A19');
  ctx.fillStyle = farG;
  ctx.fill();
  ctx.restore();

  // 主山脊（遮挡山后巨物下半身的关键前景草坡！）
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-4, ridgeY(0));
  const STEPS = 64;
  for (let i = 1; i <= STEPS; i++) {
    const u = i / STEPS;
    ctx.lineTo(u * W + (i === STEPS ? 4 : 0), ridgeY(u));
  }
  ctx.lineTo(W + 4, H + 4);
  ctx.lineTo(-4, H + 4);
  ctx.closePath();

  const topY = ridgeY(0.76);
  const hillGrad = ctx.createLinearGradient(W * 0.65, topY, W * 0.25, H);
  hillGrad.addColorStop(0.00, '#82D43C'); // 山脊迎光亮翠绿
  hillGrad.addColorStop(0.22, '#5BB329'); // 经典 XP 草坡中绿
  hillGrad.addColorStop(0.58, '#3B8919'); // 中景浓郁草绿
  hillGrad.addColorStop(1.00, '#1D520D'); // 近景深邃草坪（衬托底部字幕高对比度）
  ctx.fillStyle = hillGrad;
  ctx.fill();

  // 裁剪在草坡区域内画受光起伏带与精细草叶笔触
  ctx.clip();

  // 柔和阳光受光波带
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    const offY = (k + 1) * (IS_VERT ? 135 : 92);
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const wy = ridgeY(u) + offY + Math.sin(u * 5.2 + k * 1.7) * 18;
      if (i === 0) ctx.moveTo(0, wy);
      else ctx.lineTo(u * W, wy);
    }
    ctx.strokeStyle = k % 2 === 0 ? `rgba(164,238,85,${0.14 + 0.04 * pulse})` : 'rgba(18,58,8,0.14)';
    ctx.lineWidth = IS_VERT ? 38 : 28;
    ctx.stroke();
  }

  // 草坡微风细草簇（固定随机种子，随音乐微摆）
  const sway = Math.sin(t * 3.2) * 3.5;
  const tuftCount = IS_VERT ? 150 : 190;
  for (let i = 0; i < tuftCount; i++) {
    const u = hash(i * 11.3);
    const v = Math.pow(hash(i * 23.7), 0.85); // 0..1 down the slope
    const ry = ridgeY(u);
    const tx = u * W;
    const ty = ry + 12 + v * (H - ry - 40);
    const sc = lerp(0.55, 1.35, v);
    ctx.strokeStyle = (i % 3 === 0) ? 'rgba(172,242,96,0.38)' : 'rgba(24,72,12,0.32)';
    ctx.lineWidth = 2.0 * sc;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 4 * sc + sway * 0.5, ty - 11 * sc);
    ctx.moveTo(tx + 3 * sc, ty);
    ctx.lineTo(tx + 5 * sc + sway * 0.7, ty - 13 * sc);
    ctx.stroke();
  }
  ctx.restore();

  // 山脊线高光描边（增强山后巨物与山脊交界处的干净立体感）
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    if (i === 0) ctx.moveTo(0, ridgeY(0));
    else ctx.lineTo(u * W, ridgeY(u));
  }
  ctx.strokeStyle = 'rgba(186, 248, 108, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- 通用脚底锚定精灵绘制（含草地接触椭圆阴影）
function drawAnchoredSprite(ctx, sp, x, yFoot, targetH, sx, sy, maxW = W * 0.95, withShadow = true, liftY = 0) {
  const aspect = sp.w / sp.h;
  let baseH = targetH;
  if (baseH * aspect > maxW) baseH = maxW / aspect;
  const drawH = baseH * sy;
  const drawW = baseH * aspect * sx;

  if (withShadow) {
    ctx.save();
    const shScale = clamp(1 - liftY / 160, 0.45, 1.0);
    const rx = Math.max(18, drawW * 0.42 * shScale);
    const ry = Math.max(6, baseH * 0.065 * sx * shScale);
    const sg = ctx.createRadialGradient(x, yFoot + 3, 2, x, yFoot + 3, rx);
    sg.addColorStop(0, 'rgba(10, 34, 6, 0.58)');
    sg.addColorStop(0.65, 'rgba(14, 44, 8, 0.30)');
    sg.addColorStop(1, 'rgba(14, 44, 8, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(x, yFoot + 3, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    sp.img,
    sp.x, sp.y, sp.w, sp.h,
    x - drawW / 2, yFoot - liftY - drawH, drawW, drawH
  );
  ctx.restore();
}

// ---------------------------------------------------------------- 360° 真·四向三视图 Q 弹转圈绘制 (`dafeiyu-chibi-character-sheet.png`)
function drawTurnaroundSpinner(ctx, turnViews, x, yFoot, targetH, beatFloat, spinBeats = 4, hopPx = 0) {
  // 每 spinBeats 拍（默认 4 拍 = 1.846s，对标 chibi-squash-spin 1.92s/圈）完成 360° 丝滑旋转
  const angle = (((beatFloat / spinBeats) % 1) + 1) % 1; // 0..1 -> 0°..360°
  const quad = angle * 4; // 0..4: 0=front, 1=side_l, 2=back, 3=side_r
  const idx = Math.round(quad) % 4;
  const order = ['front', 'side_l', 'back', 'side_r'];
  const sp = turnViews[order[idx]];

  // 象限交界处（±0.5 处，即 45°/135°/225°/315°）做轻度球面透视收窄 (0.74..1.00)，消除切图跳变且绝不压成细线！
  const distToSwitch = Math.abs((quad - Math.round(quad))); // 0 at view center, 0.5 at handoff
  const turnPerspectiveX = 1.0 - 0.26 * Math.pow(distToSwitch / 0.5, 1.5);

  const q = qtanMochi(beatFloat, { minSy: 0.52, maxSx: 1.48, stretchSy: 1.08, stretchSx: 0.94, hopPx });
  drawAnchoredSprite(ctx, sp, x, yFoot, targetH, q.sx * turnPerspectiveX, q.sy, W * 0.65, true, q.liftY);
}

// ---------------------------------------------------------------- 前景草坡「39表情包」列队编舞引擎
function getChoreoOffset(idx, total, beatFloat, sec) {
  // 根据小节切换编舞阵型（Math.max(0, beatFloat) 保证开场前 8 拍必定是 100% 全员同拍齐压原味名场面！）
  const bar4 = Math.floor(Math.max(0, beatFloat) / 8); // 每 2 小节 (8 拍 ≈ 3.69s) 切一次编舞花样
  if (sec === 0) {
    return (bar4 % 2 === 0) ? 0 : -idx * 0.085;
  } else if (sec === 1) {
    const m = bar4 % 3;
    if (m === 0) return 0;
    if (m === 1) return -idx * 0.09;
    return (idx % 2) * 0.5;
  } else if (sec === 2) {
    return (bar4 % 2 === 0) ? (idx % 2) * 0.5 : -(total - 1 - idx) * 0.085;
  } else {
    // 副歌高潮：每 8 拍在「全员齐跳压弹」与「双向对冲人浪」间切换
    const center = (total - 1) / 2;
    return (bar4 % 2 === 0) ? 0 : -Math.abs(idx - center) * 0.09;
  }
}

function drawMultiStickerSquad(ctx, t, beatFloat, sec, assets) {
  const stickers = assets.stickers; // 39 items in STICKER_POSE_CATALOG_39 order

  // 决定当前登场的表情包波次，确保全片 39 张表情包 100% 全部清晰登场！
  // Wave 0: [0..12], Wave 1: [13..25], Wave 2: [26..38]
  let waveIdx = 0;
  if (MODE === 'ref-dj') {
    waveIdx = Math.floor(t / 5.2) % 3; // 15.7s 内三波 13×3=39 全员轮番亮相！
  } else if (sec === 0) {
    waveIdx = 0; // 0..12 (13枚)
  } else if (sec === 1) {
    waveIdx = 1; // 13..25 (13枚)
  } else if (sec === 2) {
    waveIdx = 2; // 26..38 (13枚)
  }

  const isChorus = (sec === 3) || (MODE === 'ref-dj' && t >= 8.60);
  const hopBase = isChorus ? (IS_VERT ? 26 : 20) : 0;

  if (!IS_VERT) {
    // ==================== 横屏 16:9：1:1 复刻参考视频斜向山脊透视大列队 ====================
    if (!isChorus) {
      // 单排 13 枚表情包沿左低右高山脊透视排开 + 右前景 C 位 360° 四向弹转本鲸！
      const wave = stickers.slice(waveIdx * 13, waveIdx * 13 + 13);
      for (let i = 0; i < wave.length; i++) {
        const u = lerp(0.055, 0.855, i / (wave.length - 1));
        const persp = lerp(0.52, 1.05, Math.pow(i / (wave.length - 1), 0.85));
        const x = u * W;
        const yFoot = ridgeY(u) + lerp(28, 66, persp - 0.45);
        const h = 186 * persp;
        const phOff = getChoreoOffset(i, wave.length, beatFloat, sec);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.50 });
        drawAnchoredSprite(ctx, wave[i], x, yFoot, h, q.sx, q.sy, 320, true, q.liftY);
      }
      // 右侧前景领舞位 (u=0.93) 放置 360° 真·三视图旋转 Q 弹本鲸（Section 2 时移至画面黄金 C 位放大领舞！）
      const spinU = (sec === 2) ? 0.52 : 0.93;
      const spinY = (sec === 2) ? ridgeY(spinU) + 150 : ridgeY(spinU) + 56;
      const spinH = (sec === 2) ? 310 : 228;
      drawTurnaroundSpinner(ctx, assets.turnViews, spinU * W, spinY, spinH, beatFloat, 4, sec === 2 ? 18 : 0);
    } else {
      // 副歌高潮（或 DJ 精华版后半）：双排 26 枚表情包漫山遍野同步 Q 弹 + 前景正中 360° 弹转领舞！
      const shift = (Math.floor(beatFloat / 8) * 13) % 39;
      const backRow = Array.from({ length: 13 }, (_, k) => stickers[(shift + k) % 39]);
      const frontRow = Array.from({ length: 13 }, (_, k) => stickers[(shift + 13 + k) % 39]);

      // 后排沿山脊线 (13 枚)
      for (let i = 0; i < 13; i++) {
        const u = lerp(0.05, 0.95, i / 12);
        const persp = lerp(0.52, 0.92, i / 12);
        const phOff = getChoreoOffset(i, 13, beatFloat, 3);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.50, hopPx: (i % 2 === 0) ? hopBase : 0 });
        drawAnchoredSprite(ctx, backRow[i], u * W, ridgeY(u) + 22, 172 * persp, q.sx, q.sy, 280, true, q.liftY);
      }
      // 前排沿中景草坪错位排开 (13 枚)
      for (let i = 0; i < 13; i++) {
        const u = lerp(0.07, 0.93, i / 12);
        const persp = lerp(0.68, 1.08, i / 12);
        const phOff = getChoreoOffset(i, 13, beatFloat + 0.06, 3);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.50, hopPx: (i % 2 === 1) ? hopBase : 0 });
        drawAnchoredSprite(ctx, frontRow[i], u * W, ridgeY(u) + 148, 198 * persp, q.sx, q.sy, 320, true, q.liftY);
      }
      // 黄金前景领舞 360° 弹转本鲸
      drawTurnaroundSpinner(ctx, assets.turnViews, W * 0.50, ridgeY(0.50) + 250, 275, beatFloat, 4, 24);
    }
  } else {
    // ==================== 竖屏 9:16 (1080×1920)：三层错落梯田透视列队（手机端颗颗超清！） ====================
    if (!isChorus) {
      const wave = stickers.slice(waveIdx * 13, waveIdx * 13 + 13);
      // Tier 1: 山脊上沿 5 枚 (wave[0..4])
      for (let i = 0; i < 5; i++) {
        const u = lerp(0.11, 0.89, i / 4);
        const phOff = getChoreoOffset(i, 13, beatFloat, sec);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48 });
        drawAnchoredSprite(ctx, wave[i], u * W, ridgeY(u) + 32, 176, q.sx, q.sy, 250, true, q.liftY);
      }
      // Tier 2: 中坡草坪错位 5 枚 (wave[5..9])
      for (let i = 0; i < 5; i++) {
        const u = lerp(0.13, 0.87, i / 4);
        const phOff = getChoreoOffset(5 + i, 13, beatFloat, sec);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48 });
        drawAnchoredSprite(ctx, wave[5 + i], u * W, ridgeY(u) + 215, 210, q.sx, q.sy, 280, true, q.liftY);
      }
      // Tier 3: 前景大草坪 3 枚表情包 (左/中左/右) + 黄金 C 位 360° 四向弹转本鲸！
      const frontSlots = [
        { u: 0.16, sp: wave[10], idx: 10 },
        { u: 0.38, sp: wave[11], idx: 11 },
        { u: 0.84, sp: wave[12], idx: 12 }
      ];
      for (const sl of frontSlots) {
        const phOff = getChoreoOffset(sl.idx, 13, beatFloat, sec);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48 });
        drawAnchoredSprite(ctx, sl.sp, sl.u * W, ridgeY(sl.u) + 415, 236, q.sx, q.sy, 310, true, q.liftY);
      }
      // 360° 四向旋转 Q 弹领舞本鲸 (u=0.62，Section 2 时放大至 320px 站正中！)
      const spinU = (sec === 2) ? 0.52 : 0.62;
      const spinH = (sec === 2) ? 315 : 268;
      drawTurnaroundSpinner(ctx, assets.turnViews, spinU * W, ridgeY(spinU) + 435, spinH, beatFloat, 4, sec === 2 ? 22 : 0);
    } else {
      // 竖屏副歌狂欢：3 排共 19 枚表情包同屏轮换全 39 枚 + 正中 360° 弹转领舞 = 20+2=22 只角色同屏 Q 弹！
      const shift = (Math.floor(beatFloat / 8) * 13) % 39;
      const pick = (k) => stickers[(shift + k) % 39];

      // Row 1 (山脊 7 枚)
      for (let i = 0; i < 7; i++) {
        const u = lerp(0.08, 0.92, i / 6);
        const phOff = getChoreoOffset(i, 19, beatFloat, 3);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48, hopPx: (i % 2 === 0) ? hopBase : 0 });
        drawAnchoredSprite(ctx, pick(i), u * W, ridgeY(u) + 26, 152, q.sx, q.sy, 220, true, q.liftY);
      }
      // Row 2 (中坡 7 枚)
      for (let i = 0; i < 7; i++) {
        const u = lerp(0.10, 0.90, i / 6);
        const phOff = getChoreoOffset(7 + i, 19, beatFloat + 0.05, 3);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48, hopPx: (i % 2 === 1) ? hopBase : 0 });
        drawAnchoredSprite(ctx, pick(7 + i), u * W, ridgeY(u) + 195, 184, q.sx, q.sy, 250, true, q.liftY);
      }
      // Row 3 (近景左右各 2 枚 + 正中 360° 弹转领舞)
      const nearUs = [0.13, 0.31, 0.69, 0.87];
      for (let i = 0; i < 4; i++) {
        const u = nearUs[i];
        const phOff = getChoreoOffset(14 + i, 19, beatFloat + 0.10, 3);
        const q = qtanMochi(beatFloat + phOff, { minSy: 0.50, maxSx: 1.48, hopPx: hopBase * 0.8 });
        drawAnchoredSprite(ctx, pick(14 + i), u * W, ridgeY(u) + 395, 218, q.sx, q.sy, 285, true, q.liftY);
      }
      drawTurnaroundSpinner(ctx, assets.turnViews, W * 0.50, ridgeY(0.50) + 430, 288, beatFloat, 4, 28);
    }
  }
}

// ---------------------------------------------------------------- 氛围花瓣与欢庆音符粒子（纯环境氛围，绝不遮脸或污染角色设定）
function drawAmbientParticles(ctx, t, beatFloat, sec) {
  const abs = t + FROM;
  // Section 1: 「覆水不能再收回 / 桃花谢了有玫瑰」漫天桃花瓣与玫瑰花瓣飘落
  if (sec === 1) {
    const isRose = (MODE === 'ref-dj') ? true : (abs >= 41.95);
    const count = 28;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const px = ((hash(i * 5.7) * W + t * (48 + hash(i) * 36) + Math.sin(t * 2 + i) * 32) % (W + 80)) - 40;
      const py = ((hash(i * 13.1) * H * 0.85 + t * (75 + hash(i * 2.3) * 55)) % (H * 0.85));
      const rot = t * (1.4 + hash(i * 9.1)) + i;
      const sz = (IS_VERT ? 11 : 10) + hash(i * 4.3) * 8;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.fillStyle = isRose
        ? (i % 2 === 0 ? 'rgba(230, 38, 76, 0.82)' : 'rgba(255, 92, 128, 0.78)')
        : (i % 2 === 0 ? 'rgba(255, 168, 198, 0.85)' : 'rgba(255, 212, 228, 0.82)');
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz * 0.62, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // Section 3 (副歌)：草坡两侧升起欢快金色音符与手绘四角星芒（避免字体缺字方框）
  if (sec === 3) {
    const notes = ['♪', '♫'];
    for (let i = 0; i < 16; i++) {
      const life = ((t * 0.55 + hash(i * 19.3)) % 1);
      const u = (i % 2 === 0) ? lerp(0.05, 0.25, hash(i * 3.7)) : lerp(0.75, 0.95, hash(i * 3.7));
      const nx = u * W + Math.sin(t * 3 + i) * 18;
      const ny = ridgeY(u) - life * (IS_VERT ? 360 : 250);
      ctx.save();
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.82;
      if (i % 3 === 2) {
        // 手绘璀璨四角星
        const sr = IS_VERT ? 14 : 12;
        ctx.translate(nx, ny);
        ctx.fillStyle = '#FFE169';
        ctx.strokeStyle = '#091322';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4;
          const rad = k % 2 === 0 ? sr : sr * 0.36;
          if (k === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      } else {
        strokeFillText(ctx, notes[i % 2], nx, ny, IS_VERT ? 34 : 28,
          i % 2 === 0 ? '#FFE169' : '#FFFFFF', { sw: 5 });
      }
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- 顶部钩子大字（0–2.6s 第0帧直出）与复古《邦友的酒》致敬角标
function drawHookAndBadge(ctx, t, beatFloat, sec) {
  const pulse = Math.exp(-(((beatFloat % 1) + 1) % 1) * 5.0);

  // 1. 0–2.6s 开场黄金钩子（第 0 帧 alpha=1.0 直接清晰呈现，首帧即封面！）
  if (HOOK_TEXT && HOOK_TEXT !== '-' && t < HOOK_DUR) {
    const fadeOut = clamp((HOOK_DUR - t) / 0.30);
    const popScale = 1.0 + Math.exp(-t * 10.0) * 0.12 + pulse * 0.035;
    const lines = HOOK_TEXT.split(/\n|\|/);
    ctx.save();
    ctx.globalAlpha = fadeOut;
    if (IS_VERT) {
      ctx.translate(W * 0.5, H * 0.112);
      ctx.scale(popScale, popScale);
      ctx.rotate(-0.025);
      lines.forEach((ln, idx) => {
        const y = (idx - (lines.length - 1) / 2) * 108;
        strokeFillText(ctx, ln, 0, y, 88, idx === 0 ? '#FFE14D' : '#FFFFFF', {
          sw: 18, strokeColor: '#0A192F', shadow: true, sx: 6, sy: 8
        });
      });
    } else {
      // 横屏放在左上角蓝天留白处，不挡右侧巨物本鲸！
      ctx.translate(W * 0.27, H * 0.22);
      ctx.scale(popScale, popScale);
      ctx.rotate(-0.02);
      lines.forEach((ln, idx) => {
        const y = (idx - (lines.length - 1) / 2) * 96;
        strokeFillText(ctx, ln, 0, y, 78, idx === 0 ? '#FFE14D' : '#FFFFFF', {
          sw: 16, strokeColor: '#0A192F', shadow: true, sx: 5, sy: 7
        });
      });
    }
    ctx.restore();
    return;
  }

  // 2. 2.6s 之后：切入致敬《邦友的酒(DJ版)》原片左上角斜体粗描边歌名牌 + 表情包波次计数牌！
  const inAlpha = clamp((t - HOOK_DUR) / 0.25);
  ctx.save();
  ctx.globalAlpha = inAlpha;

  const waveLabel = (sec === 0) ? '表情包 01–13/39'
    : (sec === 1) ? '表情包 14–26/39'
    : (sec === 2) ? '表情包 27–39/39'
    : '全员 39 表情包大合唱';

  if (!IS_VERT) {
    // 横屏 16:9：完全复刻参考视频 t_1.0.png 左上角经典斜体白字黑边排版！
    const bx = 305, by = 118;
    const sc = 1 + pulse * 0.025;
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(sc, sc);
    strokeFillText(ctx, '《朋友的酒(Q弹版)》', 0, 0, 56, '#FFFFFF', {
      italic: true, sw: 12, strokeColor: '#091322', shadow: true
    });
    strokeFillText(ctx, `本鲸领衔 · ${waveLabel}`, 0, 62, 28, '#FFF3B0', {
      sw: 7, strokeColor: '#091322', shadow: true
    });
    ctx.restore();
  } else {
    // 竖屏 9:16：顶部居中偏上安全区（避开抖音状态栏）
    const bx = W * 0.5, by = 165;
    const sc = 1 + pulse * 0.025;
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(sc, sc);
    strokeFillText(ctx, '《朋友的酒 · Q弹版》', 0, 0, 58, '#FFFFFF', {
      italic: true, sw: 13, strokeColor: '#091322', shadow: true
    });
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 字幕绘制（已按要求移除顶部计数与底部类水印文字）
function drawSubtitlesAndWatermark(ctx, t) {
  const refT = MODE === 'ref-dj' ? t : (t + FROM);
  const ly = LYRICS.find((l) => refT >= l.t0 && refT < l.t1);
  if (ly) {
    const vis = clamp((refT - ly.t0) / 0.14) * clamp((ly.t1 - refT) / 0.14);
    if (vis > 0.02) {
      const lines = SUB.wrap(ly.text, SUB_MAX_W, 28, 800);
      ctx.save();
      ctx.scale(SUB_K, SUB_K);
      const subH = IS_VERT ? (H - 135) / SUB_K : (H - 36) / SUB_K;
      SUB.draw(ctx, { lines, speaker: ly.speaker || '本鲸', vis, W: W / SUB_K, H: subH });
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- 单帧主渲染管线
function renderFrame(ctx, t, assets) {
  // beatFloat 正整数点精准对齐音频底鼓正拍！
  const beatFloat = (t - BEAT_PHASE_0) / BEAT;
  const sec = getSection(t);

  // Plane 1: Windows XP 晴空积云 + 彩虹/花瓣/阳光天象
  drawSkyAndAtmosphere(ctx, t, beatFloat, sec);

  // Plane 2: 山脊后方巨物本鲸（+ 副歌 Q 版大小姐同框）—— 先画，让绿草坡自然遮挡下半身！
  drawBehindHillGiants(ctx, t, beatFloat, sec, assets);

  // Plane 3: 经典弧形翠绿山坡与草丛肌理
  drawGrassHill(ctx, t, beatFloat);

  // Plane 4: 前景草坡 39 表情包透视列队 + 360° 真·四向三视图旋转 Q 弹本鲸
  drawMultiStickerSquad(ctx, t, beatFloat, sec, assets);

  // Plane 5: 花瓣 / 副歌音符粒子
  drawAmbientParticles(ctx, t, beatFloat, sec);

  // Plane 6: 开场大字钩子 / 《邦友的酒》致敬歌名角标 + 项目统一 Day2 风格字幕 + 合规水印
  drawHookAndBadge(ctx, t, beatFloat, sec);
  drawSubtitlesAndWatermark(ctx, t);
}

// ---------------------------------------------------------------- 素材加载与真实 Alpha BBox 测量（带磁盘缓存加速）
const BBOX_CACHE_FILE = '/tmp/mv_qtan_bbox_cache_v2.json';
let BBOX_CACHE = {};
try {
  if (fs.existsSync(BBOX_CACHE_FILE)) BBOX_CACHE = JSON.parse(fs.readFileSync(BBOX_CACHE_FILE, 'utf8'));
} catch { BBOX_CACHE = {}; }

function saveBboxCache() {
  try { fs.writeFileSync(BBOX_CACHE_FILE, JSON.stringify(BBOX_CACHE)); } catch { /* ignore */ }
}

async function loadMeasuredSprite(filePath) {
  const img = await loadImage(filePath);
  const st = fs.statSync(filePath);
  const key = `${filePath}:${st.mtimeMs}:${img.width}x${img.height}`;
  if (BBOX_CACHE[key]) {
    const b = BBOX_CACHE[key];
    return { img, x: b.x, y: b.y, w: b.w, h: b.h, filePath };
  }
  const cv = createCanvas(img.width, img.height);
  const cx = cv.getContext('2d');
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (d[(y * cv.width + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) throw new Error(`空透明图像: ${filePath}`);
  const box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  BBOX_CACHE[key] = box;
  return { img, ...box, filePath };
}

async function loadAllAssets() {
  // 1. 加载并逐张核验全部 39 张 DSH 鲸鱼娘表情包
  const dshDir = path.join(REPO, 'tools/day2制作/video-fx源码快照/day2_poses');
  const stickers = [];
  for (const id of STICKER_POSE_CATALOG_39) {
    const p = path.join(dshDir, `dsh-whale-state-${id}.webp`);
    if (!fs.existsSync(p)) throw new Error(`缺失 DSH 表情包: ${p}`);
    const sp = await loadMeasuredSprite(p);
    sp.id = id;
    stickers.push(sp);
  }

  // 2. 加载山后巨物本鲸已去背高清精灵 (whale_*.png)
  const whaleDir = path.join(HERE, 'whale_girl_src');
  const giants = {};
  for (const k of GIANT_POSE_KEYS) {
    const p = path.join(whaleDir, `whale_${k}.png`);
    if (fs.existsSync(p)) giants[k] = await loadMeasuredSprite(p);
  }
  if (!giants.cheer) throw new Error('缺失 whale_cheer.png');

  // 3. 加载四向 Q 版三视图转身精灵 (chibi_turnaround/turn_*.png)
  const turnDir = path.join(whaleDir, 'chibi_turnaround');
  const turnViews = {};
  for (const k of ['front', 'side_l', 'back', 'side_r']) {
    const p = path.join(turnDir, `turn_${k}.png`);
    if (!fs.existsSync(p)) throw new Error(`缺失三视图转身精灵: ${p}`);
    turnViews[k] = await loadMeasuredSprite(p);
  }

  // 4. 加载副歌客串 Q 版 Claude 大小姐贴纸
  const claudeDir = path.join(HERE, 'claude_src/chibi');
  const claude = [];
  for (const k of CLAUDE_CHIBI_KEYS) {
    const p = path.join(claudeDir, `pose_${k}.png`);
    if (fs.existsSync(p)) claude.push(await loadMeasuredSprite(p));
  }

  saveBboxCache();
  console.log(
    `✓ 素材核验通过：DSH表情包 ${stickers.length}/39 张 | 巨物本鲸姿势 ${Object.keys(giants).length} 张 | ` +
    `Q版四向三视图 4/4 张 | Q版大小姐客串 ${claude.length} 张`
  );
  return { stickers, giants, turnViews, claude };
}

// ---------------------------------------------------------------- 主程序入口
async function main() {
  const assets = await loadAllAssets();

  const times = argOf('--times');
  if (times) {
    const dir = argOf('--stills-dir', path.join('/tmp/mv_qtan_v2_stills', IS_VERT ? 'vert' : 'horiz'));
    fs.mkdirSync(dir, { recursive: true });
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    for (const t of times.split(',').map(Number)) {
      ctx.clearRect(0, 0, W, H);
      renderFrame(ctx, t, assets);
      const f = path.join(dir, `t_${t.toFixed(2)}.png`);
      fs.writeFileSync(f, canvas.toBuffer('image/png'));
      console.log('still ->', f);
    }
    return;
  }

  if (!fs.existsSync(AUDIO)) {
    throw new Error(`找不到音频 ${AUDIO}；请通过 --audio 指定音频路径`);
  }

  const totalFrames = Math.round(LIMIT * FPS);
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });

  const ff = spawn(ffmpeg, [
    '-y',
    '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-ss', String(FROM), '-t', String(LIMIT), '-i', AUDIO,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2',
    '-c:v', 'libx264', '-preset', 'medium',
    '-crf', String(argOf('--crf', '24')),
    '-maxrate', '5000k', '-bufsize', '10000k',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-t', String(LIMIT),
    OUT
  ], { stdio: ['pipe', 'ignore', 'pipe'] });

  let err = '';
  ff.stderr.on('data', (d) => { err += d.toString(); });
  ff.on('error', (e) => { err += `\n[spawn] ${e.message}`; });

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const tStart = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    ctx.clearRect(0, 0, W, H);
    renderFrame(ctx, f / FPS, assets);
    const raw = canvas.data();
    const ok = ff.stdin.write(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 90 === 0 || f === totalFrames - 1) {
      const el = (Date.now() - tStart) / 1000;
      process.stdout.write(
        `\r  [${ASPECT}] frame ${f + 1}/${totalFrames} (${(((f + 1) / totalFrames) * 100).toFixed(0)}%) ` +
        `${((f + 1) / Math.max(0.1, el)).toFixed(1)} fps`
      );
    }
  }
  process.stdout.write('\n');
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) {
    console.error(err.split('\n').slice(-16).join('\n'));
    throw new Error(`ffmpeg 渲染失败 (exit ${code})`);
  }
  console.log(`✓ 成片输出: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB)`);
}

await main();
