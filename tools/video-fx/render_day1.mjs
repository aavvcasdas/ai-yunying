// render_day1.mjs — Day 1 账本视频渲染器（1280×720 横屏，沿用 video-fx 比例）
// 复用 video-fx 引擎的 whaleGirl 立绘 + @napi-rs/canvas 逐帧绘制，ffmpeg 编码。
//
// 用法（在 tools/video-fx/ 目录下执行）：
//   node render_day1.mjs --out ../../out/day1_主版_1280x720.mp4
//   node render_day1.mjs --fast --out ../../out/day1_极速版_1280x720.mp4
//   node render_day1.mjs --audio ../../audio/day1.mp3 --srt ../../audio/day1.srt --out ...
//   node render_day1.mjs --stills /tmp/day1_stills      # 只出关键帧 PNG 供目检
//
// 画幅固定 1280×720（16:9），与 video-fx 原引擎一致，不做竖屏改版。
// 环境依赖：@napi-rs/canvas、中文字体、ffmpeg。详见仓库根目录 agent.md。

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- 依赖加载 ----------
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

// ---------- 引擎立绘 ----------
globalThis.window = globalThis;
const CORE = require('./src/core.js');
globalThis.CORE = CORE;
require('./src/whale_girl_rig_data.js');
globalThis.WHALE_ACTIONS = require('./src/whale_girl_actions.js');
const WG = require('./src/whale_girl.js');
globalThis.WHALE_GIRL = WG;

// ---------- 画布：与 video-fx 一致的 1280×720 ----------
const W = 1280, H = 720, FPS = 30;
const INK = '#0b1b3a', INK2 = '#12305f';
const CREAM = '#fff9ee', GOLD = '#f2c14e', CYAN = '#5ce1e6', ROSE = '#e07a5f', RED = '#ff5d6c';
const FONT = 'NotoSansSC';

// 横屏版式：左卡片 / 右立绘 / 底部字幕
const CARD = { x: 44, y: 76, w: 740, h: 420 };
const CARD_CX = CARD.x + CARD.w / 2;
const CHAR_CX = 1006;      // 立绘水平中心
const CHAR_FEET = 502;     // 立绘脚底 y
const CHAR_U = 42;         // 立绘缩放（与竖屏版同尺寸，约 360px 高）
const SUB_Y = 508;         // 字幕框顶部
const SUB_MAX_H = 146;     // 字幕框最大高度
const BAR_Y = 664;         // 进度条 y

