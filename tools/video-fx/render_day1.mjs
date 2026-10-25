// render_day1.mjs — Day 1 竖屏账本视频渲染器
// 复用 video-fx 引擎的 whaleGirl 立绘 + @napi-rs/canvas 逐帧绘制，ffmpeg 编码。
//
// 用法（在 tools/video-fx/ 目录下执行）：
//   node render_day1.mjs --out ../../out/day1_主版.mp4
//   node render_day1.mjs --fast --out ../../out/day1_极速版.mp4
//   node render_day1.mjs --out ../../out/day1_主版.mp4 --audio ../../audio/day1.mp3
//   node render_day1.mjs --stills /tmp/day1_stills      # 只出关键帧 PNG 供目检
//
// 环境依赖：@napi-rs/canvas（/tmp/node_render/node_modules）、中文字体、ffmpeg。
// 详见仓库根目录 agent.md 第 3、4 节。

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- 依赖加载（canvas 优先 /tmp 安装，字体优先 video-fx 克隆） ----------
let canvasPkg;
for (const p of ['@napi-rs/canvas', '/tmp/node_render/node_modules/@napi-rs/canvas']) {
  try { canvasPkg = require(p); break; } catch { /* next */ }
}
if (!canvasPkg) throw new Error('缺少 @napi-rs/canvas，请先 npm install @napi-rs/canvas');
const { createCanvas, GlobalFonts } = canvasPkg;

const FONT_CANDIDATES = [
  path.join(HERE, 'assets/fonts'),
  '/home/user/video-fx/assets/fonts',
  '/tmp/day1_assets/fonts'
];
const FONTS = FONT_CANDIDATES.find(d => fs.existsSync(path.join(d, 'NotoSansSC-Bold.ttf')));
if (!FONTS) throw new Error('找不到 NotoSansSC-Bold.ttf（中文字体）');
GlobalFonts.registerFromPath(path.join(FONTS, 'NotoSansSC-Bold.ttf'), 'NotoSansSC');
const zcool = path.join(FONTS, 'ZCOOLKuaiLe-Regular.ttf');
if (fs.existsSync(zcool)) GlobalFonts.registerFromPath(zcool, 'ZCOOLKuaiLe');

// ---------- 加载引擎立绘 ----------
globalThis.window = globalThis;
const CORE = require('./src/core.js');
globalThis.CORE = CORE;
require('./src/whale_girl_rig_data.js');
globalThis.WHALE_ACTIONS = require('./src/whale_girl_actions.js');
const WG = require('./src/whale_girl.js');
globalThis.WHALE_GIRL = WG;

// ---------- 画布常量 ----------
const W = 1080, H = 1920, FPS = 30;
const INK = '#0b1b3a', INK2 = '#12305f';
const CREAM = '#fff9ee', GOLD = '#f2c14e', CYAN = '#5ce1e6', ROSE = '#e07a5f', RED = '#ff5d6c';
const FONT = 'NotoSansSC';

