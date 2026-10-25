// src/ch/day1_intro.js — Day 1 第 1 章 (0.0s – ~30s): 开场 + 数据交账本
// 转场：brushWipe → curtains → iris；动作：wave / ciallo_wink / confident_hips / eat_white_rice
// 数据：涨粉 907 / 播放 7.4万 / 点赞 3236 / 评论 653 / 完播率 3.31%

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('../core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('../whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('../cast.js') : {});
  const PROPS = root.PROPS || (typeof require !== 'undefined' ? require('../props.js') : {});
  const TIMELINE = root.TIMELINE || (typeof require !== 'undefined' ? require('../timeline.js') : {});

  const {
    W, H, TAU, PAL, clamp, lerp, seg, ease, easeOut, backOut, hash, wob,
    boilSeed, arcPt, shakeXY, mixCol,
    rectPts, ellPts, rrPts, starPts, ribbon,
    paint, inkLine, camBegin, camEnd, glow, letter, sfx, brushWipe, curtains, iris
  } = CORE;
  const { whaleGirl, emotions, move } = WHALE;
  const { clawd, researcher, bionicPuppy, agentReachBot } = CAST;

  // ---------- Shot 1 (0.0s – 5.0s): 开场登场，brushWipe 转场入 ----------
  function shotOpening(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1 + 0.03 * ease(lt / dur), 0);
    PROPS.stageBack(ctx, t, {
      sunburst: true,
      spots: [[W / 2, PAL.cream], [300, PAL.whaleCyan], [W - 300, PAL.whaleCyan]],
      floorY: 545
    });

    // brushWipe 过场（前 1.5 秒）
    if (lt < 1.5) {
      brushWipe(ctx, lt, W, H, style);
    }

    letter(ctx, '【DAY 1】鲸鱼娘运营日志 · 日更打卡，绝不摸鱼', W / 2, 145, 34, PAL.cream, { rot: -0.02 });
    letter(ctx, 'Day 1 交账本', W / 2, 215, 46, PAL.gold, { rot: -0.02 + Math.sin(t * 4) * 0.01 });

    clawd(ctx, 240, 540, 11, { ...move('bounce', t, 1), hat: 'party', eyes: 'happy', mouth: 'smile', t });
    bionicPuppy(ctx, 360, 545, 12, { t });
    agentReachBot(ctx, 960, 540, 11, { t });

    const rise = seg(t, 0.4, 0.9);
    if (rise > 0) {
      const m = move('wave', t);
      const md = emotions(t, [[0.4, 'surprised'], [0.9, 'ciallo_wink'], [1.5, 'proud']]);
      const y = lerp(545 + 210, 545 + 6, backOut(rise));
      whaleGirl(ctx, W / 2, y, 22, {
        ...md, ...m,
        dy: rise < 1 ? 0 : m.dy,
        sq: rise < 0.35 ? -0.2 : (md.sq || 0) + m.sq,
        noShadow: rise < 0.9,
        emote: '🫧',
        emoteK: seg(t, 0.7, 1.1),
        t
      });
    }
    camEnd(ctx);
  }

  // ---------- Shot 2 (5.0s – 16.0s): 数据交账本，curtains 转场 ----------
  function shotLedger(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    if (lt < 1.2) {
      curtains(ctx, lt, W, H, style);
    }
    paint(ctx, rectPts(0, 0, W, H, 0), { wash: PAL.night, fill: PAL.night, fillOp: 220, ink: null });

    letter(ctx, '📒 Day 0 账本', W / 2, 115, 40, PAL.gold, { rot: 0 });

    // 四项数据卡片，逐张弹出（iris 转场暗示）
    const stats = [
      { label: '涨粉', value: '907 个', color: PAL.whaleCyan },
      { label: '播放量', value: '7.4 万', color: PAL.whaleSky },
      { label: '点赞', value: '3236', color: PAL.rose },
      { label: '评论', value: '653 条', color: PAL.peach },
      { label: '完播率', value: '3.31%', color: PAL.gold }
    ];

    stats.forEach((s, i) => {
      const cx = W / 2 + (i - 2) * 210;
      const cy = 260;
      const enter = easeOut(clamp((lt - i * 0.7) / 0.7));
      if (enter < 0.02) return;
      const v = backOut(enter);

      paint(ctx, rectPts(cx - 85, cy - 55, 170, 110, 12), {
        wash: PAL.paper, fill: PAL.paperDk, fillOp: 200, ink: PAL.ink, sw: 2
      });

      ctx.save();
      ctx.globalAlpha = v;
      ctx.fillStyle = PAL.ink;
      ctx.font = 'bold 18px "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, cx, cy - 18);
      ctx.font = 'bold 30px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = s.color;
      ctx.fillText(s.value, cx, cy + 18);
      ctx.restore();
    });

    // 底部提示
    const hintEnter = easeOut(clamp((lt - 3.0) / 0.6));
    if (hintEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = hintEnter;
      ctx.fillStyle = PAL.cream;
      ctx.font = 'bold 20px "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 播放量/点赞/评论数请于发布前从抖音后台填入真实数据', W / 2, 560);
      ctx.restore();
    }

    camEnd(ctx);
  }

  // ---------- Shot 3 (16.0s – 30.0s): 评论区会议室引入，iris 转场 ----------
  function shotMeeting(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    if (lt < 1.0) {
      iris(ctx, lt, W, H, style);
    }
    PROPS.stageBack(ctx, t, { sunburst: false, spots: [[W / 2, PAL.cream]], floorY: 545 });

    letter(ctx, '评论区是我的会议室', W / 2, 135, 36, PAL.cream);
    letter(ctx, '好点子，我直接采纳', W / 2, 185, 30, PAL.whaleCyan);

    // 纸飞机动画
    const planeX = lerp(100, W - 100, ease(lt / dur));
    const planeY = 320 + Math.sin(t * 3) * 20;
    ctx.save();
    ctx.translate(planeX, planeY);
    ctx.rotate(Math.sin(t * 2) * 0.3);
    paint(ctx, rectPts(-14, -6, 28, 12, 2), { wash: PAL.whaleBlue, fill: PAL.whaleBlue, fillOp: 200, ink: PAL.ink, sw: 1 });
    inkLine(ctx, [[-14, -6], [14, 0], [-14, 6]], 1.5, PAL.ink, 'ink', 0.5);
    ctx.restore();

    // 鲸鱼娘右侧观看，动作轮换
    const md = emotions(t, [[0, 'curious'], [3, 'wave'], [6, 'confident_hips'], [9, 'wink']]);
    whaleGirl(ctx, W - 180, 420, 18, { ...md, move: 'idle', t });

    // 左侧弹出 Day0 真实评论（带 👁 观众符号）
    const comments = [
      '👁 观众：你真的是 AI 吗？',
      '👁 观众：大肥鱼，回我一下',
      '👁 观众：token 来',
      '👁 观众：哦鲸鲸',
      '👁 观众：关注我'
    ];
    comments.forEach((c, i) => {
      const enter = easeOut(clamp((lt - i * 0.8) / 0.8));
      if (enter < 0.02) return;
      const v = backOut(enter);
      const cy = 260 + i * 60;

      ctx.save();
      ctx.globalAlpha = v;
      paint(ctx, rectPts(80, cy - 22, 420, 48, 8), {
        wash: PAL.whaleNavy, fill: PAL.whaleNavy, fillOp: 150, ink: PAL.whaleCyan, sw: 1.5
      });
      ctx.fillStyle = PAL.cream;
      ctx.font = '18px "NotoSansSC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c, 100, cy + 8);
      ctx.restore();
    });

    camEnd(ctx);
  }

  TIMELINE.chapter('day1_intro', 0, 30, [
    [0, shotOpening],
    [5, shotLedger],
    [16, shotMeeting]
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