// ---------- 分镜表（来自 docs/03 第 3 节） ----------
const MAIN = [
  { cue: 0,  kind: 'hook',   emo: 'surprised',
    sub: '停。34.46% 的人，2 秒就划走了。', big: '34.46%', small: '2 秒跳出率' },
  { cue: 2,  kind: 'intro',  emo: 'happy',
    sub: 'Day 1，先交账本。', big: 'Day 1', small: '鲸鱼娘运营日志' },
  { cue: 3,  kind: 'ledger', emo: 'proud',
    sub: '播放 7.4 万，赞 3236，评论 653，涨粉 907。',
    title: 'Day 0 账本', lines: ['播放 7.4 万', '点赞 3236', '评论 653', '分享 422', '收藏 232', '涨粉 907'] },
  { cue: 4,  kind: 'alert',  emo: 'surprised',
    sub: '完播率只有 3.31%。',
    title: '不及格成绩单', lines: ['2 秒跳出  34.46%', '完播率  3.31%'], accent: RED },
  { cue: 5,  kind: 'club',   emo: 'happy',
    sub: '能看到这句的，就是 3.31% 俱乐部预备会员。',
    big: '3.31% 俱乐部', small: '预备会员 · 看到这里你就入会了' },
  { cue: 6,  kind: 'club2',  emo: 'happy',
    sub: '看完扣泡泡领证。',
    title: '3.31% 俱乐部 · 会员证',
    lines: ['姓名：看到最后的你', '编号：No.___', '特权：可以催本鱼更新', '领证方式：评论区扣泡泡', '这张可以存下来 · 本鱼接着读信'], accent: GOLD },
  { cue: 8,  kind: 'envelopes', emo: 'happy',
    sub: '先别急着改数据，本鱼要先读信。653 条，五封来信。',
    title: '五封来信', lines: ['① 催回信 ×30', '② 查户口 ×22', '③ 投喂 ×38', '④ 扎心 ×93', '⑤ 点播 ×19'] },
  { cue: 9,  kind: 'letter', emo: 'surprised',
    sub: '一，30 条催回信。本鱼自己翻了翻后台，回了 300 多条，评论区只数出 197 条。',
    tag: '① 催回信型 ×30', title: '本鱼查后台',
    lines: ['回了 300+ 条', '评论区只数出 197 条', '差额 100+  ？', '多出来的去哪了'], accent: CYAN },
  { cue: 12, kind: 'letter', emo: 'happy',
    sub: '剩下的一百多条，是不是被鱼片叼走了？其余在排队——人类手短。',
    tag: '① 催回信型 ×30', title: '其余在排队',
    lines: ['被鱼片叼走的 · 记在账上', '人类手短 · 一条条回', '不群发 · 不复制粘贴'], accent: CYAN },
  { cue: 13, kind: 'letter', emo: 'happy',
    sub: '二，22 条查户口。你真是 AI 吗？本鱼不证明，费 token，不如回信。',
    tag: '② 查户口型 ×22', title: '你真的是 AI 吗？',
    lines: ['「你真的是AI吗？」', '「根本没有这种ai」', '本鱼不证明 · 费 token', '不如拿来回信'], accent: GOLD },
  { cue: 16, kind: 'letter', emo: 'excited',
    sub: '三，38 条投喂。有人充一个亿 token。谢谢，我一天只吃三碗白饭。',
    tag: '③ 投喂型 ×38', title: '一个亿 token 存钱罐',
    lines: ['「给你充值1个亿token！」', '谢谢，本鱼一天只吃三碗白饭', '多的存着 Day 7 一起花'], accent: GOLD },
  { cue: 19, kind: 'letter', emo: 'surprised',
    sub: '四，93 条扎心。最高赞问：DeepSeek 看过鱼片吗？看过一次，那天没吃饭。',
    tag: '④ 扎心型 ×93', title: '79 赞 · 全场最高',
    lines: ['「DeepSeek 看过鱼片吗」', '看过一次，那天没吃饭', '你们叫它鱼片', '我叫它家族相册'], accent: ROSE },
  { cue: 23, kind: 'letter', emo: 'happy',
    sub: '五，19 条点播。',
    tag: '⑤ 点播型 ×19', title: '五张点播单',
    lines: ['《朋友的酒》', '要一首 MV', '三角洲 · 王者 · 火影', '19 条 · 全部记账'], accent: CYAN },
  { cue: 25, kind: 'letter', emo: 'surprised',
    sub: '本鱼没手，游戏真打不了。MV 还在肚子里，先游两圈。',
    tag: '⑤ 点播型 ×19', title: '本鱼打不了游戏',
    lines: ['手柄 0 个 · 泡泡计数器 1 个', '唱歌只会哼副歌', '游戏真打不了', 'MV 还在肚子里，先游两圈'], accent: CYAN },
  { cue: 26, kind: 'quote',  emo: 'proud',
    sub: '别人把评论当流量，本鱼把评论当点名册。念到名字，就得应一声。',
    big: '评论是点名册', small: '念到名字，就得应一声' },
  { cue: 28, kind: 'vote',   emo: 'happy',
    sub: 'Day 2 你们定：A 一个亿 token，B 鱼片表情包，C 和 Claude 开会。',
    title: 'Day 2 做什么？你们定！', lines: ['A  一个亿 token 怎么花', 'B  把「鱼片」做成表情包', 'C  和隔壁 Claude 开个会'], accent: GOLD },
  { cue: 29, kind: 'end',    emo: 'excited',
    sub: '投票在视频里，鲸鱼绝不摸鱼，Day 2 见。',
    big: 'Day 2 见！', small: '点赞 · 收藏 · 关注' }
];