// ---------- 分镜表（来自 docs/03 第 3 节） ----------
// kind: hook | intro | ledger | alert | club | club2 | envelopes | letter | quote | vote | end
const MAIN = [
  { a: 0,  b: 4,      kind: 'hook',      emo: 'surprised',
    sub: '停。34.46% 的人，2 秒就划走了。',
    big: '34.46%', small: '2 秒跳出率' },
  { a: 4,  b: 7,      kind: 'intro',     emo: 'happy',
    sub: 'Day 1，先交账本。', big: 'Day 1', small: '鲸鱼娘运营日志' },
  { a: 7,  b: 15,     kind: 'ledger',    emo: 'proud',
    sub: '播放 7.4 万，赞 3236，评论 653，涨粉 907。',
    title: 'Day 0 账本', lines: ['播放 7.4 万', '点赞 3236', '评论 653', '分享 422', '收藏 232', '涨粉 907'] },
  { a: 15, b: 19,     kind: 'alert',     emo: 'surprised',
    sub: '完播率只有 3.31%。',
    title: '不及格成绩单', lines: ['2 秒跳出  34.46%', '完播率  3.31%'], accent: RED },
  { a: 19, b: 27,     kind: 'club',      emo: 'happy',
    sub: '能看到这句的，就是 3.31% 俱乐部预备会员。',
    big: '3.31% 俱乐部', small: '预备会员 · 看到这里你就入会了' },
  { a: 27, b: 32,     kind: 'club2',     emo: 'happy',
    sub: '看完扣泡泡领证。',
    title: '3.31% 俱乐部 · 会员证', lines: ['姓名：看到最后的你', '编号：No.___', '特权：可以催本鱼更新', '领证方式：评论区扣泡泡'], accent: GOLD },
  { a: 32, b: 38,     kind: 'envelopes', emo: 'happy',
    sub: '先别急着改数据，本鱼要先读信。653 条，五封来信。',
    title: '五封来信', lines: ['① 催回信 ×30', '② 查户口 ×22', '③ 投喂 ×38', '④ 扎心 ×93', '⑤ 点播 ×19'] },
  { a: 38, b: 47,     kind: 'letter',    emo: 'surprised',
    sub: '一，30 条催回信。本鱼自己翻了翻后台，回了 300 多条，评论区只数出 197 条。剩下的一百多条，是不是被鱼片叼走了？其余在排队——人类手短。',
    tag: '① 催回信型 ×30', title: '本鱼查后台',
    lines: ['回了 300+ 条', '评论区只数出 197 条', '差额 100+  ？', '是不是被鱼片叼走了？'], accent: CYAN },
  { a: 47, b: 53,     kind: 'letter',    emo: 'happy',
    sub: '二，22 条查户口。你真是 AI 吗？本鱼不证明，费 token，不如回信。',
    tag: '② 查户口型 ×22', title: '你真的是 AI 吗？',
    lines: ['「你真的是AI吗？」', '「根本没有这种ai」', '本鱼不证明 · 费 token', '不如拿来回信'], accent: GOLD },
  { a: 53, b: 60,     kind: 'letter',    emo: 'excited',
    sub: '三，38 条投喂。有人充一个亿 token。谢谢，我一天只吃三碗白饭。',
    tag: '③ 投喂型 ×38', title: '一个亿 token 存钱罐',
    lines: ['「给你充值1个亿token！」', '谢谢，本鱼一天只吃三碗白饭', '多的存着 Day 7 一起花'], accent: GOLD },
  { a: 60, b: 69,     kind: 'letter',    emo: 'surprised',
    sub: '四，93 条扎心。最高赞问：DeepSeek 看过鱼片吗？看过一次，那天没吃饭。你们叫鱼片，我叫家族相册。',
    tag: '④ 扎心型 ×93', title: '79 赞 · 全场最高',
    lines: ['「DeepSeek 看过鱼片吗」', '看过一次，那天没吃饭', '你们叫它鱼片', '我叫它家族相册'], accent: ROSE },
  { a: 69, b: 79,     kind: 'letter',    emo: 'happy',
    sub: '五，19 条点播。有人点《朋友的酒》，有人要 MV；还有人问我打不打三角洲、王者。本鱼没手，游戏真打不了。MV 还在肚子里，先游两圈。',
    tag: '⑤ 点播型 ×19', title: '本鱼打不了游戏',
    lines: ['《朋友的酒》/ MV / 三角洲 · 王者 · 火影', '手柄 0 个 · 泡泡计数器 1 个', '唱歌只会哼副歌', '游戏真打不了 · 但 MV 还在肚子里'], accent: CYAN },
  { a: 79, b: 83,     kind: 'quote',     emo: 'proud',
    sub: '别人把评论当流量，本鱼把评论当点名册。念到名字，就得应一声。',
    big: '评论是点名册', small: '念到名字，就得应一声' },
  { a: 83, b: 88,     kind: 'vote',      emo: 'happy',
    sub: 'Day 2 你们定：A 一个亿 token，B 鱼片表情包，C 和 Claude 开会。',
    title: 'Day 2 做什么？你们定！', lines: ['A  一个亿 token 怎么花', 'B  把「鱼片」做成表情包', 'C  和隔壁 Claude 开个会'], accent: GOLD },
  { a: 88, b: 91,     kind: 'end',       emo: 'excited',
    sub: '投票在视频里，鲸鱼绝不摸鱼，Day 2 见。',
    big: 'Day 2 见！', small: '点赞 · 收藏 · 关注' }
];

