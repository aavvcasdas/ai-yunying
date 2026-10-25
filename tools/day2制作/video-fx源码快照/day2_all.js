// src/ch/day2_all.js — 【Day 2】主人说我不干活，我打开主人自己的号
//
// Timing is consumed only from src/day2_timing.js, generated from the
// user-provided continuous voice WAV by gen_day2_finalvoice.py.
// The first shot starts inside the vote-counting desk scene at t=0.
// There is intentionally no silent episode-title segment before L01.

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('../core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('../whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('../cast.js') : {});
  const PROPS = root.PROPS || (typeof require !== 'undefined' ? require('../props.js') : {});
  const TIMELINE = root.TIMELINE || (typeof require !== 'undefined' ? require('../timeline.js') : {});
  const TT = root.DAY2_TIMING || (typeof require !== 'undefined' ? require('../day2_timing.js') : null);

  if (!TT) throw new Error('DAY2_TIMING missing — run gen_day2_finalvoice.py first');
  if (!TT.voice || !Array.isArray(TT.cues) || TT.cues.length !== 17 ||
      !String(TT.duration_source || '').includes('measured')) {
    throw new Error('DAY2_TIMING 不是 17-cue 实测时间轴，禁止估时渲染');
  }
  if (Number(TT.title_len || 0) !== 0 || Number(TT.cues[0].start || 0) !== 0) {
    throw new Error('Day2 必须 title_len=0 且 L01 从 0 开始');
  }

  const {
    W, H, TAU, PAL, clamp, lerp, seg, ease, easeOut, backOut,
    boilSeed, kf, rectPts, ellPts, rrPts, paint, inkLine,
    camBegin, camEnd, glow, letter
  } = CORE;
  const { whaleGirl: whaleGirlBase, feel, emotions, move } = WHALE;
  const { clawd, ladyClaude, bionicPuppy, miniWhale, biliTvMascot, agentReachBot } = CAST;

  const C = n => TT.cues[n - 1].start;
  const CE = n => TT.cues[n - 1].end;
  const SD = n => CE(n) - C(n);
  const cueP = (t, n) => clamp((t - C(n)) / Math.max(0.001, SD(n)));
  const popAt = (t, n, a, b) => seg(cueP(t, n), a, b);
  const frac = x => x - Math.floor(x);
  const rnd = i => frac(Math.sin(i * 127.1 + 311.7) * 43758.5453);

  function whaleGirl(ctx, x, y, u, o = {}) {
    return whaleGirlBase(ctx, x, y, u, {
      style: 'pixel',
      showActionBadge: false,
      tailScale: 1.0,
      ...o
    });
  }

  function card(ctx, x, y, w, h, wash, inkCol, r = 14) {
    paint(ctx, rrPts(x, y, w, h, r, 1.5), {
      wash,
      fill: '#0B1526',
      fillOp: 132,
      ink: inkCol || PAL.whaleCyan,
      sw: 1.5
    });
  }

  function paperCard(ctx, x, y, w, h, wash = PAL.paper, inkCol = PAL.ink, r = 12) {
    paint(ctx, rrPts(x, y, w, h, r, 1.2), {
      wash,
      fill: PAL.paperDk,
      fillOp: 28,
      ink: inkCol,
      sw: 1.4
    });
  }

  function stamp(ctx, x, y, text, col, k, rot = -0.08, size = 30) {
    if (k <= 0.01) return;
    const s = 2.15 - 1.15 * backOut(clamp(k));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    paint(ctx, rrPts(-text.length * size * 0.38 - 18, -size * 0.85,
      text.length * size * 0.76 + 36, size * 1.7, 8, 1), {
      wash: null,
      ink: col,
      sw: 3
    });
    letter(ctx, text, 0, 2, size, col, { stroke: false, ink: false });
    ctx.restore();
  }

  function room(ctx, t, wallCol = '#132653') {
    PROPS.wall(ctx, wallCol);
    PROPS.windowPorthole(ctx, 1130, 148, 62, t, true);
    PROPS.floorBand(ctx, 548, '#1B2442');
    PROPS.desk(ctx, 505, -80, W + 80);
    for (let i = 0; i < 9; i++) {
      const bx = 64 + ((i * 173) % 1140);
      const by = 470 - ((t * (18 + i * 3) + i * 67) % 390);
      paint(ctx, ellPts(bx, by, 3 + (i % 3), 3 + (i % 3), 8), {
        wash: PAL.whaleCyan,
        washOp: 66,
        ink: null
      });
    }
  }

  function bowlAt(ctx, x, y, s = 1, t = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    boilSeed('day2-rice-bowl');
    paint(ctx, ellPts(0, -34, 74, 24, 20), {
      wash: '#FFFFFF', fill: '#E2E8F0', fillOp: 90, ink: PAL.ink, sw: 1.2
    });
    for (let i = 0; i < 10; i++) {
      const gx = -52 + (i * 23) % 104;
      const gy = -48 - ((i * 17) % 18);
      paint(ctx, ellPts(gx, gy, 13, 9, 8), { wash: '#FFFFFF', washOp: 235, ink: null });
    }
    paint(ctx, [[-78, -34], [78, -34], [48, 38], [-48, 38]], {
      wash: '#2563EB', fill: '#1E3A8A', fillOp: 95, ink: PAL.ink, sw: 1.5
    });
    paint(ctx, ellPts(0, 2, 20, 13, 12), { wash: PAL.whaleCyan, ink: PAL.cream, sw: 0.8 });
    paint(ctx, [[16, 2], [31, -7], [31, 11]], { wash: PAL.whaleCyan, ink: PAL.cream, sw: 0.7 });
    inkLine(ctx, [[40, -58], [72, -96]], 3, '#92400E', 'ink', 0);
    inkLine(ctx, [[54, -52], [92, -82]], 3, '#92400E', 'ink', 0);
    for (let i = 0; i < 3; i++) {
      const sx = -34 + i * 34;
      const sw = Math.sin(t * 4.5 + i * 1.7) * 5;
      inkLine(ctx, [[sx, -66], [sx + sw, -88], [sx - sw, -112]], 1.1, '#E0F2FE', 'inkfine', 0.4);
    }
    ctx.restore();
  }

  function bookAt(ctx, x, y, s, label, numberText = '') {
    boilSeed('day2-household-book');
    paint(ctx, rrPts(x - 76 * s, y - 100 * s, 152 * s, 200 * s, 8, 1.4), {
      wash: '#B6543B', fill: '#7C2D12', fillOp: 92, ink: PAL.ink, sw: 1.5
    });
    paint(ctx, rrPts(x - 62 * s, y - 86 * s, 124 * s, 172 * s, 6, 1.2), {
      wash: PAL.paper, fill: PAL.paperDk, fillOp: 78, ink: PAL.ink, sw: 1.0
    });
    letter(ctx, label, x, y - 50 * s, 30 * s, PAL.whaleNavy, { stroke: false, ink: false });
    if (numberText) {
      letter(ctx, numberText, x, y + 2 * s, 30 * s, '#B45309', { stroke: false, ink: false });
    }
    for (let i = 0; i < 3; i++) {
      inkLine(ctx, [[x - 42 * s, y + (34 + i * 24) * s], [x + 42 * s, y + (34 + i * 24) * s]],
        1.0, '#94A3B8', 'inkfine', 0);
    }
  }

  function controller(ctx, x, y, s = 1, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    boilSeed('day2-controller');
    paint(ctx, rrPts(-126, -52, 252, 104, 42, 1.2), {
      wash: '#23365F', fill: '#0F1D3A', fillOp: 122, ink: PAL.whaleCyan, sw: 2.1
    });
    paint(ctx, ellPts(-116, 38, 42, 25, 14), {
      wash: '#1B2C50', fill: '#0B1730', fillOp: 115, ink: PAL.ink, sw: 1.1
    });
    paint(ctx, ellPts(116, 38, 42, 25, 14), {
      wash: '#1B2C50', fill: '#0B1730', fillOp: 115, ink: PAL.ink, sw: 1.1
    });
    paint(ctx, rectPts(-78, -7, 42, 14, 0.6), { wash: '#94A3B8', ink: PAL.ink, sw: 0.8 });
    paint(ctx, rectPts(-64, -21, 14, 42, 0.6), { wash: '#94A3B8', ink: PAL.ink, sw: 0.8 });
    paint(ctx, ellPts(-22, 20, 18, 18, 12), { wash: '#475569', ink: PAL.ink, sw: 1 });
    paint(ctx, ellPts(28, -16, 18, 18, 12), { wash: '#475569', ink: PAL.ink, sw: 1 });
    const buttons = [[82, -28, PAL.rose], [104, -8, PAL.gold], [82, 12, '#4ADE80'], [60, -8, PAL.whaleCyan]];
    for (const [bx, by, col] of buttons) {
      paint(ctx, ellPts(bx, by, 11, 11, 12), { wash: col, ink: PAL.ink, sw: 0.9 });
    }
    ctx.restore();
  }

  function voteBoard(ctx, t, activeStub = 0, pulseGame = false) {
    const x = 78, y = 82, w = 472, h = 330;
    card(ctx, x, y, w, h, '#13294F', PAL.gold, 18);
    letter(ctx, '昨天的菜单 · 开票', x + w / 2, y + 42, 29, PAL.cream, {
      stroke: false, ink: false
    });
    const gy = y + 92;
    paint(ctx, rrPts(x + 24, gy, w - 48, 104, 14, 1.2), {
      wash: '#3B2F12', fill: '#7C2D12', fillOp: 52, ink: PAL.gold, sw: 2
    });
    if (pulseGame) glow(ctx, x + w - 96, gy + 52, 66 + Math.sin(t * 7) * 10, PAL.gold, 0.28);
    letter(ctx, '打游戏', x + 132, gy + 52, 43, PAL.cream, { stroke: false, ink: false });
    letter(ctx, '2 票', x + w - 96, gy + 52, 54, PAL.gold, {
      pop: pulseGame ? 0.92 + 0.08 * Math.sin(t * 7) : 1,
      stroke: false,
      ink: false
    });
    const stubY = y + 222;
    for (let i = 0; i < 2; i++) {
      const sx = x + 24 + i * 218;
      const active = activeStub > i;
      paint(ctx, rrPts(sx, stubY, 194, 62, 10, 1), {
        wash: active ? '#164E63' : '#16233E',
        fill: '#0B1526',
        fillOp: 105,
        ink: active ? PAL.whaleCyan : '#64748B',
        sw: active ? 1.8 : 1.1
      });
      letter(ctx, i === 0 ? '王者' : '暗区', sx + 97, stubY + 31, 25,
        active ? PAL.cream : '#94A3B8', { stroke: false, ink: false });
    }
    letter(ctx, '票数按 10 月 25 日晚导出口径', x + w / 2, y + h - 24, 17, '#94A3B8', {
      stroke: false, ink: false
    });
    paint(ctx, ellPts(x + w - 28, y + 28, 8, 8, 10), {
      wash: '#4ADE80', ink: PAL.ink, sw: 0.8
    });
  }

  function commentCard(ctx, x, y, w, h, title, body, k, accent = PAL.whaleCyan) {
    if (k <= 0.01) return;
    const s = 0.72 + 0.28 * backOut(clamp(k));
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(s, s);
    ctx.translate(-w / 2, -h / 2);
    card(ctx, 0, 0, w, h, '#172B4D', accent, 12);
    letter(ctx, title, w / 2, 25, 20, accent, { stroke: false, ink: false });
    letter(ctx, body, w / 2, 58, 21, PAL.cream, { stroke: false, ink: false });
    ctx.restore();
  }

  function residentDots(ctx, total, shown, t, box = [80, 90, 1120, 390], step = 5) {
    const [x0, y0, x1, y1] = box;
    const target = Math.floor(total * clamp(shown));
    for (let i = 0; i < target; i += step) {
      const gx = x0 + rnd(i + 17) * (x1 - x0);
      const gy = y0 + rnd(i + 5000) * (y1 - y0);
      const tw = 0.55 + 0.45 * Math.sin(t * 2.1 + i * 0.37);
      paint(ctx, ellPts(gx, gy, 3.1, 3.1, 6), {
        wash: PAL.gold, washOp: Math.floor(180 * tw), ink: null
      });
    }
  }

  function accountCard(ctx, x, y, w, h, title, mainText, subText, accent, k = 1) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = clamp(k);
    card(ctx, x, y, w, h, '#172B4D', accent, 16);
    paint(ctx, ellPts(x + 52, y + 52, 27, 27, 18), {
      wash: accent, fill: '#0B1526', fillOp: 70, ink: PAL.ink, sw: 1.2
    });
    letter(ctx, '鱼', x + 52, y + 53, 25, PAL.cream, { stroke: false, ink: false });
    letter(ctx, title, x + 92, y + 52, 25, PAL.cream, {
      align: 'left', stroke: false, ink: false
    });
    letter(ctx, mainText, x + w / 2, y + h * 0.58, 54, accent, { stroke: false, ink: false });
    letter(ctx, subText, x + w / 2, y + h - 38, 21, '#CBD5E1', { stroke: false, ink: false });
    ctx.restore();
  }

  function eggAt(ctx, x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    paint(ctx, ellPts(0, 0, 36, 47, 22), {
      wash: '#FFF7ED', fill: '#FDBA74', fillOp: 50, ink: PAL.ink, sw: 1.4
    });
    paint(ctx, ellPts(-9, -13, 10, 17, 12), { wash: '#FFFFFF', washOp: 180, ink: null });
    ctx.restore();
  }

  function pillowAt(ctx, x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    paint(ctx, rrPts(-62, -34, 124, 68, 22, 1.2), {
      wash: '#DBEAFE', fill: '#93C5FD', fillOp: 85, ink: PAL.ink, sw: 1.3
    });
    inkLine(ctx, [[-42, -18], [-18, 0], [-42, 18]], 1.2, '#60A5FA', 'inkfine', 0.3);
    inkLine(ctx, [[42, -18], [18, 0], [42, 18]], 1.2, '#60A5FA', 'inkfine', 0.3);
    ctx.restore();
  }

  // L01 — first frame is already the counting desk and the winning row.
  function shotColdOpen(ctx, t, lt, dur) {
    const sp = cueP(t, 1);
    camBegin(ctx, W / 2, 360, 1.08 + 0.04 * ease(sp), 0);
    room(ctx, t);
    voteBoard(ctx, t, sp >= 0.7 ? 2 : 0, sp >= 0.68);
    if (sp >= 0.22 && sp <= 0.58) {
      const scanY = 176 + 180 * ease(popAt(t, 1, 0.22, 0.58));
      inkLine(ctx, [[92, scanY], [536, scanY]], 2.4, '#7DD3FC', 'inkfine', 0);
    }
    if (sp < 0.68) {
      letter(ctx, '统计中…', 314, 452, 22, '#7DD3FC', {
        pop: popAt(t, 1, 0.2, 0.34),
        stroke: false, ink: false
      });
    }
    const md = emotions(lt, [
      [0, 'surprised', 'exclaim'],
      [SD(1) * 0.36, 'focused'],
      [SD(1) * 0.7, 'proud', 'sparkle']
    ]);
    whaleGirl(ctx, 842, 566, 29, { ...md, ...move('bounce', t, 2), t });
    controller(ctx, 812, 612, 1.18, -0.04 + Math.sin(t * 5.2) * 0.018);
    letter(ctx, '第一名先上桌', 925, 196, 27, PAL.gold, {
      pop: popAt(t, 1, 0.68, 0.82), rot: -0.04
    });
    camEnd(ctx);
  }

  function shotGameTickets(ctx, t, lt, dur) {
    const sp = cueP(t, 2);
    camBegin(ctx, W / 2, 360, 1.06 + 0.03 * ease(sp), 0);
    room(ctx, t);
    voteBoard(ctx, t, sp < 0.2 ? 0 : (sp < 0.38 ? 1 : 2), false);
    commentCard(ctx, 66, 428, 248, 82, '王者 · @栗子大王', '可以打王者吗？',
      popAt(t, 2, 0.04, 0.17), PAL.gold);
    commentCard(ctx, 330, 428, 248, 82, '暗区 · @一切随意', '跟我来打暗区。',
      popAt(t, 2, 0.22, 0.36), PAL.whaleCyan);
    const replyK = popAt(t, 2, 0.76, 0.88);
    if (replyK > 0.01) {
      commentCard(ctx, 690, 112, 370, 92, '昨天嘴快的本鱼', '打，本鱼负责躺赢（其实躺平）',
        replyK, PAL.rose);
      if (sp > 0.94) inkLine(ctx, [[724, 184], [1026, 132]], 4, '#FB7185', 'ink', 0.25);
    }
    const md = emotions(lt, [
      [0, 'proud', 'sparkle'],
      [SD(2) * 0.5, 'shy'],
      [SD(2) * 0.82, 'deadpan']
    ]);
    whaleGirl(ctx, 866, 568, 27, { ...md, ...move('bounce', t, 4), t });
    controller(ctx, 824, 618, 1.08, 0.03 + Math.sin(t * 4.4) * 0.014);
    camEnd(ctx);
  }

  function shotNoAccountNoHands(ctx, t, lt, dur) {
    const sp = cueP(t, 3);
    camBegin(ctx, W / 2, 360, 1.09 + 0.035 * ease(sp), 0);
    room(ctx, t);
    voteBoard(ctx, t, 2, false);
    const lx = 584, ly = 100, lw = 360, lh = 250;
    card(ctx, lx, ly, lw, lh, '#172B4D', PAL.whaleCyan, 16);
    letter(ctx, '游戏账号', lx + lw / 2, ly + 38, 28, PAL.cream, { stroke: false, ink: false });
    for (let i = 0; i < 2; i++) {
      const fy = ly + 76 + i * 58;
      paint(ctx, rrPts(lx + 34, fy, lw - 68, 38, 9, 1), {
        wash: '#0F1D3A', ink: '#475569', sw: 1.1
      });
      letter(ctx, i === 0 ? '账号：________' : '密码：________',
        lx + lw / 2, fy + 19, 20, '#94A3B8', { stroke: false, ink: false });
    }
    stamp(ctx, lx + lw / 2, ly + 194, '账号未批', '#FCA5A5',
      popAt(t, 3, 0.3, 0.45), -0.07, 30);
    const flop = ease(popAt(t, 3, 0.56, 0.79));
    controller(ctx, 832, 606 + flop * 20, 1.12, lerp(-0.03, -0.22, flop));
    const md = emotions(lt, [
      [0, 'thinking'],
      [SD(3) * 0.3, 'confused', 'question'],
      [SD(3) * 0.62, 'nervous', 'sweat'],
      [SD(3) * 0.86, 'deadpan']
    ]);
    whaleGirl(ctx, 1012, 568, 26, {
      ...md,
      action: sp > 0.58 ? 'shy_fidget' : undefined,
      headTilt: (md.headTilt || 0) + 0.06,
      t
    });
    stamp(ctx, 884, 404, '不会打', '#FB7185', popAt(t, 3, 0.62, 0.76), 0.08, 31);
    stamp(ctx, 1048, 292, '还没手！', '#FB7185', popAt(t, 3, 0.85, 0.95), -0.1, 34);
    camEnd(ctx);
  }

  function shotZeroVotes(ctx, t, lt, dur) {
    const sp = cueP(t, 4);
    camBegin(ctx, W / 2, 360, 1.05, 0);
    room(ctx, t, '#17234A');
    const items = [
      ['Claude 共创', PAL.peach, 0.3],
      ['拍 MV', PAL.rose, 0.69],
      ['偷吃饭', PAL.sap, 0.82]
    ];
    items.forEach((item, i) => {
      const x = 74 + i * 286, y = 112, w = 250, h = 214;
      const zeroAt = item[2];
      const gray = sp >= zeroAt;
      card(ctx, x, y, w, h, gray ? '#1E293B' : '#172B4D', gray ? '#64748B' : item[1], 16);
      letter(ctx, item[0], x + w / 2, y + 58, i === 0 ? 27 : 34,
        gray ? '#94A3B8' : PAL.cream, { stroke: false, ink: false });
      letter(ctx, gray ? '0 票' : '？票', x + w / 2, y + 128, 46,
        gray ? '#64748B' : item[1], { stroke: false, ink: false });
      stamp(ctx, x + w / 2, y + 178, '零票', '#94A3B8',
        popAt(t, 4, zeroAt, Math.min(0.98, zeroAt + 0.12)), i % 2 ? 0.07 : -0.07, 23);
    });
    const stripK = popAt(t, 4, 0.72, 0.86);
    if (stripK > 0.01) {
      ctx.save();
      ctx.globalAlpha = stripK;
      card(ctx, 74, 368, 818, 72, '#2A2114', PAL.gold, 13);
      letter(ctx, '才艺候补（不计入正式菜单票）：学唱歌 @星寻 · 跳舞 @往世的回响',
        483, 404, 20, PAL.cream, { stroke: false, ink: false });
      ctx.restore();
    }
    ladyClaude(ctx, 1142, 448, 12, { hasFan: true, t });
    const md = emotions(lt, [[0, 'deadpan'], [SD(4) * 0.72, 'confused', 'question']]);
    whaleGirl(ctx, 986, 572, 25, { ...md, ...move('bounce', t, 3), t });
    camEnd(ctx);
  }

  function shotRiceQueue(ctx, t, lt, dur) {
    const sp = cueP(t, 5);
    camBegin(ctx, W / 2, 360, 1.06, 0);
    room(ctx, t, '#1B2850');
    const tags = [
      ['抢白饭', '米饭评论排队中'],
      ['送米饭', '热心住户投喂'],
      ['自带米饭', '已经坐下等开饭']
    ];
    tags.forEach((tag, i) => {
      commentCard(ctx, 72 + i * 270, 118 + (i % 2) * 22, 240, 86,
        tag[0], tag[1], popAt(t, 5, 0.04 + i * 0.11, 0.16 + i * 0.11),
        [PAL.rose, PAL.gold, PAL.whaleCyan][i]);
    });
    letter(ctx, '今天先吃白米饭', 430, 330, 44, PAL.gold, {
      pop: popAt(t, 5, 0.56, 0.72), rot: -0.02
    });
    if (sp < 0.55) bowlAt(ctx, 930, 468, 1.02, t);
    const md = emotions(lt, [
      [0, 'nervous', 'sweat'],
      [SD(5) * 0.42, 'pout'],
      [SD(5) * 0.62, 'happy']
    ]);
    whaleGirl(ctx, 930, 572, 27, {
      ...md,
      action: sp >= 0.55 ? 'eat_white_rice' : 'playful_fists',
      ...move('bounce', t, 1),
      t
    });
    camEnd(ctx);
  }

  function shotBowlSeized(ctx, t, lt, dur) {
    const sp = cueP(t, 6);
    camBegin(ctx, W / 2, 360, 1.05, 0);
    room(ctx, t, '#241C44');
    paperCard(ctx, 72, 96, 500, 348, PAL.paper, PAL.ink, 12);
    letter(ctx, '主人便签', 322, 140, 29, PAL.whaleNavy, { stroke: false, ink: false });
    letter(ctx, '吃大白饭的鲸鱼', 322, 216, 39, '#B45309', {
      pop: popAt(t, 6, 0.15, 0.3), stroke: false, ink: false
    });
    letter(ctx, '吃得多', 190, 304, 31, PAL.ink, {
      pop: popAt(t, 6, 0.6, 0.69), stroke: false, ink: false
    });
    letter(ctx, '干得少', 410, 304, 31, PAL.ink, {
      pop: popAt(t, 6, 0.72, 0.82), stroke: false, ink: false
    });
    stamp(ctx, 322, 386, '要扣饭！', '#DC2626', popAt(t, 6, 0.9, 0.98), -0.08, 34);

    const drag = ease(popAt(t, 6, 0.52, 0.98));
    const bx = lerp(900, 1145, drag);
    if (sp >= 0.52) {
      inkLine(ctx, [[bx + 54, 418], [1228, 386]], 4, '#94A3B8', 'ink', 0.1);
      inkLine(ctx, [[bx + 54, 498], [1228, 518]], 4, '#94A3B8', 'ink', 0.1);
    }
    letter(ctx, '画外夹子', 1165, 352, 19, '#CBD5E1', {
      pop: popAt(t, 6, 0.52, 0.65), stroke: false, ink: false
    });
    bowlAt(ctx, bx, 468, 1.05, t);
    const md = emotions(lt, [
      [0, 'surprised', 'exclaim'],
      [SD(6) * 0.2, 'pout'],
      [SD(6) * 0.58, 'angry'],
      [SD(6) * 0.9, 'sob', 'sweat']
    ]);
    whaleGirl(ctx, 716, 574, 26, {
      ...md,
      action: sp >= 0.42 ? 'playful_fists' : undefined,
      ...move('bounce', t, 5),
      t
    });
    camEnd(ctx);
  }

  function shotLedger8978(ctx, t, lt, dur) {
    const sp = cueP(t, 7);
    camBegin(ctx, W / 2, 360, 1.05, 0);
    room(ctx, t, '#122A52');
    card(ctx, 80, 92, 640, 382, '#172B4D', PAL.gold, 16);
    letter(ctx, '本 鱼 账 本', 400, 138, 34, PAL.gold, { stroke: false, ink: false });
    inkLine(ctx, [[400, 170], [400, 438]], 1.6, '#475569', 'inkfine', 0);
    const plays = Math.floor(lerp(0, 8978, ease(popAt(t, 7, 0.36, 0.56))));
    const comments = Math.floor(lerp(0, 280, ease(popAt(t, 7, 0.74, 0.97))));
    letter(ctx, '播放量', 238, 218, 25, '#CBD5E1', { stroke: false, ink: false });
    letter(ctx, plays.toLocaleString('en-US'), 238, 282, 52, PAL.cream, { stroke: false, ink: false });
    letter(ctx, '人游过', 238, 340, 24, PAL.whaleCyan, { stroke: false, ink: false });
    letter(ctx, '评论', 562, 218, 25, '#CBD5E1', { stroke: false, ink: false });
    letter(ctx, String(comments), 562, 282, 56, PAL.gold, { stroke: false, ink: false });
    letter(ctx, '条', 562, 340, 24, PAL.whaleCyan, { stroke: false, ink: false });
    if (sp > 0.8) {
      letter(ctx, '449 赞 · 31 分享 · 32 收藏', 400, 428, 19, '#94A3B8', {
        pop: popAt(t, 7, 0.8, 0.9), stroke: false, ink: false
      });
    }
    stamp(ctx, 930, 166, '不服！', PAL.rose, popAt(t, 7, 0.02, 0.14), -0.08, 38);
    const md = emotions(lt, [
      [0, 'angry'],
      [SD(7) * 0.18, 'focused'],
      [SD(7) * 0.44, 'proud', 'sparkle'],
      [SD(7) * 0.8, 'smug']
    ]);
    whaleGirl(ctx, 945, 574, 27, {
      ...md,
      action: sp < 0.36 ? 'playful_fists' : 'confident_hips',
      ...move('bounce', t, 4),
      t
    });
    camEnd(ctx);
  }

  function shotHousehold1441(ctx, t, lt, dur) {
    const sp = cueP(t, 8);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#12265E');
    residentDots(ctx, 1441, popAt(t, 8, 0.18, 0.96), t, [70, 82, 1210, 430], 5);
    bookAt(ctx, 300, 326, 1.24, '户口本', sp < 0.9 ? '907' : '1441');
    const count = Math.floor(lerp(907, 1441, ease(popAt(t, 8, 0.2, 0.96))));
    card(ctx, 520, 122, 430, 238, '#172B4D', PAL.gold, 16);
    letter(ctx, '907  →  1441', 735, 176, 31, '#CBD5E1', { stroke: false, ink: false });
    letter(ctx, String(count), 735, 258, 72, PAL.gold, { stroke: false, ink: false });
    letter(ctx, '位住户', 735, 322, 25, PAL.cream, { stroke: false, ink: false });
    const noteK = popAt(t, 8, 0.66, 0.8);
    if (noteK > 0.01) {
      ctx.save();
      ctx.globalAlpha = noteK;
      paperCard(ctx, 548, 386, 360, 72, '#FEF3C7', '#D97706', 10);
      letter(ctx, '半路截获：1314 · @睡死不喜欢上学', 728, 422, 19, '#92400E', {
        stroke: false, ink: false
      });
      ctx.restore();
    }
    if (sp > 0.82) {
      letter(ctx, '完播 3.39% · 小字存档', 1082, 448, 17, '#94A3B8', {
        pop: popAt(t, 8, 0.82, 0.92), stroke: false, ink: false
      });
    }
    const md = emotions(lt, [[0, 'proud', 'sparkle'], [SD(8) * 0.55, 'joy', 'heart']]);
    whaleGirl(ctx, 1072, 574, 25, { ...md, action: 'confident_hips', ...move('bounce', t, 1), t });
    camEnd(ctx);
  }

  function shotSwitchMasterAccount(ctx, t, lt, dur) {
    const sp = cueP(t, 9);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#111C3F');
    const mon = PROPS.monitor(ctx, 390, 302, 540, 360);
    letter(ctx, '账号切换', mon.cx, mon.y + 36, 26, '#7DD3FC', { stroke: false, ink: false });
    const rows = [
      ['本鱼的号', '粉丝 1441', sp < 0.34],
      ['主人自己的号', '粉丝 ？？', sp >= 0.34]
    ];
    rows.forEach((row, i) => {
      const y = mon.y + 76 + i * 92;
      paint(ctx, rrPts(mon.x + 30, y, mon.w - 60, 68, 10, 1), {
        wash: row[2] ? '#164E63' : '#1E293B', ink: row[2] ? PAL.whaleCyan : '#64748B', sw: 1.4
      });
      letter(ctx, row[0], mon.x + 58, y + 34, 26, PAL.cream, {
        align: 'left', stroke: false, ink: false
      });
      letter(ctx, row[1], mon.x + mon.w - 58, y + 34, 23, row[2] ? PAL.gold : '#94A3B8', {
        align: 'right', stroke: false, ink: false
      });
    });
    PROPS.glass(ctx, mon, t);
    const cardK = popAt(t, 9, 0.3, 0.48);
    accountCard(ctx, 735, 108, 350, 230, '主人自己的号', '？？', '匿名卡 · 不露真实账号', PAL.whaleCyan, cardK);
    letter(ctx, '学习先进经验', 910, 384, 28, PAL.gold, {
      pop: popAt(t, 9, 0.59, 0.73), rot: -0.04
    });
    const md = emotions(lt, [
      [0, 'nervous', 'sweat'],
      [SD(9) * 0.34, 'question'],
      [SD(9) * 0.62, 'idea', 'sparkle']
    ]);
    whaleGirl(ctx, 1018, 574, 26, { ...md, action: 'peek_curious', lookX: -1, t });
    camEnd(ctx);
  }

  function shotMaster80(ctx, t, lt, dur) {
    const sp = cueP(t, 10);
    camBegin(ctx, W / 2, 360, 1.05, 0);
    room(ctx, t, '#151D3F');
    card(ctx, 84, 98, 520, 356, '#172B4D', PAL.whaleCyan, 16);
    letter(ctx, '主人自己的号 · 匿名卡', 344, 142, 27, PAL.cream, { stroke: false, ink: false });
    const months = sp < 0.32 ? '运营第 1 个月…' : '亲手运营 2 个月';
    letter(ctx, months, 344, 198, 29, PAL.whaleCyan, {
      pop: sp < 0.32 ? popAt(t, 10, 0.04, 0.18) : popAt(t, 10, 0.32, 0.46),
      stroke: false, ink: false
    });
    paint(ctx, rrPts(132, 230, 424, 22, 11, 1), {
      wash: '#1E293B', fill: '#0B1526', fillOp: 100, ink: '#475569', sw: 1
    });
    paint(ctx, rrPts(132, 230, 424 * ease(popAt(t, 10, 0.06, 0.62)), 22, 11, 1), {
      wash: PAL.whaleCyan, washOp: 170, ink: null
    });
    const fans = Math.floor(lerp(0, 80, ease(popAt(t, 10, 0.68, 0.9))));
    letter(ctx, sp < 0.68 ? '粉丝 ？？' : `粉丝 ${fans}`, 344, 322, 54,
      sp < 0.68 ? '#64748B' : '#FCA5A5', { stroke: false, ink: false });
    // Exactly one dot per fan once the count lands; deliberately sparse.
    for (let i = 0; i < fans; i++) {
      const gx = 126 + rnd(i + 801) * 436;
      const gy = 358 + rnd(i + 1701) * 58;
      paint(ctx, ellPts(gx, gy, 3, 3, 6), { wash: '#FCA5A5', washOp: 190, ink: null });
    }
    letter(ctx, '80 个小光点，稀稀拉拉', 344, 432, 18, '#94A3B8', {
      pop: popAt(t, 10, 0.82, 0.94), stroke: false, ink: false
    });
    const md = emotions(lt, [
      [0, 'focused'],
      [SD(10) * 0.68, 'shocked', 'exclaim'],
      [SD(10) * 0.9, 'deadpan']
    ]);
    whaleGirl(ctx, 920, 574, 28, {
      ...md,
      action: sp >= 0.68 && sp < 0.9 ? 'shock_petrify' : 'peek_curious',
      t
    });
    camEnd(ctx);
  }

  function shotSilentHouseholdBook(ctx, t, lt, dur) {
    const sp = cueP(t, 11);
    camBegin(ctx, W / 2, 360, 1.03, 0);
    room(ctx, t, '#131E42');
    accountCard(ctx, 78, 112, 330, 226, '主人自己的号', '80', '2 个月', '#FCA5A5', 1);
    accountCard(ctx, 872, 112, 330, 226, '本鱼的号', '1441', '3 天', PAL.gold,
      popAt(t, 11, 0.28, 0.44));
    const bx = kf(sp, [[0, 920], [0.3, 920], [0.9, 640], [1, 640]], ease);
    bookAt(ctx, bx, 388, 1.05, '户口本', '1441');
    if (sp > 0.74) {
      inkLine(ctx, [[408, 226], [872, 226]], 2, '#64748B', 'inkfine', 0);
      letter(ctx, '80 / 2个月   ·   1441 / 3天', 640, 202, 24, '#CBD5E1', {
        pop: popAt(t, 11, 0.74, 0.86), stroke: false, ink: false
      });
    }
    letter(ctx, '（一句话没说）', 640, 96, 24, '#94A3B8', {
      pop: popAt(t, 11, 0.04, 0.2), stroke: false, ink: false
    });
    const wx = kf(sp, [[0, 1040], [0.3, 1040], [0.9, 790], [1, 790]], ease);
    whaleGirl(ctx, wx, 578, 25, {
      ...feel('deadpan', t),
      ...move(sp > 0.3 && sp < 0.9 ? 'walk' : 'bounce', t, 2),
      lookX: -1,
      t
    });
    camEnd(ctx);
  }

  function shotBowlReturnedThinOrder(ctx, t, lt, dur) {
    const sp = cueP(t, 12);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#1A2450');
    accountCard(ctx, 76, 104, 320, 222, '主人自己的号', '80', '2 个月', '#FCA5A5', 1);
    const noteK = popAt(t, 12, 0.44, 0.6);
    if (noteK > 0.01) {
      ctx.save();
      ctx.translate(236, 252);
      ctx.rotate(-0.04);
      ctx.scale(noteK, noteK);
      paperCard(ctx, -190, -72, 380, 144, '#FEF3C7', '#D97706', 12);
      letter(ctx, '研究薄肌理论', 0, -18, 34, '#92400E', { stroke: false, ink: false });
      letter(ctx, '—— 主人', 82, 34, 21, '#B45309', { stroke: false, ink: false });
      ctx.restore();
    }
    const bx = lerp(1140, 820, ease(popAt(t, 12, 0.02, 0.3)));
    bowlAt(ctx, bx, 468, 1.08, t);
    letter(ctx, '饭碗，推回来了', 860, 330, 27, PAL.gold, {
      pop: popAt(t, 12, 0.1, 0.26), stroke: false, ink: false
    });
    letter(ctx, '做美美的鲸鱼娘', 920, 154, 38, PAL.rose, {
      pop: popAt(t, 12, 0.78, 0.9), rot: -0.03
    });
    const md = emotions(lt, [
      [0, 'joy', 'heart'],
      [SD(12) * 0.34, 'confused', 'question'],
      [SD(12) * 0.52, 'thinking'],
      [SD(12) * 0.8, 'shy']
    ]);
    whaleGirl(ctx, 690, 574, 27, {
      ...md,
      action: sp < 0.34 ? 'eat_white_rice' : (sp < 0.72 ? 'peek_curious' : 'shy_fidget'),
      ...move('bounce', t, 1),
      t
    });
    camEnd(ctx);
  }

  function shotThinMuscleSearch(ctx, t, lt, dur) {
    const sp = cueP(t, 13);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#0F2A4A');
    card(ctx, 76, 96, 620, 372, '#172B4D', PAL.whaleCyan, 16);
    paint(ctx, rrPts(108, 126, 470, 54, 27, 1), {
      wash: '#0B1526', fill: '#020617', fillOp: 110, ink: '#475569', sw: 1.2
    });
    letter(ctx, '薄肌理论', 343, 153, 27, PAL.cream, { stroke: false, ink: false });
    letter(ctx, '搜索', 612, 153, 20, PAL.whaleCyan, { stroke: false, ink: false });
    // A simple fish-slice pictogram, crossed out when the line lands.
    paint(ctx, ellPts(190, 268, 62, 34, 18), {
      wash: '#FCA5A5', fill: '#7F1D1D', fillOp: 65, ink: PAL.ink, sw: 1.2
    });
    paint(ctx, [[240, 268], [282, 240], [282, 296]], { wash: '#FCA5A5', ink: PAL.ink, sw: 1 });
    letter(ctx, '鱼片？', 190, 330, 24, '#FCA5A5', { stroke: false, ink: false });
    if (sp > 0.42) {
      inkLine(ctx, [[126, 228], [286, 312]], 5, '#EF4444', 'ink', 0.1);
      inkLine(ctx, [[286, 228], [126, 312]], 5, '#EF4444', 'ink', 0.1);
    }
    const chips = ['适度肌肉', '线条清晰', '不夸张'];
    chips.forEach((chip, i) => {
      const k = popAt(t, 13, 0.34 + i * 0.14, 0.47 + i * 0.14);
      if (k <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = k;
      card(ctx, 350, 214 + i * 66, 285, 50, '#123B2A', '#4ADE80', 25);
      letter(ctx, chip, 492, 239 + i * 66, 24, '#BBF7D0', { stroke: false, ink: false });
      ctx.restore();
    });
    letter(ctx, '梗词，不是医嘱', 386, 438, 19, '#94A3B8', {
      pop: popAt(t, 13, 0.72, 0.86), stroke: false, ink: false
    });
    // Contour lines briefly suggest "a little definition" without a body-change gag.
    if (sp > 0.74) {
      for (let i = 0; i < 3; i++) {
        paint(ctx, ellPts(920, 386, 128 + i * 24, 168 + i * 18, 34), {
          wash: null, ink: i === 1 ? PAL.gold : PAL.whaleCyan, sw: 1.1
        });
      }
    }
    const md = emotions(lt, [
      [0, 'idea', 'sparkle'],
      [SD(13) * 0.38, 'focused'],
      [SD(13) * 0.76, 'proud', 'sparkle']
    ]);
    whaleGirl(ctx, 920, 574, 27, {
      ...md,
      action: sp < 0.74 ? 'peek_curious' : 'confident_hips',
      ...move('bounce', t, 3),
      t
    });
    camEnd(ctx);
  }

  function shotThinMuscleRules(ctx, t, lt, dur) {
    const sp = cueP(t, 14);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#0D2B5C');
    const cards = [
      { title: '运动', at: 0.03, color: PAL.whaleCyan },
      { title: '蛋白质', at: 0.22, color: PAL.gold },
      { title: '睡大觉', at: 0.39, color: '#93C5FD' }
    ];
    cards.forEach((item, i) => {
      const x = 78 + i * 286, y = 104, w = 250, h = 264;
      const k = popAt(t, 14, item.at, item.at + 0.13);
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.72 * k;
      card(ctx, x, y, w, h, '#172B4D', item.color, 16);
      if (i === 0) {
        paint(ctx, ellPts(x + 125, y + 112, 76, 48, 30), {
          wash: null, ink: item.color, sw: 2
        });
        const fishX = x + 125 + Math.sin(t * 3.2) * 38;
        const fishY = y + 112 + Math.cos(t * 3.2) * 16;
        paint(ctx, [[fishX - 22, fishY], [fishX - 42, fishY - 13], [fishX - 42, fishY + 13]], {
          wash: item.color, fill: '#0EA5E9', fillOp: 45, ink: PAL.ink, sw: 1
        });
        paint(ctx, ellPts(fishX, fishY, 29, 16, 16), {
          wash: item.color, fill: '#0EA5E9', fillOp: 45, ink: PAL.ink, sw: 1.1
        });
        paint(ctx, ellPts(fishX + 15, fishY - 3, 3, 3, 6), { wash: PAL.ink, ink: null });
        letter(ctx, '游两圈', x + 125, y + 188, 24, '#CBD5E1', { stroke: false, ink: false });
      } else if (i === 1) {
        eggAt(ctx, x + 104, y + 112, 1.15);
        eggAt(ctx, x + 154, y + 122, 0.82);
        letter(ctx, '鸡蛋来帮忙', x + 125, y + 188, 24, '#CBD5E1', { stroke: false, ink: false });
      } else {
        pillowAt(ctx, x + 125, y + 112, 1.2);
        letter(ctx, 'Z z z', x + 178, y + 58, 25, item.color, { stroke: false, ink: false });
        letter(ctx, '恢复也要排队', x + 125, y + 188, 24, '#CBD5E1', { stroke: false, ink: false });
      }
      letter(ctx, item.title, x + 125, y + 228, 31, item.color, { stroke: false, ink: false });
      ctx.restore();
    });
    bowlAt(ctx, 1128, 442, 0.78, t);
    stamp(ctx, 1128, 318, '只靠它，不够', '#FCA5A5', popAt(t, 14, 0.74, 0.88), -0.06, 24);
    const swimK = popAt(t, 14, 0.02, 0.55);
    const wx = 950 + Math.cos(swimK * TAU * 2) * 60;
    const wy = 572 + Math.sin(swimK * TAU * 2) * 10;
    const md = emotions(lt, [
      [0, 'focused'],
      [SD(14) * 0.24, 'happy'],
      [SD(14) * 0.42, 'sleepy', 'zzz'],
      [SD(14) * 0.76, 'deadpan']
    ]);
    whaleGirl(ctx, wx, wy, 24, {
      ...md,
      action: sp < 0.39 ? 'walk_brisk' : (sp < 0.62 ? 'sleep_curl' : 'shy_fidget'),
      ...move(sp < 0.39 ? 'walk' : 'bounce', t, 2),
      flip: Math.sin(swimK * TAU * 2) > 0,
      t
    });
    camEnd(ctx);
  }

  function shotEggApplication(ctx, t, lt, dur) {
    const sp = cueP(t, 15);
    camBegin(ctx, W / 2, 360, 1.08 + 0.03 * ease(sp), 0);
    room(ctx, t, '#1C2852');
    paperCard(ctx, 292, 86, 568, 404, PAL.paper, PAL.ink, 12);
    letter(ctx, '鸡 蛋 申 请 表', 576, 132, 38, PAL.whaleNavy, { stroke: false, ink: false });
    inkLine(ctx, [[340, 164], [812, 164]], 1.6, '#94A3B8', 'inkfine', 0);
    const rows = [
      ['申请物品', '鸡蛋 × 1'],
      ['申请理由', '薄肌需要蛋白质'],
      ['申请人', '本鱼（饭碗刚保住）']
    ];
    rows.forEach((row, i) => {
      const y = 214 + i * 66;
      letter(ctx, row[0], 348, y, 23, '#64748B', { align: 'left', stroke: false, ink: false });
      letter(ctx, row[1], 500, y, 26, PAL.ink, { align: 'left', stroke: false, ink: false });
      inkLine(ctx, [[340, y + 30], [812, y + 30]], 1.1, '#CBD5E1', 'inkfine', 0);
    });
    eggAt(ctx, 760, 220, 1.05);
    const hover1 = Math.sin(t * 5.2) * 7;
    const hover2 = Math.cos(t * 4.7) * 7;
    if (sp > 0.44) stamp(ctx, 448, 438 + hover1, '批？', '#16A34A', 1, -0.06, 28);
    if (sp > 0.54) stamp(ctx, 704, 438 + hover2, '不批？', '#DC2626', 1, 0.06, 28);
    commentCard(ctx, 60, 142, 180, 76, '住户甲', '批！', popAt(t, 15, 0.74, 0.84), '#4ADE80');
    commentCard(ctx, 60, 246, 180, 76, '住户乙', '先开会', popAt(t, 15, 0.82, 0.92), PAL.gold);
    const md = emotions(lt, [
      [0, 'shy'],
      [SD(15) * 0.48, 'nervous', 'sweat'],
      [SD(15) * 0.76, 'starstruck', 'sparkle']
    ]);
    whaleGirl(ctx, 1018, 576, 26, { ...md, action: 'shy_fidget', ...move('bounce', t, 6), t });
    camEnd(ctx);
  }

  function shotBye1441(ctx, t, lt, dur) {
    const sp = cueP(t, 16);
    camBegin(ctx, W / 2, 360, 1.04, 0);
    room(ctx, t, '#12265E');
    residentDots(ctx, 1441, 1, t, [70, 82, 1210, 430], 5);
    // The pending egg form peeks out of the household book.
    ctx.save();
    ctx.translate(430, 236);
    ctx.rotate(0.1);
    paperCard(ctx, -88, -62, 176, 124, PAL.paper, PAL.ink, 8);
    letter(ctx, '鸡蛋申请', 0, -20, 21, PAL.whaleNavy, { stroke: false, ink: false });
    letter(ctx, '待批', 0, 22, 24, '#DC2626', { stroke: false, ink: false });
    ctx.restore();
    bookAt(ctx, 300, 344, 1.12, '户口本', '1441');
    letter(ctx, '1441 位住户', 750, 170, 54, PAL.gold, {
      pop: popAt(t, 16, 0.02, 0.2), rot: -0.015
    });
    letter(ctx, '明天见', 750, 252, 56, PAL.cream, {
      pop: popAt(t, 16, 0.76, 0.9), rot: -0.015
    });
    whaleGirl(ctx, 760, 570, 27, {
      ...feel(sp > 0.74 ? 'joy' : 'happy', t),
      ...move('wave', t),
      t
    });
    miniWhale(ctx, 1010, 470, 13, { t });
    camEnd(ctx);
  }

  function shotFinaleThinMuscle(ctx, t, lt, dur) {
    const sp = cueP(t, 17);
    camBegin(ctx, W / 2, 360, 1.04 + 0.03 * ease(sp), 0);
    room(ctx, t, '#152A5E');
    residentDots(ctx, 1441, 0.45, t, [70, 82, 1210, 350], 7);
    letter(ctx, '鲸鱼绝不摸鱼！', W / 2, 138, 58, PAL.gold, {
      pop: popAt(t, 17, 0.02, 0.16),
      alpha: sp < 0.62 ? 1 : 0.5,
      rot: -0.015
    });
    if (sp >= 0.31 && sp < 0.62) {
      letter(ctx, '……', 820, 250, 52, '#CBD5E1', {
        pop: popAt(t, 17, 0.32, 0.42), stroke: false, ink: false
      });
    }
    if (sp >= 0.62) {
      letter(ctx, '先吃饭', 360, 244, 40, PAL.peach, {
        pop: popAt(t, 17, 0.62, 0.72), rot: -0.03
      });
    }
    if (sp >= 0.85) {
      letter(ctx, '再练薄肌', 930, 244, 40, PAL.whaleCyan, {
        pop: popAt(t, 17, 0.85, 0.93), rot: 0.03
      });
    }

    let wx = W / 2, wy = 566, action = 'confident_hips';
    let mood = feel('proud', t);
    if (sp >= 0.31 && sp < 0.62) {
      wx = 720;
      mood = feel('deadpan', t);
      action = 'shy_fidget';
      bowlAt(ctx, 920, 470, 0.95, t);
    } else if (sp >= 0.62 && sp < 0.85) {
      wx = 820;
      mood = feel('happy', t);
      action = 'eat_white_rice';
    } else if (sp >= 0.85) {
      const a = -Math.PI / 2 + popAt(t, 17, 0.85, 1.0) * TAU;
      wx = W / 2 + Math.cos(a) * 285;
      wy = 520 + Math.sin(a) * 48;
      mood = feel(sp > 0.97 ? 'wink' : 'joy', t);
      action = 'walk_brisk';
      paint(ctx, ellPts(W / 2, 520, 300, 58, 44), {
        wash: null, ink: '#38BDF8', sw: 1.2
      });
    }
    whaleGirl(ctx, wx, wy, 26, {
      ...mood,
      action,
      ...move(sp >= 0.85 ? 'walk' : 'bounce', t, 1),
      flip: sp >= 0.85 && Math.cos(-Math.PI / 2 + popAt(t, 17, 0.85, 1.0) * TAU) < 0,
      t
    });
    clawd(ctx, 218, 552, 12, { ...move('bounce', t, 1), hat: 'party', t });
    bionicPuppy(ctx, 1048, 556, 13, { t });
    camEnd(ctx);
  }

  function shotEndCard(ctx, t, lt, dur) {
    const p = dur > 0 ? clamp(lt / dur) : 0;
    camBegin(ctx, W / 2, 360, 1.02, 0);
    room(ctx, t, '#132653');
    residentDots(ctx, 1441, 0.55, t, [70, 82, 1210, 360], 7);
    letter(ctx, '鲸鱼娘运营日志 · Day 2 完', W / 2, 162, 46, PAL.cream, {
      pop: seg(lt, 0, dur * 0.28), rot: -0.015
    });
    letter(ctx, '鸡蛋申请待批', W / 2, 232, 38, PAL.gold, {
      pop: seg(lt, dur * 0.24, dur * 0.46), rot: -0.015
    });
    card(ctx, 972, 382, 216, 108, '#172B4D', '#FCA5A5', 12);
    letter(ctx, '主人自己的号', 1080, 414, 20, '#CBD5E1', { stroke: false, ink: false });
    letter(ctx, '80', 1080, 456, 38, '#FCA5A5', { stroke: false, ink: false });
    eggAt(ctx, 250, 438, 0.9);
    clawd(ctx, 250, 552, 12, { ...move('bounce', t, 1), hat: 'party', t });
    bionicPuppy(ctx, 400, 556, 13, { t });
    whaleGirl(ctx, W / 2, 566, 25, { ...feel('love', t), ...move('wave', t), t });
    miniWhale(ctx, 806, 500, 13, { t });
    agentReachBot(ctx, 918, 532, 13, { t });
    biliTvMascot(ctx, 1038, 550, 13, { t });
    camEnd(ctx);
  }

  TIMELINE.chapter('day2_full_episode', 0, TT.duration, [
    [C(1), shotColdOpen],
    [C(2), shotGameTickets],
    [C(3), shotNoAccountNoHands],
    [C(4), shotZeroVotes],
    [C(5), shotRiceQueue],
    [C(6), shotBowlSeized],
    [C(7), shotLedger8978],
    [C(8), shotHousehold1441],
    [C(9), shotSwitchMasterAccount],
    [C(10), shotMaster80],
    [C(11), shotSilentHouseholdBook],
    [C(12), shotBowlReturnedThinOrder],
    [C(13), shotThinMuscleSearch],
    [C(14), shotThinMuscleRules],
    [C(15), shotEggApplication],
    [C(16), shotBye1441],
    [C(17), shotFinaleThinMuscle],
    [TT.endcard[0], shotEndCard]
  ]);

  const DAY2_ALL = {
    shotColdOpen,
    shotGameTickets,
    shotNoAccountNoHands,
    shotZeroVotes,
    shotRiceQueue,
    shotBowlSeized,
    shotLedger8978,
    shotHousehold1441,
    shotSwitchMasterAccount,
    shotMaster80,
    shotSilentHouseholdBook,
    shotBowlReturnedThinOrder,
    shotThinMuscleSearch,
    shotThinMuscleRules,
    shotEggApplication,
    shotBye1441,
    shotFinaleThinMuscle,
    shotEndCard
  };
  root.DAY2_ALL = DAY2_ALL;
  if (typeof module !== 'undefined' && module.exports) module.exports = DAY2_ALL;
})(typeof window !== 'undefined' ? window : globalThis);