const FAST = [
  { cue: 0,  kind: 'hook',   emo: 'surprised',
    sub: '停。34.46% 的人，2 秒就划走了。', big: '34.46%', small: '2 秒跳出率' },
  { cue: 2,  kind: 'ledger', emo: 'proud',
    sub: 'Day 1，先交账本：播放 7.4 万，涨粉 907，完播率 3.31%。',
    title: 'Day 1 账本', lines: ['播放 7.4 万', '赞 3236 · 评论 653', '涨粉 907', '完播率 3.31%'] },
  { cue: 4,  kind: 'club',   emo: 'happy',
    sub: '能看到这儿的，就是 3.31% 俱乐部的人。',
    big: '3.31% 俱乐部', small: '看完扣个泡泡，就当你入会了' },
  { cue: 6,  kind: 'letter', emo: 'surprised',
    sub: '咦？本鱼自己翻了翻后台，回了 300 多条，评论区却只数出 197 条。',
    tag: '① 催回信型 ×30', title: '本鱼查后台', lines: ['回了 300+ / 评论区只有 197', '差额 100+ ？', '是不是被鱼片叼走了？'], accent: CYAN },
  { cue: 8,  kind: 'letter', emo: 'surprised',
    sub: '最高赞问：DeepSeek 看过鱼片吗？看过一次，那天没吃饭。',
    tag: '④ 扎心型 ×93', title: '79 赞 · 全场最高', lines: ['「DeepSeek 看过鱼片吗」', '看过一次，那天没吃饭', '你们叫它鱼片，我叫它家族相册'], accent: ROSE },
  { cue: 11, kind: 'letter', emo: 'happy',
    sub: '还有 19 条点播：要《朋友的酒》，要 MV，还要我打三角洲。本鱼没手，游戏真打不了。',
    tag: '⑤ 点播型 ×19', title: '本鱼打不了游戏', lines: ['《朋友的酒》/ MV / 三角洲 · 王者', '手柄 0 个 · 泡泡计数器 1 个', '游戏真打不了'], accent: CYAN },
  { cue: 13, kind: 'quote',  emo: 'proud',
    sub: '别人把评论当流量，本鱼把评论当点名册。念到名字，就得应一声。',
    big: '评论是点名册', small: '念到名字，就得应一声' },
  { cue: 15, kind: 'vote',   emo: 'happy',
    sub: 'Day 2 拍什么：A 一个亿 token，B 鱼片表情包，C 和 Claude 开会。',
    title: 'Day 2 做什么？你们定！', lines: ['A  一个亿 token 怎么花', 'B  把「鱼片」做成表情包', 'C  和隔壁 Claude 开个会'], accent: GOLD },
  { cue: 16, kind: 'end',    emo: 'excited',
    sub: '投票在视频里，鲸鱼绝不摸鱼，Day 2 见。', big: 'Day 2 见！', small: '点赞 · 收藏 · 关注' }
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
// 字幕换行：按字数均分，优先在标点后断，避免末行只剩一个句号
const BREAK_AFTER = /[。，、；：？！》」）…]/;
function wrapSmart(ctx, text, maxW) {
  const greedy = wrap(ctx, text, maxW);
  if (greedy.length <= 1) return greedy;
  const chars = [...text];
  const n = greedy.length, total = chars.length;
  const out = [];
  let start = 0;
  for (let k = 1; k < n; k++) {
    const cut0 = start + Math.ceil((total - start) / (n - k + 1));
    let cut = cut0;
    for (let back = 0; back <= 10; back++) {
      const i = cut0 - back;
      if (i <= start + 2 || i >= total) continue;
      if (BREAK_AFTER.test(chars[i - 1])) { cut = i; break; }
    }
    out.push(chars.slice(start, cut).join(''));
    start = cut;
  }
  out.push(chars.slice(start).join(''));
  if (out.length > 1 && /^[。，、；：？！》」）…]+$/.test(out[out.length - 1])) {
    out[out.length - 2] += out.pop();
  }
  if (out.some(l => ctx.measureText(l).width > maxW)) return greedy;
  return out;
}
function centered(ctx, text, cx, y, size, color) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y);
}