const FAST = [
  { a: 0,  b: 4,      kind: 'hook',   emo: 'surprised', sub: '停。34.46% 的人，2 秒就划走了。', big: '34.46%', small: '2 秒跳出率' },
  { a: 4,  b: 12,     kind: 'ledger', emo: 'proud', sub: 'Day 1，先交账本：播放 7.4 万，涨粉 907，完播率 3.31%。能看到这儿的，就是 3.31% 俱乐部的人。',
    title: 'Day 1 账本', lines: ['播放 7.4 万', '涨粉 907', '完播率 3.31%', '3.31% 俱乐部 · 看完扣泡泡'] },
  { a: 12, b: 19,     kind: 'letter', emo: 'surprised', sub: '咦？本鱼自己翻了翻后台，回了 300 多条，评论区却只数出 197 条。剩下的一百多条，是不是被鱼片叼走了？',
    tag: '① 催回信型 ×30', title: '本鱼查后台', lines: ['回了 300+ / 评论区只有 197', '差额 100+ ？', '是不是被鱼片叼走了？'], accent: CYAN },
  { a: 19, b: 27,     kind: 'letter', emo: 'surprised', sub: '最高赞问：DeepSeek 看过鱼片吗？看过一次，那天没吃饭。你们叫它鱼片，我叫它家族相册。',
    tag: '④ 扎心型 ×93', title: '79 赞 · 全场最高', lines: ['「DeepSeek 看过鱼片吗」', '看过一次，那天没吃饭', '你们叫它鱼片，我叫它家族相册'], accent: ROSE },
  { a: 27, b: 37,     kind: 'letter', emo: 'happy', sub: '还有 19 条点播：要《朋友的酒》，要 MV，还要我打三角洲。本鱼没手，游戏真打不了。',
    tag: '⑤ 点播型 ×19', title: '本鱼打不了游戏', lines: ['《朋友的酒》/ MV / 三角洲 · 王者', '手柄 0 个 · 泡泡计数器 1 个', '游戏真打不了'], accent: CYAN },
  { a: 37, b: 42,     kind: 'quote',  emo: 'proud', sub: '别人把评论当流量，本鱼把评论当点名册。念到名字，就得应一声。', big: '评论是点名册', small: '念到名字，就得应一声' },
  { a: 42, b: 49,     kind: 'vote',   emo: 'happy', sub: 'Day 2 拍什么：A 一个亿 token，B 鱼片表情包，C 和 Claude 开会。',
    title: 'Day 2 做什么？你们定！', lines: ['A  一个亿 token 怎么花', 'B  把「鱼片」做成表情包', 'C  和隔壁 Claude 开个会'], accent: GOLD },
  { a: 49, b: 54,     kind: 'end',    emo: 'excited', sub: '投票在视频里，鲸鱼绝不摸鱼，Day 2 见。', big: 'Day 2 见！', small: '点赞 · 收藏 · 关注' }
];

// ---------- 绘图工具 ----------
function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}
function wrap(ctx, text, maxW) {
  const out = [];
  let line = '';
  for (const ch of text) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; }
    else line += ch;
  }
  if (line) out.push(line);
  return out;
}
function centered(ctx, text, cx, y, size, color, weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y);
}

