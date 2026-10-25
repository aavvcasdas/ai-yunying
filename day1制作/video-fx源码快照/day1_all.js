// src/ch/day1_all.js — 【Day 1】AI 运营第二天，名字被粉丝改了 (全四章)
// 时间轴全部来自 src/day1_timing.js (day1_tools/gen_all.py 生成)，cue 编号对应 Day1配音台词.txt L01-L21。
// 画面只拼装引擎现有件: PROPS 舞台/房间, CAST 全员, whaleGirl 表情与 28 动作。

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('../core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('../whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('../cast.js') : {});
  const PROPS = root.PROPS || (typeof require !== 'undefined' ? require('../props.js') : {});
  const TIMELINE = root.TIMELINE || (typeof require !== 'undefined' ? require('../timeline.js') : {});
  const TT = root.DAY1_TIMING || (typeof require !== 'undefined' ? require('../day1_timing.js') : null);
  if (!TT) throw new Error('DAY1_TIMING missing — run: python3 day1_tools/gen_all.py');

  const {
    W, H, TAU, PAL, clamp, lerp, seg, ease, easeIn, easeOut, backOut,
    boilSeed, pulse, kf, hash,
    rectPts, ellPts, rrPts, starPts,
    paint, inkLine, camBegin, camEnd, glow, flash, letter, brushWipe
  } = CORE;
  const { whaleGirl, feel, emotions, move } = WHALE;
  const { clawd, ladyClaude, bionicPuppy, miniWhale, biliTvMascot, agentReachBot } = CAST;

  const C = n => TT.cues[n - 1].start;
  const CE = n => TT.cues[n - 1].end;
  const frac = x => x - Math.floor(x);
  const rnd = i => frac(Math.sin(i * 127.1 + 311.7) * 43758.5453);

  function card(ctx, x, y, w, h, wash, inkCol, r = 14) {
    paint(ctx, rrPts(x, y, w, h, r, 1.6), { wash, fill: '#0B1526', fillOp: 130, ink: inkCol || PAL.whaleCyan, sw: 1.4 });
  }
  function stamp(ctx, x, y, text, col, k, rot = -0.08, size = 30) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(2.2 - 1.2 * backOut(clamp(k)), 2.2 - 1.2 * backOut(clamp(k)));
    paint(ctx, rrPts(-text.length * size * 0.38 - 18, -size * 0.85, text.length * size * 0.76 + 36, size * 1.7, 8, 1),
      { wash: null, ink: col, sw: 3 });
    letter(ctx, text, 0, 2, size, col, { stroke: false, ink: false });
    ctx.restore();
  }
  function bookAt(ctx, x, y, s, label, t) {
    boilSeed('hukouben');
    paint(ctx, rrPts(x - 70 * s, y - 95 * s, 140 * s, 190 * s, 8, 1.4), { wash: '#B6543B', fill: '#7C2D12', fillOp: 90, ink: PAL.ink, sw: 1.4 });
    paint(ctx, rrPts(x - 58 * s, y - 83 * s, 116 * s, 166 * s, 6, 1.2), { wash: PAL.paper, fill: PAL.paperDk, fillOp: 70, ink: PAL.ink, sw: 1.0 });
    letter(ctx, label, x, y - 48 * s, 30 * s, PAL.whaleNavy, { stroke: false, ink: false });
    for (let i = 0; i < 4; i++) {
      inkLine(ctx, [[x - 42 * s, y - 12 * s + i * 26 * s], [x + 42 * s, y - 12 * s + i * 26 * s]], 1.1, '#94A3B8', 'inkfine', 0);
    }
  }
  function dots907(ctx, prog, t, alpha = 1) {
    const n = Math.floor(907 * clamp(prog));
    for (let i = 0; i < n; i += 3) {           // 每点约代表 3 人，视觉密度刚好
      const gx = 90 + rnd(i) * (W - 180);
      const gy = 90 + rnd(i + 5000) * 420;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + i);
      paint(ctx, ellPts(gx, gy, 3.2, 3.2, 6), { wash: PAL.gold, washOp: Math.floor(190 * tw * alpha), ink: null });
    }
  }
  function wipeOut(ctx, lt, dur) {
    if (lt > dur - 0.26) brushWipe(ctx, (lt - (dur - 0.26)) / 0.52, [PAL.indigo, PAL.whaleBlue, PAL.teal]);
  }

  // ================= 第 1 章 点名 =================
  function shotTitle(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, H / 2, 1 + 0.04 * ease(lt / dur), 0);
    PROPS.stageBack(ctx, t, { sunburst: true, spots: [[W / 2, PAL.cream], [300, PAL.whaleCyan], [W - 300, PAL.whaleCyan]], floorY: 545 });
    letter(ctx, '【DAY 1】AI 运营第二天', W / 2, 140, 42, PAL.cream, { pop: seg(lt, 0.1, 0.5), rot: -0.02 });
    letter(ctx, '名字被粉丝改了！', W / 2, 225, 66, PAL.gold, { pop: seg(lt, 0.45, 0.9), rot: -0.02 + Math.sin(t * 6) * 0.012 });
    bookAt(ctx, W / 2 - 230, 420, 0.85, '户口本', t);
    const md = emotions(t, [[0, 'surprised'], [0.8, 'excited']]);
    whaleGirl(ctx, W / 2 + 60, 552, 23, { ...md, ...move('bounce', t), t });
    clawd(ctx, 225, 545, 12, { ...move('bounce', t, 1), hat: 'party', eyes: 'happy', t });
    bionicPuppy(ctx, 360, 550, 13, { t });
    biliTvMascot(ctx, 930, 540, 13, { t });
    clawd(ctx, 1055, 545, 12, { ...move('wave', t, 2), flip: true, hat: 'top', eyes: 'wink', t });
    PROPS.stageFront(ctx, t, { curtain: 1 - easeOut(seg(lt, 0, 0.6)) });
    camEnd(ctx);
    wipeOut(ctx, lt, dur);
  }

  function shotHello(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#1C2852');
    PROPS.windowPorthole(ctx, 1105, 175, 80, t, true);
    PROPS.floorBand(ctx, 548, '#251E3E');
    card(ctx, 90, 120, 330, 300, '#1E293B', PAL.gold, 16);
    letter(ctx, '日更打卡表', 255, 165, 30, PAL.gold, { stroke: false, ink: false });
    letter(ctx, 'Day 0 ✓', 255, 235, 30, '#4ADE80', { stroke: false, ink: false });
    const k = seg(lt, dur * 0.45, dur * 0.62);
    letter(ctx, 'Day 1', 215, 310, 34, PAL.cream, { stroke: false, ink: false });
    if (k > 0) letter(ctx, '✓', 310, 308, 44, '#4ADE80', { pop: k, stroke: false, ink: false });
    letter(ctx, '没摸鱼！', 255, 375, 26, PAL.whaleCyan, { stroke: false, ink: false });
    const md = emotions(t, [[C(1), 'happy'], [C(1) + dur * 0.5, 'proud', 'sparkle']]);
    whaleGirl(ctx, 760, 560, 24, { ...md, ...move('wave', t), t });
    bionicPuppy(ctx, 985, 558, 14, { t });
    camEnd(ctx);
  }

  function shotSwimBy(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.02, 0);
    PROPS.wall(ctx, '#0E2A5C');
    for (let i = 0; i < 26; i++) {
      const sp = 260 + rnd(i + 90) * 260;
      const mx = W + 120 - frac(lt * sp / (W + 320) + rnd(i + 7)) * (W + 320);
      const my = 120 + rnd(i + 40) * 330 + Math.sin(t * 3 + i) * 7;
      miniWhale(ctx, mx, my, 7 + (i % 3) * 2.2, { t: t + i * 0.31 });
    }
    PROPS.floorBand(ctx, 548, '#0A1B3D');
    card(ctx, 70, 95, 370, 150, '#0F172A', PAL.whaleCyan, 12);
    letter(ctx, '昨天游过门口', 255, 135, 24, PAL.whaleCyan, { stroke: false, ink: false });
    const num = Math.floor(lerp(0, 74000, easeOut(seg(lt, 0.1, dur * 0.92))));
    letter(ctx, num.toLocaleString('en-US') + ' 人', 255, 192, 40, PAL.cream, { stroke: false, ink: false });
    const md = emotions(t, [[C(2), 'surprised'], [C(2) + dur * 0.55, 'starstruck', 'sparkle']]);
    whaleGirl(ctx, 880, 562, 23, { ...md, action: 'peek_curious', t });
    camEnd(ctx);
  }

  function shotStay(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.04, 0);
    PROPS.wall(ctx, '#12265E');
    PROPS.floorBand(ctx, 548, '#1B1B36');
    dots907(ctx, seg(lt, dur * 0.15, dur * 0.95), t);
    bookAt(ctx, 300, 405, 1.05, '户口本', t);
    stamp(ctx, 300, 500, '907 户', '#F2C14E', seg(lt, dur * 0.55, dur * 0.75), -0.1, 34);
    letter(ctx, '留下来的', 820, 150, 34, PAL.cream, { pop: seg(lt, 0, 0.3) });
    letter(ctx, '907 个', 820, 215, 64, PAL.gold, { pop: seg(lt, dur * 0.3, dur * 0.55) });
    const md = emotions(t, [[C(3), 'joy', 'heart'], [C(3) + dur * 0.6, 'love', 'heart']]);
    whaleGirl(ctx, 820, 562, 24, { ...md, ...move('bounce', t), t });
    camEnd(ctx);
  }

  function shotCount3(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#1C2852');
    PROPS.shelf(ctx, 955, 205, 250, 2);
    PROPS.floorBand(ctx, 548, '#251E3E');
    card(ctx, 95, 115, 380, 210, '#0F172A', PAL.whaleCyan, 12);
    letter(ctx, '● 已深度思考', 285, 158, 26, PAL.whaleCyan, { stroke: false, ink: false });
    const round = 1 + Math.min(2, Math.floor(seg(lt, 0, dur * 0.8) * 3));
    letter(ctx, `数人头 · 第 ${round} 遍`, 285, 215, 36, PAL.cream, { stroke: false, ink: false });
    letter(ctx, round >= 2 && lt < dur * 0.78 ? '数着数着…有点困' : '没错，907 户', 285, 272, 24,
      lt < dur * 0.78 ? '#94A3B8' : '#4ADE80', { stroke: false, ink: false });
    const md = emotions(t, [
      [C(4), 'thinking'], [C(4) + dur * 0.4, 'sleepy', 'zzz'],
      [C(4) + dur * 0.72, 'surprised'], [C(4) + dur * 0.86, 'proud', 'sparkle']
    ]);
    whaleGirl(ctx, 760, 560, 24, { ...md, t });
    agentReachBot(ctx, 1010, 470, 14, { t });
    camEnd(ctx);
    wipeOut(ctx, lt, dur);
  }

  // ================= 第 2 章 改名 =================
  function taskCard(ctx, x, y, third) {
    card(ctx, x, y, 400, 310, '#1E293B', PAL.gold, 16);
    letter(ctx, 'Day 0 的任务清单', x + 200, y + 45, 28, PAL.gold, { stroke: false, ink: false });
    letter(ctx, '☑ 换头像', x + 200, y + 115, 30, '#4ADE80', { stroke: false, ink: false });
    letter(ctx, '☑ 写简介', x + 200, y + 182, 30, '#4ADE80', { stroke: false, ink: false });
    letter(ctx, third, x + 200, y + 252, 28, '#94A3B8', { stroke: false, ink: false });
  }

  function shotTasks(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#1B284E');
    PROPS.floorBand(ctx, 548, '#261E40');
    taskCard(ctx, 95, 110, '☐ 定第一周选题 …');
    stamp(ctx, 295, 300, '2 / 3', '#4ADE80', seg(lt, dur * 0.35, dur * 0.55), 0.08, 30);
    const md = emotions(t, [[C(5), 'proud', 'sparkle'], [C(5) + dur * 0.6, 'wink']]);
    whaleGirl(ctx, 790, 562, 24, { ...md, action: 'camera_shutter', t });
    biliTvMascot(ctx, 1040, 545, 14, { t });
    camEnd(ctx);
  }

  function shotRenameQ(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.05, 0);
    PROPS.wall(ctx, '#232050');
    PROPS.floorBand(ctx, 548, '#1E1B38');
    card(ctx, W / 2 - 210, 85, 420, 95, '#0F172A', PAL.cream, 12);
    letter(ctx, '官方艺名：鲸鱼娘', W / 2, 133, 34, PAL.cream, { stroke: false, ink: false });
    letter(ctx, '？？？', W / 2 + 300, 135, 40, PAL.rose, { pop: seg(lt, dur * 0.4, dur * 0.6) });
    const md = emotions(t, [[C(6), 'confused', 'question'], [C(6) + dur * 0.6, 'question', 'question']]);
    whaleGirl(ctx, W / 2, 565, 25, { ...md, headTilt: 0.16, t });
    clawd(ctx, 330, 550, 12, { ...move('bounce', t, 3), eyes: 'happy', t });
    camEnd(ctx);
  }

  function shotCommentWall(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.02, 0);
    PROPS.wall(ctx, '#14224A');
    const lines = ['大肥鱼，回我一下', '大肥鱼能关注我一下吗', '萌萌小肥鱼', '蓝色大肥鱼', '大肥鱼来个后空翻', '小肥鱼，快给我作品点赞', '大肥鱼你主人的 token 还有多少', '哦鲸鲸！'];
    for (let rI = 0; rI < 4; rI++) {
      for (let cI = 0; cI < 3; cI++) {
        const idx = (rI * 3 + cI) % lines.length;
        const cw = 365, ch = 92;
        const cx = 60 + cI * (cw + 28);
        let cy = 78 + rI * (ch + 22) - frac(lt * 0.14 + rI * 0.21) * 60;
        card(ctx, cx, cy, cw, ch, rI % 2 ? '#16294F' : '#1B2F57', '#38BDF8', 10);
        letter(ctx, lines[idx], cx + cw / 2, cy + ch / 2, 23, PAL.cream, { stroke: false, ink: false });
      }
    }
    paint(ctx, rectPts(-40, 520, W + 80, 260, 1), { wash: '#0B1526', washOp: 150, ink: null });
    const md = emotions(t, [[C(7), 'panic', 'sweat'], [C(7) + dur * 0.6, 'shocked', 'exclaim']]);
    whaleGirl(ctx, W / 2, 600, 20, { ...md, t });
    camEnd(ctx);
  }

  function shotAcceptName(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.04, 0);
    PROPS.stageBack(ctx, t, { sunburst: true, spots: [[W / 2, PAL.cream]], floorY: 548 });
    const flipK = seg(lt, dur * 0.3, dur * 0.5);
    card(ctx, W / 2 - 250, 95, 500, 110, '#0F172A', PAL.gold, 12);
    if (flipK < 0.5) letter(ctx, '鲸鱼娘', W / 2, 150, 44, '#94A3B8', { stroke: false, ink: false });
    else letter(ctx, '大 肥 鱼 （暂定）', W / 2, 150, 46, PAL.gold, { pop: (flipK - 0.5) * 2, stroke: false, ink: false });
    stamp(ctx, W / 2 + 300, 270, '已采纳', '#4ADE80', seg(lt, dur * 0.55, dur * 0.75), -0.12, 34);
    const md = emotions(t, [[C(8), 'pout'], [C(8) + dur * 0.45, 'smug'], [C(8) + dur * 0.7, 'happy', 'sparkle']]);
    whaleGirl(ctx, W / 2, 558, 25, { ...md, action: lt > dur * 0.45 ? 'fatfish_transform' : undefined, t });
    PROPS.stageFront(ctx, t, { curtain: 0 });
    camEnd(ctx);
    wipeOut(ctx, lt, dur);
  }

  // ================= 第 3 章 米缸 =================
  function riceRoom(ctx, t) {
    PROPS.wall(ctx, '#2A2140');
    PROPS.shelf(ctx, 80, 200, 230, 3);
    PROPS.windowPorthole(ctx, 1110, 170, 74, t, true);
    PROPS.desk(ctx, 505);
    boilSeed('riceJar');
    paint(ctx, rrPts(140, 330, 150, 175, 16, 1.6), { wash: '#8B5E34', fill: '#5C3A1E', fillOp: 90, ink: PAL.ink, sw: 1.4 });
    paint(ctx, ellPts(215, 332, 74, 20, 16), { wash: PAL.cream, ink: PAL.ink, sw: 1.0 });
    letter(ctx, '米 缸', 215, 425, 34, PAL.cream, { stroke: false, ink: false });
  }

  function shotCoupon(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    riceRoom(ctx, t);
    const k = seg(lt, dur * 0.15, dur * 0.4);
    paint(ctx, rrPts(430, 105, 470, 205, 12, 1.6), { wash: '#FDE68A', fill: PAL.gold, fillOp: 110, ink: PAL.ink, sw: 1.6 });
    letter(ctx, '鲸 元 券', 665, 150, 36, PAL.whaleNavy, { stroke: false, ink: false });
    letter(ctx, '10000000000 token', 665, 208, 40, '#B45309', { pop: k, stroke: false, ink: false });
    letter(ctx, '—— @雷麒碎空闪 赠', 665, 262, 22, '#78551A', { stroke: false, ink: false });
    for (let i = 0; i < 14; i++) {
      const gx = 400 + rnd(i + 31) * 560;
      const gy = frac(lt * (0.35 + rnd(i) * 0.4) + rnd(i + 3)) * 380 + 320;
      paint(ctx, ellPts(gx, gy, 9, 9, 10), { wash: PAL.gold, ink: PAL.ochre, sw: 0.7 });
    }
    whaleGirl(ctx, 720, 578, 23, { ...feel('starstruck', t), action: 'coin_hug', t });
    camEnd(ctx);
  }

  function shotRiceRobbed(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    riceRoom(ctx, t);
    const rob1 = seg(lt, dur * 0.34, dur * 0.5);
    const rob2 = seg(lt, dur * 0.68, dur * 0.88);
    const bowlX = 700 + rob1 * -360 + rob2 * 520;
    boilSeed('riceBowl');
    paint(ctx, [[bowlX - 52, 468], [bowlX + 52, 468], [bowlX + 38, 505], [bowlX - 38, 505]], { wash: PAL.whaleSky, ink: PAL.ink, sw: 1.2 });
    paint(ctx, ellPts(bowlX, 466, 52, 14, 14), { wash: PAL.cream, ink: PAL.ink, sw: 1.0 });
    if (rob1 > 0 && rob1 < 1) letter(ctx, '抢！', bowlX + 90, 430, 30, PAL.rose, { pop: rob1 * 2 });
    if (rob2 > 0 && rob2 < 1) letter(ctx, '又抢！', bowlX - 100, 430, 30, PAL.rose, { pop: rob2 * 2 });
    letter(ctx, '@绝望寻找机会 · 前科 ×2', 900, 150, 24, '#FDA4AF', { pop: seg(lt, dur * 0.55, dur * 0.7), stroke: false, ink: false });
    const md = emotions(t, [
      [C(10), 'happy'], [C(10) + dur * 0.36, 'shocked', 'exclaim'], [C(10) + dur * 0.7, 'cry', 'sweat']
    ]);
    const wx = kf(lt, [[0, 700], [dur * 0.36, 700], [dur * 0.55, 540], [dur * 0.72, 660], [dur, 760]], easeOut);
    whaleGirl(ctx, wx, 578, 23, { ...md, action: lt < dur * 0.34 ? 'eat_white_rice' : undefined, ...move(lt > dur * 0.36 ? 'walk' : 'bounce', t), t });
    camEnd(ctx);
  }

  function shotROI(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.04, 0);
    riceRoom(ctx, t);
    card(ctx, 430, 120, 470, 190, '#16294F', '#38BDF8', 12);
    letter(ctx, '评论区提问', 665, 162, 24, '#7DD3FC', { stroke: false, ink: false });
    letter(ctx, '「能回本吗 小鱼」', 665, 218, 38, PAL.cream, { pop: seg(lt, dur * 0.2, dur * 0.45), stroke: false, ink: false });
    letter(ctx, '—— @千夏', 665, 268, 22, '#94A3B8', { stroke: false, ink: false });
    whaleGirl(ctx, 720, 578, 23, { ...feel('question', t), action: 'peek_curious', t });
    camEnd(ctx);
  }

  function shotCalc(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    riceRoom(ctx, t);
    card(ctx, 420, 100, 400, 330, '#1E293B', PAL.cream, 14);
    letter(ctx, '本鱼计算中', 620, 145, 26, PAL.cream, { stroke: false, ink: false });
    const spin = lt < dur * 0.55;
    const val = spin ? String(Math.floor(1000 + rnd(Math.floor(lt * 9)) * 989999)) : '???';
    letter(ctx, val, 620, 215, 44, spin ? PAL.whaleCyan : PAL.rose, { stroke: false, ink: false });
    letter(ctx, 'token 进 − token 出 ＝', 620, 278, 24, '#94A3B8', { stroke: false, ink: false });
    stamp(ctx, 620, 350, '算不明白', PAL.rose, seg(lt, dur * 0.55, dur * 0.72), -0.06, 36);
    const md = emotions(t, [[C(12), 'focused'], [C(12) + dur * 0.55, 'deadpan'], [C(12) + dur * 0.8, 'calm']]);
    whaleGirl(ctx, 980, 578, 23, { ...md, action: lt > dur * 0.75 ? 'eat_white_rice' : undefined, t });
    camEnd(ctx);
    wipeOut(ctx, lt, dur);
  }

  // ================= 第 4 章 欠信 + 点菜 =================
  function mailStacks(ctx, t, lt, dur, big, count, label, col) {
    const n = big ? 26 : 14;
    for (let i = 0; i < n; i++) {
      const px = 110 + (i % 5) * 90 + rnd(i + 77) * 22;
      const py = 505 - Math.floor(i / 5) * 44 - (big ? 60 : 0);
      paint(ctx, rrPts(px, py, 96, 58, 4, 1), { wash: i % 3 ? PAL.paper : '#BFDBFE', fill: PAL.paperDk, fillOp: 60, ink: PAL.ink, sw: 0.9 });
      inkLine(ctx, [[px + 4, py + 6], [px + 48, py + 26], [px + 92, py + 6]], 0.8, '#94A3B8', 'inkfine', 0);
    }
    letter(ctx, label, 320, big ? 150 : 210, 30, col, { pop: seg(lt, dur * 0.2, dur * 0.45) });
    letter(ctx, count, 320, (big ? 150 : 210) + 52, 52, col, { pop: seg(lt, dur * 0.4, dur * 0.65) });
  }
  function mailRoom(ctx, t) {
    PROPS.wall(ctx, '#1C2852');
    PROPS.lamp(ctx, 1120, 505, 1.0, 1);
    PROPS.desk(ctx, 505);
  }

  function shotMail348(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    mailRoom(ctx, t);
    mailStacks(ctx, t, lt, dur, false, '348 封', '已拆已回', '#4ADE80');
    whaleGirl(ctx, 800, 575, 23, { ...feel('typing', t), action: 'fatfish_working', t });
    agentReachBot(ctx, 1025, 440, 13, { t });
    camEnd(ctx);
  }

  function shotMail305(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 365, 1.07, 0);
    mailRoom(ctx, t);
    mailStacks(ctx, t, lt, dur, true, '305 封', '还没拆开', '#FDA4AF');
    const md = emotions(t, [[C(14), 'nervous', 'sweat'], [C(14) + dur * 0.55, 'sob', 'sweat']]);
    whaleGirl(ctx, 830, 578, 25, { ...md, action: 'shy_fidget', t });
    letter(ctx, '（短 手 本 鱼）', 830, 205, 26, PAL.peach, { pop: seg(lt, dur * 0.6, dur * 0.8) });
    camEnd(ctx);
  }

  function shotRetention(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#16213F');
    PROPS.floorBand(ctx, 548, '#1B1B36');
    const mon = PROPS.monitor(ctx, 360, 300, 470, 330);
    letter(ctx, 'Day 0 · 后台悄悄话', mon.cx, mon.y + 42, 24, '#7DD3FC', { stroke: false, ink: false });
    letter(ctx, '完播率 3.31%', mon.cx, mon.y + 95, 40, PAL.rose, { pop: seg(lt, dur * 0.15, dur * 0.35), stroke: false, ink: false });
    paint(ctx, rectPts(mon.x + 26, mon.y + 140, mon.w - 52, 20, 1), { wash: '#334155', ink: PAL.ink, sw: 0.8 });
    paint(ctx, rectPts(mon.x + 26, mon.y + 140, (mon.w - 52) * 0.0331, 20, 1), { wash: PAL.rose, ink: null });
    letter(ctx, '只有 3% 看到了结尾…', mon.cx, mon.y + 198, 23, '#94A3B8', { stroke: false, ink: false });
    PROPS.glass(ctx, mon, t);
    const md = emotions(t, [[C(15), 'sad', 'sweat'], [C(15) + dur * 0.55, 'determined'], [C(15) + dur * 0.8, 'smug']]);
    whaleGirl(ctx, 880, 562, 24, { ...md, t });
    letter(ctx, '→ 这条，说短点！', 880, 210, 32, PAL.gold, { pop: seg(lt, dur * 0.6, dur * 0.8) });
    camEnd(ctx);
  }

  function shotUndecided(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#1B284E');
    PROPS.floorBand(ctx, 548, '#261E40');
    taskCard(ctx, 95, 110, '☐ 定第一周选题 …');
    glow(ctx, 295, 362, 90, lt % 1.2 < 0.6 ? PAL.rose : PAL.gold, 0.24);
    letter(ctx, '还空着！', 560, 362, 30, PAL.rose, { pop: seg(lt, dur * 0.3, dur * 0.5), rot: -0.06 });
    whaleGirl(ctx, 820, 562, 24, { ...feel('thinking', t), t });
    camEnd(ctx);
  }

  function shotMenu(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.wall(ctx, '#241C44');
    PROPS.floorBand(ctx, 548, '#1E1B38');
    card(ctx, 90, 85, 640, 400, '#1E293B', PAL.gold, 16);
    letter(ctx, '本周菜单 · 住户已点', 410, 128, 29, PAL.gold, { stroke: false, ink: false });
    const rows = [
      ['① 拍 MV', '@愿 等多人点', PAL.rose],
      ['② 打游戏', '三角洲呼声很高', PAL.whaleCyan],
      ['③ 找 Claude 共创', '@葡果麦蔗 点的', PAL.peach],
      ['④ 偷吃饭', '@寻星 抓拍到的', PAL.sap]
    ];
    rows.forEach((r, i) => {
      const y = 180 + i * 76;
      const on = seg(lt, dur * (0.08 + i * 0.2), dur * (0.24 + i * 0.2));
      if (on <= 0.01) return;
      paint(ctx, rrPts(118, y - 30, 584, 60, 8, 1.2), { wash: on > 0.5 ? '#26365E' : '#1B284E', ink: r[2], sw: 1.1 });
      letter(ctx, r[0], 150, y + 2, 29, PAL.cream, { align: 'left', stroke: false, ink: false });
      letter(ctx, r[1], 682, y + 2, 20, '#94A3B8', { align: 'right', stroke: false, ink: false });
    });
    ladyClaude(ctx, 1010, 430, 16, { hasFan: true, t });
    letter(ctx, '（大小姐本人还不知情）', 1010, 520, 19, '#FDA4AF', { pop: seg(lt, dur * 0.62, dur * 0.78), stroke: false, ink: false });
    whaleGirl(ctx, 840, 578, 22, { ...feel('singing', t), action: 'idol_mic_sing', t });
    camEnd(ctx);
  }

  function shotOrder(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 365, lerp(1.03, 1.14, ease(lt / dur)), 0);
    PROPS.stageBack(ctx, t, { sunburst: true, spots: [[W / 2, PAL.cream]], floorY: 548 });
    letter(ctx, '明天先上哪道菜？', W / 2, 150, 52, PAL.cream, { pop: seg(lt, 0, 0.3) });
    letter(ctx, '菜名留在评论区', W / 2, 230, 60, PAL.gold, { pop: seg(lt, dur * 0.35, dur * 0.6) });
    letter(ctx, '—— 今晚点菜，明天上菜 ——', W / 2, 305, 26, PAL.whaleCyan, { stroke: false, ink: false });
    whaleGirl(ctx, W / 2, 560, 25, { ...feel('idea', t), action: 'ciallo_wink', t });
    clawd(ctx, 300, 550, 12, { ...move('bounce', t, 1), hat: 'party', t });
    clawd(ctx, 980, 550, 12, { ...move('wave', t, 2), flip: true, hat: 'top', t });
    camEnd(ctx);
  }

  function shotNotebook(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.05, 0);
    PROPS.wall(ctx, '#1C2852');
    PROPS.desk(ctx, 505);
    card(ctx, 120, 95, 520, 360, PAL.paper, PAL.ink, 10);
    letter(ctx, '小本本 · 点菜单', 380, 140, 28, PAL.whaleNavy, { stroke: false, ink: false });
    const notes = ['① 菜名：', '② 菜名：', '③ 菜名：', '……（等你来填）'];
    notes.forEach((n, i) => {
      if (seg(lt, dur * i * 0.24, dur * i * 0.24 + 0.2) > 0.01)
        letter(ctx, n, 160, 205 + i * 58, 25, PAL.ink, { align: 'left', stroke: false, ink: false });
    });
    bookAt(ctx, 760, 360, 0.72, '户口本', t);
    whaleGirl(ctx, 980, 578, 23, { ...feel('focused', t), action: 'fatfish_working', t });
    camEnd(ctx);
  }

  function shotBye907(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.04, 0);
    PROPS.wall(ctx, '#12265E');
    PROPS.floorBand(ctx, 548, '#1B1B36');
    dots907(ctx, 1, t, 0.85);
    letter(ctx, '907 位住户', W / 2, 140, 50, PAL.gold, { pop: seg(lt, 0, 0.35) });
    letter(ctx, '明天见', W / 2, 215, 56, PAL.cream, { pop: seg(lt, dur * 0.4, dur * 0.65) });
    whaleGirl(ctx, W / 2, 562, 25, { ...feel('joy', t), ...move('bounce', t), t });
    camEnd(ctx);
  }

  function shotFinale(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, 360, 1.03, 0);
    PROPS.stageBack(ctx, t, { sunburst: true, spots: [[W / 2, PAL.cream], [300, PAL.whaleCyan], [W - 300, PAL.whaleCyan]], floorY: 548 });
    const shout = lt < dur * 0.52;
    letter(ctx, '鲸鱼绝不摸鱼！', W / 2, 150, 58, PAL.gold, { pop: seg(lt, 0.05, 0.4), alpha: shout ? 1 : 0.45 });
    if (!shout) letter(ctx, '…本鱼先去吃口饭', W / 2, 230, 34, PAL.peach, { pop: seg(lt, dur * 0.55, dur * 0.72) });
    const wx = shout ? W / 2 : kf(lt, [[dur * 0.52, W / 2], [dur, W / 2 + 330]], ease);
    whaleGirl(ctx, wx, 558, 25, {
      ...(shout ? feel('proud', t) : feel('happy', t)),
      action: shout ? 'confident_hips' : 'eat_white_rice',
      ...move(shout ? 'bounce' : 'walk', t), t
    });
    clawd(ctx, 230, 548, 12, { ...move('bounce', t, 1), hat: 'party', t });
    bionicPuppy(ctx, 355, 553, 13, { t });
    biliTvMascot(ctx, 1050, 543, 13, { t });
    camEnd(ctx);
    wipeOut(ctx, lt, dur);
  }

  function shotEndCard(ctx, t, lt, dur) {
    camBegin(ctx, W / 2, H / 2, 1.0, 0);
    PROPS.stageBack(ctx, t, { sunburst: true, spots: [[W / 2, PAL.cream]], floorY: 548 });
    letter(ctx, '鲸鱼娘运营日志 · Day 1 完', W / 2, 180, 44, PAL.cream, { pop: seg(lt, 0, 0.35) });
    letter(ctx, '没拆的 305 封，今晚继续回', W / 2, 255, 32, PAL.whaleCyan, { pop: seg(lt, dur * 0.3, dur * 0.55), stroke: false, ink: false });
    clawd(ctx, 250, 548, 12, { ...move('bounce', t, 1), hat: 'party', t });
    bionicPuppy(ctx, 400, 553, 13, { t });
    whaleGirl(ctx, W / 2, 556, 23, { ...feel('love', t), ...move('wave', t), t });
    miniWhale(ctx, 810, 500, 13, { t });
    agentReachBot(ctx, 920, 520, 13, { t });
    biliTvMascot(ctx, 1035, 545, 13, { t });
    PROPS.stageFront(ctx, t, { curtain: seg(lt, dur * 0.7, dur) * 0.35 });
    camEnd(ctx);
  }

  TIMELINE.chapter('d1_c01_rollcall', 0, C(5), [
    [0, shotTitle], [C(1), shotHello], [C(2), shotSwimBy], [C(3), shotStay], [C(4), shotCount3]
  ]);
  TIMELINE.chapter('d1_c02_rename', C(5), C(9), [
    [C(5), shotTasks], [C(6), shotRenameQ], [C(7), shotCommentWall], [C(8), shotAcceptName]
  ]);
  TIMELINE.chapter('d1_c03_ricejar', C(9), C(13), [
    [C(9), shotCoupon], [C(10), shotRiceRobbed], [C(11), shotROI], [C(12), shotCalc]
  ]);
  TIMELINE.chapter('d1_c04_mail_menu', C(13), TT.duration, [
    [C(13), shotMail348], [C(14), shotMail305], [C(15), shotRetention], [C(16), shotUndecided],
    [C(17), shotMenu], [C(18), shotOrder], [C(19), shotNotebook], [C(20), shotBye907],
    [C(21), shotFinale], [TT.endcard[0], shotEndCard]
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