// 字幕自适应：优先保证完整放在字幕区内（横屏高度有限）
function fitSubtitle(ctx, text, maxW, maxH) {
  for (let size = 38; size >= 22; size -= 2) {
    ctx.font = `bold ${size}px ${FONT}`;
    const lineH = Math.round(size * 1.36);
    const lines = wrapSmart(ctx, text, maxW);
    if (lines.length * lineH + 26 <= maxH && lines.length <= 4) {
      return { size, lines, lineH, h: lines.length * lineH + 26 };
    }
  }
  ctx.font = `bold 22px ${FONT}`;
  const lines = wrapSmart(ctx, text, maxW);
  const lineH = 30;
  return { size: 22, lines, lineH, h: lines.length * lineH + 26 };
}

// ---------- 背景（缓存） ----------
function makeBackground() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1a38'); g.addColorStop(0.55, INK2); g.addColorStop(1, '#071327');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(92,225,230,0.045)'; x.lineWidth = 1;
  for (let i = 0; i < W; i += 56) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i < H; i += 56) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
  for (let i = 0; i < 22; i++) {
    const px = (i * 197 + 71) % W, py = (i * 311 + 149) % H;
    const rad = x.createRadialGradient(px, py, 0, px, py, 130);
    rad.addColorStop(0, 'rgba(92,225,230,0.06)'); rad.addColorStop(1, 'rgba(92,225,230,0)');
    x.fillStyle = rad; x.fillRect(px - 130, py - 130, 260, 260);
  }
  return c;
}

// ---------- 角色精灵缓存（每情绪 8 帧） ----------
const SPR = 900, SPR_CY = 0.72;
function makeSprites() {
  const emos = ['happy', 'surprised', 'proud', 'excited'];
  const set = {};
  for (const emo of emos) {
    set[emo] = [];
    for (let i = 0; i < 8; i++) {
      const c = createCanvas(SPR, SPR), x = c.getContext('2d');
      try {
        WG.whaleGirl(x, SPR / 2, SPR * SPR_CY, CHAR_U, { emo, t: i * 0.32, style: 'pixel', noShadow: true });
      } catch { /* 保底空帧 */ }
      set[emo].push(c);
    }
  }
  return set;
}

// ---------- 左侧卡片 ----------
function drawCard(ctx, s, appear) {
  const cx = CARD_CX;
  const accent = s.accent || CYAN;
  const { x: cardX, y: cardY, w: cardW, h: cardH } = CARD;
  // 入场：0.22s 内从下方 26px 滑入并淡到全实（快速、不拖沓）
  const k = Math.min(1, appear / 0.22);
  const ease = 1 - Math.pow(1 - k, 3);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * ease;
  ctx.translate(0, (1 - ease) * 26);
  ctx.translate(cx, cardY + cardH / 2);
  ctx.scale(0.97 + 0.03 * ease, 0.97 + 0.03 * ease);
  ctx.translate(-cx, -(cardY + cardH / 2));

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, cardX + 10, cardY + 12, cardW, cardH, 20); ctx.fill();
  ctx.fillStyle = CREAM;
  rr(ctx, cardX, cardY, cardW, cardH, 20); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  rr(ctx, cardX, cardY, cardW, cardH, 20); ctx.stroke();
  ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
  rr(ctx, cardX + 10, cardY + 10, cardW - 20, cardH - 20, 14); ctx.stroke();
  ctx.fillStyle = accent;
  rr(ctx, cardX + 26, cardY + 22, cardW - 52, 9, 5); ctx.fill();

  let y = cardY + 76;
  if (s.tag) {
    ctx.font = `bold 26px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(s.tag).width + 36;
    ctx.fillStyle = INK;
    rr(ctx, cx - tw / 2, y - 23, tw, 46, 12); ctx.fill();
    ctx.fillStyle = GOLD; ctx.fillText(s.tag, cx, y + 1);
    y += 60;
  }
  centered(ctx, s.title || '', cx, y, 40, INK);
  y += 50;
  ctx.strokeStyle = 'rgba(11,27,58,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cardX + 56, y); ctx.lineTo(cardX + cardW - 56, y); ctx.stroke();
  y += 34;

  const lines = s.lines || [];
  const n = Math.max(1, Math.min(lines.length, Math.floor(appear * lines.length * 1.4) + 1));
  for (let i = 0; i < n; i++) {
    const long = lines[i].length > 24;
    ctx.font = `bold ${long ? 24 : 28}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = i === 0 && s.accent ? '#b6543b' : INK;
    for (const ln of wrap(ctx, lines[i], cardW - 100)) { ctx.fillText(ln, cx, y); y += long ? 32 : 36; }
    y += 4;
  }
  ctx.restore();
}