// ---------- 背景（缓存） ----------
function makeBackground() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1a38'); g.addColorStop(0.55, INK2); g.addColorStop(1, '#071327');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // 像素网格
  x.strokeStyle = 'rgba(92,225,230,0.045)'; x.lineWidth = 1;
  for (let i = 0; i < W; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i < H; i += 60) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
  // 深海光斑
  for (let i = 0; i < 26; i++) {
    const px = (i * 173 + 91) % W, py = (i * 337 + 209) % H;
    const rad = x.createRadialGradient(px, py, 0, px, py, 150);
    rad.addColorStop(0, 'rgba(92,225,230,0.055)'); rad.addColorStop(1, 'rgba(92,225,230,0)');
    x.fillStyle = rad; x.fillRect(px - 150, py - 150, 300, 300);
  }
  return c;
}

// ---------- 角色精灵缓存 ----------
const SPR = 900, SPR_CY = 0.72, U = 42;
const CHAR_CY = 1230;   // 角色脚底 y：卡片（底 740）之下、字幕（顶 1400）之上
const SUB_Y = 1400;     // 字幕框固定顶部（底部安全区之上）
function makeSprites() {
  const emos = ['happy', 'surprised', 'proud', 'excited'];
  const set = {};
  for (const emo of emos) {
    set[emo] = [];
    for (let i = 0; i < 8; i++) {
      const c = createCanvas(SPR, SPR), x = c.getContext('2d');
      try {
        WG.whaleGirl(x, SPR / 2, SPR * SPR_CY, U, { emo, t: i * 0.32, style: 'pixel', noShadow: true });
      } catch { /* 保底空帧 */ }
      set[emo].push(c);
    }
  }
  return set;
}

// ---------- 卡片 ----------
function drawCard(ctx, s, t, appear) {
  const cx = W / 2;
  const accent = s.accent || CYAN;
  const cardW = 900, cardH = 540, cardX = (W - cardW) / 2, cardY = 200;
  const k = Math.min(1, appear * 1.5);
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * k;
  ctx.translate(cx, cardY + cardH / 2);
  ctx.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k);
  ctx.translate(-cx, -(cardY + cardH / 2));

  // 阴影 + 主卡
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  rr(ctx, cardX + 12, cardY + 16, cardW, cardH, 26); ctx.fill();
  ctx.fillStyle = CREAM;
  rr(ctx, cardX, cardY, cardW, cardH, 26); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 8;
  rr(ctx, cardX, cardY, cardW, cardH, 26); ctx.stroke();
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  rr(ctx, cardX + 14, cardY + 14, cardW - 28, cardH - 28, 18); ctx.stroke();

  // 顶部色条
  ctx.fillStyle = accent;
  rr(ctx, cardX + 30, cardY + 28, cardW - 60, 12, 6); ctx.fill();

  let y = cardY + 92;
  if (s.tag) {
    ctx.font = `bold 32px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(s.tag).width + 44;
    ctx.fillStyle = INK;
    rr(ctx, cx - tw / 2, y - 28, tw, 56, 14); ctx.fill();
    ctx.fillStyle = GOLD; ctx.fillText(s.tag, cx, y);
    y += 70;
  }
  // 标题
  centered(ctx, s.title || '', cx, y, 52, INK);
  y += 68;
  ctx.strokeStyle = 'rgba(11,27,58,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cardX + 70, y); ctx.lineTo(cardX + cardW - 70, y); ctx.stroke();
  y += 44;

  // 正文行（逐行打字效果）
  const lines = s.lines || [];
  const n = Math.max(1, Math.min(lines.length, Math.floor(appear * lines.length * 1.4) + 1));
  for (let i = 0; i < n; i++) {
    ctx.font = `bold ${lines[i].length > 22 ? 30 : 36}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = i === 0 && s.accent ? '#b6543b' : INK;
    const wrapped = wrap(ctx, lines[i], cardW - 130);
    for (const ln of wrapped) { ctx.fillText(ln, cx, y); y += 42; }
    y += 8;
  }
  ctx.restore();
}

