// src/ch/day1_outro.js — Day 1 第 3 章 (105.0s – 128.0s): 深度思考 + 结尾与 Day2 预告

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('../core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('../whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('../cast.js') : {});
  const PROPS = root.PROPS || (typeof require !== 'undefined' ? require('../props.js') : {});
  const TIMELINE = root.TIMELINE || (typeof require !== 'undefined' ? require('../timeline.js') : {});

  const {
    W, H, TAU, PAL, clamp, lerp, seg, ease, easeOut, backOut, hash, wob,
    boilSeed, shakeXY, mixCol,
    rectPts, ellPts, rrPts, starPts, ribbon,
    paint, inkLine, camBegin, camEnd, glow, letter, sfx, brushWipe
  } = CORE;
  const { whaleGirl, emotions, move } = WHALE;
  const { clawd } = CAST;

  // ---------- Shot 1 (105.0s – 115.0s): 深度思考 ----------
  function shotThinking(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    paint(ctx, rectPts(0, 0, W, H, 0), { wash: PAL.night, fill: PAL.night, fillOp: 220, ink: null });

    letter(ctx, '🧠 深度思考中……', W / 2, 160, 36, PAL.gold);

    // 思考计时框（呼应 Day0 的 999 秒梗）
    const thinkSeconds = Math.min(999, Math.floor((t - 105) * 15));
    const boxEnter = easeOut(clamp(lt / 0.8));
    if (boxEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = boxEnter;
      paint(ctx, rectPts(W/2 - 160, 260, 320, 90, 12), {
        wash: PAL.paper, fill: PAL.paperDk, fillOp: 200, ink: PAL.ink, sw: 2
      });
      ctx.fillStyle = PAL.ink;
      ctx.font = 'bold 24px "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('● 已深度思考', W / 2, 300);
      ctx.font = 'bold 36px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = PAL.rose;
      ctx.fillText(thinkSeconds + ' 秒', W / 2, 340);
      ctx.restore();
    }

    // 鲸鱼娘捧脸思考
    const md = emotions(t, [[0, 'panic'], [2, 'shock_petrify'], [4, 'shy_fidget']]);
    whaleGirl(ctx, W / 2, 480, 18, { ...md, move: 'idle', t });

    // 服务器警告
    const warnEnter = easeOut(clamp((t - 108) / 0.8));
    if (warnEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = warnEnter;
      paint(ctx, rectPts(W/2 - 200, 560, 400, 50, 8), {
        wash: PAL.rose, fill: PAL.roseDk || '#B6543B', fillOp: 180, ink: PAL.ink, sw: 2
      });
      ctx.fillStyle = PAL.cream;
      ctx.font = 'bold 18px "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 服务器，千万别又繁忙了（本鱼在努力思考！）', W / 2, 586);
      ctx.restore();
    }

    camEnd(ctx);
  }

  // ---------- Shot 2 (115.0s – 123.0s): 正事与互动引导 ----------
  function shotBusiness(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    PROPS.stageBack(ctx, t, { sunburst: false, spots: [[W/2, PAL.cream]], floorY: 545 });

    letter(ctx, '咳咳，说正事。', W / 2, 140, 34, PAL.cream);
    letter(ctx, '是不是 AI 不重要，在不在这儿，才重要。', W / 2, 190, 28, PAL.whaleCyan);

    // 鲸鱼娘比心
    const md = emotions(t, [[0, 'heart'], [2, 'wink'], [4, 'confident_hips']]);
    whaleGirl(ctx, W / 2, 420, 20, { ...md, move: 'idle', emote: '🫧', emoteK: 1, t });

    // 引导评论
    const guideEnter = easeOut(clamp((lt - 1.0) / 1.0));
    if (guideEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = guideEnter;
      paint(ctx, rectPts(W/2 - 260, 500, 520, 70, 10), {
        wash: PAL.whaleNavy, fill: PAL.whaleNavy, fillOp: 180, ink: PAL.whaleCyan, sw: 2
      });
      ctx.fillStyle = PAL.cream;
      ctx.font = '20px "NotoSansSC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📝 Day 2 做什么，你们来定！', W/2 - 230, 530);
      ctx.font = 'bold 24px "ZCOOLKuaiLe", sans-serif';
      ctx.fillText('把想法留在评论区，本鱼逐条审议', W/2 - 230, 560);
      ctx.restore();
    }

    camEnd(ctx);
  }

  // ---------- Shot 3 (123.0s – 128.0s): 结尾 CTA ----------
  function shotEnding(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    paint(ctx, rectPts(0, 0, W, H, 0), { wash: PAL.night, fill: PAL.night, fillOp: 230, ink: null });

    letter(ctx, '鲸鱼绝不摸鱼', W / 2, 200, 44, PAL.gold);
    letter(ctx, 'Day 2 见！', W / 2, 270, 52, PAL.whaleCyan);

    const md = emotions(t, [[0, 'heart'], [2, 'wink'], [4, 'wave']]);
    whaleGirl(ctx, W / 2, 450, 22, { ...md, move: 'idle', emote: '🫧', emoteK: 1, t });

    const ctaEnter = easeOut(clamp((lt - 0.5) / 0.8));
    if (ctaEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = ctaEnter;
      ctx.fillStyle = PAL.cream;
      ctx.font = 'bold 24px "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('觉得本鱼扛住了，就一键三连！', W / 2, 560);
      ctx.restore();
    }

    camEnd(ctx);
  }

  TIMELINE.chapter('day1_outro', 105, 128, [
    [105, shotThinking],
    [115, shotBusiness],
    [123, shotEnding]
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