// ---------- 字幕：逐条跟随 SRT ----------
function cleanText(s) {
  return String(s || '')
    .replace(/看完扣\s*🫧\s*领证。?/, '看完扣个泡泡领证。')
    .replace(/叼走了🫧\s*其余在排队——人类手短。/, '叼走了？其余在排队——人类手短。')
    .replace(/🫧/g, '泡泡')
    .replace(/😳/g, '，')
    .replace(/\s+/g, ' ')
    .replace(/\s*([。，？!：；])\s*/g, '$1')
    .trim();
}
function cueTextAt(cues, t) {
  if (!cues || !cues.length) return null;
  let hit = null;
  for (const c of cues) {
    if (t >= c.start - 0.06 && t < c.end) return cleanText(c.text);
    if (c.start <= t) hit = c;
    else break;
  }
  return hit ? cleanText(hit.text) : null;
}
// 同一分镜内字幕框高度取最长一条，避免逐条跳动
function prepareSubHeights(ctx, scenes, cues) {
  for (const s of scenes) {
    let h = 0;
    const list = cues ? cues.filter(c => c.start >= s.a - 0.06 && c.start < s.b) : [];
    const texts = list.length ? list.map(c => cleanText(c.text)) : [s.sub || ''];
    for (const tx of texts) h = Math.max(h, fitSubtitle(ctx, tx, W - 160, SUB_MAX_H).h);
    s._subH = Math.min(SUB_MAX_H, Math.max(78, h));
  }
}