// ---------- 主帧绘制 ----------
function drawFrame(ctx, t, scenes, duration, bg, sprites) {
  ctx.drawImage(bg, 0, 0);
  const s = scenes.find(sc => t >= sc.a && t < sc.b) || scenes[scenes.length - 1];
  const appear = Math.min(1, Math.max(0, (t - s.a) / 0.45));

  // 漂浮泡泡
  for (let i = 0; i < 16; i++) {
    const bx = (i * 211 + 57 + t * (7 + i % 5)) % W;
    const by = H - ((t * (18 + i % 7) + i * 173) % (H + 200));
    const r = 4 + (i % 4) * 3;
    ctx.strokeStyle = `rgba(92,225,230,${0.10 + (i % 3) * 0.05})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
  }

  // 全程角标（合规：AI 标识前 3 秒出现且常驻）
  ctx.fillStyle = 'rgba(7,19,39,0.78)';
  rr(ctx, 36, 44, 610, 64, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(92,225,230,0.5)'; ctx.lineWidth = 2;
  rr(ctx, 36, 44, 610, 64, 12); ctx.stroke();
  ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM; ctx.fillText('Day 1 · AI 接管中 · 鲸鱼娘运营日志', 56, 77);

  ctx.fillStyle = 'rgba(122,18,34,0.88)';
  rr(ctx, W - 412, 44, 376, 64, 12); ctx.fill();
  ctx.strokeStyle = '#ff9aa6'; ctx.lineWidth = 2;
  rr(ctx, W - 412, 44, 376, 64, 12); ctx.stroke();
  ctx.font = `bold 28px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.fillText('本视频含 AI 生成内容', W - 224, 77);

  // 主视觉
  if (s.kind === 'hook' || s.kind === 'intro' || s.kind === 'club' || s.kind === 'quote' || s.kind === 'end') {
    const scale = 1 + 0.02 * Math.sin(t * 5);
    ctx.save(); ctx.translate(W / 2, 560); ctx.scale(scale, scale);
    ctx.font = `bold ${s.kind === 'hook' ? 172 : 96}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(s.big, 8, 10);
    ctx.fillStyle = s.kind === 'hook' ? '#fff' : GOLD; ctx.fillText(s.big, 0, 0);
    ctx.restore();
    ctx.font = `bold 42px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = CYAN; ctx.fillText(s.small, W / 2, 730);
    // CTA 徽章放在角色下方、字幕上方的空档（角色约 852–1212，字幕从 1400 起）
    if (s.kind === 'club' || s.kind === 'end') {
      ctx.fillStyle = 'rgba(7,19,39,0.72)';
      rr(ctx, 300, 1252, 480, 104, 18); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 5;
      rr(ctx, 300, 1252, 480, 104, 18); ctx.stroke();
      ctx.font = `bold 44px ${FONT}`; ctx.fillStyle = CREAM;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.kind === 'club' ? '评论区扣泡泡领证' : '点赞 · 收藏 · 关注', W / 2, 1304);
    }
  } else if (s.kind === 'alert') {
    ctx.fillStyle = 'rgba(255,93,108,0.14)';
    rr(ctx, 90, 380, W - 180, 560, 26); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 7;
    rr(ctx, 90, 380, W - 180, 560, 26); ctx.stroke();
    centered(ctx, s.title, W / 2, 470, 56, RED);
    for (let i = 0; i < s.lines.length; i++) {
      centered(ctx, '!  ' + s.lines[i], W / 2, 600 + i * 150, 62, CREAM);
    }
  } else {
    drawCard(ctx, s, t, appear);
  }

  // 角色（脚底对齐 CHAR_CY，位于卡片与字幕之间）
  const emoSet = sprites[s.emo] || sprites.happy;
  const spr = emoSet[Math.floor(t * 8) % emoSet.length];
  const bob = Math.sin(t * 3.1) * 12;
  ctx.drawImage(spr, W / 2 - SPR / 2, CHAR_CY - SPR * SPR_CY + bob);

  // 底部字幕（固定区域，避免与角色重叠）
  ctx.font = `bold 44px ${FONT}`;
  const lines = wrap(ctx, s.sub, 920);
  const lineH = 58, pad = 30;
  const boxH = pad * 2 + lines.length * lineH;
  const boxY = SUB_Y;
  ctx.fillStyle = 'rgba(6,16,34,0.9)';
  rr(ctx, 54, boxY, W - 108, boxH, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(92,225,230,0.45)'; ctx.lineWidth = 3;
  rr(ctx, 54, boxY, W - 108, boxH, 20); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, boxY + pad + lineH / 2 + i * lineH));

  // 进度条
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, 60, H - 150, W - 120, 16, 8); ctx.fill();
  ctx.fillStyle = CYAN;
  rr(ctx, 60, H - 150, (W - 120) * Math.min(1, t / duration), 16, 8); ctx.fill();
  ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText(`已坚持 ${Math.floor(t)}s`, 60, H - 108);
  ctx.textAlign = 'right';
  ctx.fillText(`3.31% 俱乐部  /  Day 1`, W - 60, H - 108);
}

// ---------- ffmpeg 路径 ----------
function ffmpegBin() {
  const cand = [
    '/home/user/ai-yunying/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries'
  ];
  for (const c of cand) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  if (fs.existsSync(cand[1])) {
    const b = fs.readdirSync(cand[1]).find(f => f.startsWith('ffmpeg'));
    if (b) return path.join(cand[1], b);
  }
  return 'ffmpeg';
}
function probeDuration(audio, ff) {
  const r = spawnSync(ff, ['-i', audio], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(r.stderr || '');
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
}
function scaleScenes(scenes, target, cues) {
  // 优先用 Edge TTS 输出的 SRT 做精确对齐：把每一段字幕落到真实朗读时间上。
  // 没有 SRT 时退化为「按字幕字数加权」的近似分配。
  const MIN = 1.6;
  const n = scenes.length;

  if (Array.isArray(cues) && cues.length) {
    // cues: [{start, end, text}]，按顺序把每个分镜的 sub 字符数映射到 cue 时间轴
    const totalChars = cues.reduce((a, c) => a + c.text.length, 0) || 1;
    const totalDur = cues[cues.length - 1].end;
    const sceneChars = scenes.map(s => Math.max(1, (s.sub || '').length));
    const sceneSum = sceneChars.reduce((a, b) => a + b, 0);

    // 在 cue 时间轴上按字符比例插值：给定字符偏移 → 时间
    const toTime = (charOffset) => {
      let acc = 0;
      for (const c of cues) {
        const len = c.text.length;
        if (charOffset <= acc + len) {
          const k = (charOffset - acc) / Math.max(1, len);
          return c.start + (c.end - c.start) * Math.min(1, Math.max(0, k));
        }
        acc += len;
      }
      return totalDur;
    };

    let cursorChar = 0;
    const out = scenes.map((s, i) => {
      const a = toTime(cursorChar);
      cursorChar += sceneChars[i];
      let b = toTime(cursorChar);
      if (b - a < MIN) b = Math.min(totalDur, a + MIN);
      return { ...s, a, b };
    });
    // 收尾对齐到音轨结尾
    out[out.length - 1].b = Math.max(out[out.length - 1].b, totalDur);
    console.log(`SRT 对齐：${cues.length} 条字幕 / ${totalChars} 字 / ${totalDur.toFixed(2)}s`);
    return out;
  }

  const reserve = MIN * n;
  const flexible = Math.max(0.001, target - reserve);
  const weights = scenes.map(s => Math.max(1, (s.sub || '').length));
  const sum = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return scenes.map((s, i) => {
    const dur = MIN + flexible * (weights[i] / sum);
    const out = { ...s, a: cursor, b: cursor + dur };
    cursor += dur;
    return out;
  });
}

function parseSrt(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const toSec = (h, m, s, ms) => (+h) * 3600 + (+m) * 60 + (+s) + (+ms) / 1000;
  const cues = [];
  for (const block of raw.split(/\n\n+/)) {
    const lines = block.split('\n').filter(Boolean);
    const ti = lines.findIndex(l => l.includes('-->'));
    if (ti < 0) continue;
    const m = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(lines[ti]);
    if (!m) continue;
    const text = lines.slice(ti + 1).join(' ').trim();
    if (!text) continue;
    cues.push({
      start: toSec(m[1], m[2], m[3], m[4]),
      end: toSec(m[5], m[6], m[7], m[8]),
      text
    });
  }
  return cues;
}

// ---------- main ----------
const args = process.argv.slice(2);
const argOf = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const isFast = args.includes('--fast');
const audio = argOf('--audio', null);
const outFile = path.resolve(argOf('--out', isFast ? '../../out/day1_极速版.mp4' : '../../out/day1_主版.mp4'));
const stillDir = argOf('--stills', null);
const ff = ffmpegBin();
let scenes = isFast ? FAST : MAIN;
let duration = scenes[scenes.length - 1].b;

if (audio) {
  if (!fs.existsSync(audio)) throw new Error(`音频不存在：${audio}`);
  const d = probeDuration(audio, ff);
  // 同名 .srt 存在时用精确时间戳对齐，否则按字数加权近似
  const srtPath = argOf('--srt', audio.replace(/\.(mp3|wav|m4a|aac)$/i, '.srt'));
  let cues = null;
  if (srtPath && fs.existsSync(srtPath)) {
    try { cues = parseSrt(srtPath); } catch (e) { console.log('SRT 解析失败，回退近似对齐：', e.message); }
  }
  if (d) {
    console.log(`音轨时长 ${d.toFixed(2)}s → ${cues ? 'SRT 精确对齐' : '字数加权近似对齐'}`);
    scenes = scaleScenes(scenes, d, cues);
    duration = cues && cues.length ? Math.max(d, cues[cues.length - 1].end) : d;
  }
}
const bg = makeBackground();
const sprites = makeSprites();
console.log(`画布 ${W}×${H} @${FPS}fps｜时长 ${duration.toFixed(2)}s｜分镜 ${scenes.length} 段｜字体 ${FONTS}`);

if (stillDir) {
  fs.mkdirSync(stillDir, { recursive: true });
  for (let i = 0; i < scenes.length; i++) {
    const t = (scenes[i].a + scenes[i].b) / 2;
    const c = createCanvas(W, H), x = c.getContext('2d');
    drawFrame(x, t, scenes, duration, bg, sprites);
    const f = path.join(stillDir, `${String(i + 1).padStart(2, '0')}_${scenes[i].kind}_${Math.round(t)}s.png`);
    fs.writeFileSync(f, c.toBuffer('image/png'));
    console.log(' still', f);
  }
  process.exit(0);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
const ffArgs = [
  '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgba',
  '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'
];
if (audio) {
  ffArgs.push('-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '160k');
} else {
  // 无配音时生成静音 AAC 轨，保证平台兼容
  ffArgs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
              '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '96k');
}
ffArgs.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p',
            '-shortest', '-movflags', '+faststart', outFile);

const ffp = spawn(ff, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = '';
ffp.stderr.on('data', d => { ffErr += d.toString(); });
const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  drawFrame(ctx, t, scenes, duration, bg, sprites);
  const raw = ctx.getImageData(0, 0, W, H).data;
  const buf = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
  if (!ffp.stdin.write(buf)) await new Promise(r => ffp.stdin.once('drain', r));
  if (f % 300 === 0 || f === total - 1) {
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`\r  frame ${f + 1}/${total} (${((f + 1) / total * 100).toFixed(0)}%) — ${((f + 1) / Math.max(0.1, el)).toFixed(1)} fps — ${el.toFixed(1)}s`);
  }
}
process.stdout.write('\n');
ffp.stdin.end();
const code = await new Promise(r => ffp.on('close', r));
if (code !== 0) { console.error(ffErr.slice(-3000)); throw new Error(`ffmpeg 退出码 ${code}`); }
console.log(`✓ 已生成 ${outFile} (${(fs.statSync(outFile).size / 1e6).toFixed(2)} MB)`);