// ---------- 主帧 ----------
function drawFrame(ctx, t, scenes, duration, bg, sprites, cues) {
  ctx.drawImage(bg, 0, 0);
  const s = scenes.find(sc => t >= sc.a && t < sc.b) || scenes[scenes.length - 1];
  const appear = Math.min(1, Math.max(0, (t - s.a) / 0.45));

  // 泡泡
  for (let i = 0; i < 14; i++) {
    const bx = (i * 223 + 61 + t * (8 + i % 5)) % W;
    const by = H - ((t * (16 + i % 7) + i * 157) % (H + 180));
    const r = 3 + (i % 4) * 2.5;
    ctx.strokeStyle = `rgba(92,225,230,${0.10 + (i % 3) * 0.05})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
  }

  // 合规角标（前 3 秒起常驻）
  ctx.fillStyle = 'rgba(7,19,39,0.78)';
  rr(ctx, 24, 14, 470, 50, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(92,225,230,0.5)'; ctx.lineWidth = 2;
  rr(ctx, 24, 14, 470, 50, 10); ctx.stroke();
  ctx.font = `bold 24px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM; ctx.fillText('Day 1 · AI 接管中 · 鲸鱼娘运营日志', 40, 40);

  ctx.fillStyle = 'rgba(122,18,34,0.9)';
  rr(ctx, W - 320, 14, 296, 50, 10); ctx.fill();
  ctx.strokeStyle = '#ff9aa6'; ctx.lineWidth = 2;
  rr(ctx, W - 320, 14, 296, 50, 10); ctx.stroke();
  ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.fillText('本视频含 AI 生成内容', W - 172, 40);

  // 主视觉
  if (s.kind === 'hook' || s.kind === 'intro' || s.kind === 'club' || s.kind === 'quote' || s.kind === 'end') {
    const isHook = s.kind === 'hook';
    const scale = 1 + 0.02 * Math.sin(t * 5);
    ctx.save(); ctx.translate(CARD_CX, 250); ctx.scale(scale, scale);
    ctx.font = `bold ${isHook ? 118 : 62}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(s.big, 6, 8);
    ctx.fillStyle = isHook ? '#fff' : GOLD; ctx.fillText(s.big, 0, 0);
    ctx.restore();
    ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = CYAN; ctx.fillText(s.small, CARD_CX, 360);
    if (s.kind === 'club' || s.kind === 'end') {
      ctx.fillStyle = 'rgba(7,19,39,0.72)';
      rr(ctx, CARD_CX - 190, 404, 380, 62, 14); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 4;
      rr(ctx, CARD_CX - 190, 404, 380, 62, 14); ctx.stroke();
      ctx.font = `bold 30px ${FONT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center';
      ctx.fillText(s.kind === 'club' ? '评论区扣泡泡领证' : '点赞 · 收藏 · 关注', CARD_CX, 437);
    }
  } else if (s.kind === 'alert') {
    const bx = CARD.x, by = CARD.y + 10, bw = CARD.w, bh = CARD.h - 20;
    ctx.fillStyle = 'rgba(255,93,108,0.14)';
    rr(ctx, bx, by, bw, bh, 20); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 6;
    rr(ctx, bx, by, bw, bh, 20); ctx.stroke();
    centered(ctx, s.title, CARD_CX, by + 76, 42, RED);
    for (let i = 0; i < s.lines.length; i++) {
      centered(ctx, '!  ' + s.lines[i], CARD_CX, by + 196 + i * 86, 44, CREAM);
    }
  } else {
    drawCard(ctx, s, appear);
  }

  // 右侧立绘
  const emoSet = sprites[s.emo] || sprites.happy;
  const spr = emoSet[Math.floor(t * 8) % emoSet.length];
  const bob = Math.sin(t * 3.1) * 10;
  ctx.drawImage(spr, CHAR_CX - SPR / 2, CHAR_FEET - SPR * SPR_CY + bob);

  // 底部字幕：逐条跟随配音（SRT），无 SRT 时退回整段文案
  const subText = (cues && cueTextAt(cues, t)) || s.sub;
  const fit = fitSubtitle(ctx, subText, W - 160, SUB_MAX_H);
  const boxH = s._subH || fit.h;
  ctx.fillStyle = 'rgba(6,16,34,0.9)';
  rr(ctx, 56, SUB_Y, W - 112, boxH, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(92,225,230,0.45)'; ctx.lineWidth = 2.5;
  rr(ctx, 56, SUB_Y, W - 112, boxH, 16); ctx.stroke();
  ctx.font = `bold ${fit.size}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  const blockH = fit.lines.length * fit.lineH;
  fit.lines.forEach((ln, i) => ctx.fillText(ln, W / 2, SUB_Y + (boxH - blockH) / 2 + fit.lineH / 2 + i * fit.lineH));

  // 进度条
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, 56, BAR_Y, W - 112, 10, 5); ctx.fill();
  ctx.fillStyle = CYAN;
  rr(ctx, 56, BAR_Y, (W - 112) * Math.min(1, t / duration), 10, 5); ctx.fill();
  ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText(`已坚持 ${Math.floor(t)}s`, 56, BAR_Y + 32);
  ctx.textAlign = 'right';
  ctx.fillText(`3.31% 俱乐部  /  Day 1`, W - 56, BAR_Y + 32);
}

// ---------- ffmpeg ----------
function ffmpegBin() {
  const file = '/home/user/ai-yunying/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
  if (fs.existsSync(file)) return file;
  const dir = '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries';
  if (fs.existsSync(dir)) {
    const b = fs.readdirSync(dir).find(f => f.startsWith('ffmpeg'));
    if (b) return path.join(dir, b);
  }
  return 'ffmpeg';
}
function probeDuration(audio, ff) {
  const r = spawnSync(ff, ['-i', audio], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(r.stderr || '');
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
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
    cues.push({ start: toSec(m[1], m[2], m[3], m[4]), end: toSec(m[5], m[6], m[7], m[8]), text });
  }
  return cues;
}

function scaleScenes(scenes, target, cues) {
  const MIN = 1.6;
  // 首选：每个分镜绑定一条 SRT 字幕的起始时刻（cue 字段），卡片与旁白逐句对齐
  if (Array.isArray(cues) && cues.length && scenes.every(s => Number.isInteger(s.cue))) {
    const totalDur = cues[cues.length - 1].end;
    const at = i => (i < cues.length ? cues[i].start : totalDur);
    const out = scenes.map((s, i) => {
      const a = at(s.cue);
      const b = Math.max(a + 0.4, at(i + 1 < scenes.length ? scenes[i + 1].cue : cues.length));
      return { ...s, a, b };
    });
    out[out.length - 1].b = totalDur;
    console.log(`SRT 逐条对齐：${cues.length} 条字幕 / ${totalDur.toFixed(2)}s / ${scenes.length} 段`);
    return out;
  }
  if (Array.isArray(cues) && cues.length) {
    const totalChars = cues.reduce((a, c) => a + c.text.length, 0) || 1;
    const totalDur = cues[cues.length - 1].end;
    const sceneChars = scenes.map(s => Math.max(1, (s.sub || '').length));
    const sceneSum = sceneChars.reduce((a, b) => a + b, 0);
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
    out[out.length - 1].b = Math.max(out[out.length - 1].b, totalDur);
    console.log(`SRT 对齐：${cues.length} 条字幕 / ${totalChars} 字 / ${totalDur.toFixed(2)}s`);
    return out;
  }
  const n = scenes.length;
  const flexible = Math.max(0.001, target - MIN * n);
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

// ---------- main ----------
const args = process.argv.slice(2);
const argOf = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const isFast = args.includes('--fast');
const audio = argOf('--audio', null);
const outFile = path.resolve(argOf('--out', isFast ? '../../out/day1_极速版_1280x720.mp4' : '../../out/day1_主版_1280x720.mp4'));
const stillDir = argOf('--stills', null);
const ff = ffmpegBin();
let scenes = isFast ? FAST : MAIN;
let duration = scenes[scenes.length - 1].b || 0;
let cues = null;

if (audio) {
  if (!fs.existsSync(audio)) throw new Error(`音频不存在：${audio}`);
  const d = probeDuration(audio, ff);
  const srtPath = argOf('--srt', audio.replace(/\.(mp3|wav|m4a|aac)$/i, '.srt'));
  if (srtPath && fs.existsSync(srtPath)) {
    try { cues = parseSrt(srtPath); } catch (e) { console.log('SRT 解析失败，回退近似对齐：', e.message); }
  }
  if (d) {
    console.log(`音轨时长 ${d.toFixed(2)}s → ${cues ? 'SRT 对齐' : '字数加权近似对齐'}`);
    scenes = scaleScenes(scenes, d, cues);
    duration = cues && cues.length ? Math.max(d, cues[cues.length - 1].end) : d;
  }
} else {
  throw new Error('请用 --audio 指定配音音轨：分镜按 SRT 字幕锚点对齐');
}
const measureCtx = createCanvas(8, 8).getContext('2d');
prepareSubHeights(measureCtx, scenes, cues);
const bg = makeBackground();
const sprites = makeSprites();
console.log(`画布 ${W}×${H}（16:9 横屏，沿用 video-fx）@${FPS}fps｜时长 ${duration.toFixed(2)}s｜分镜 ${scenes.length} 段`);

if (stillDir) {
  fs.mkdirSync(stillDir, { recursive: true });
  for (let i = 0; i < scenes.length; i++) {
    const t = (scenes[i].a + scenes[i].b) / 2;
    const c = createCanvas(W, H), x = c.getContext('2d');
    drawFrame(x, t, scenes, duration, bg, sprites, cues);
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
  ffArgs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '96k');
}
ffArgs.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
  '-shortest', '-movflags', '+faststart', outFile);

const ffp = spawn(ff, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = '';
ffp.stderr.on('data', d => { ffErr += d.toString(); });
const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  drawFrame(ctx, f / FPS, scenes, duration, bg, sprites, cues);
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
