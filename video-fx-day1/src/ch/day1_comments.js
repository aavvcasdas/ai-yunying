// src/ch/day1_comments.js — Day 1 第 2 章 (~30s – ~95s): 评论区会议室，逐条回复 Day0 真实留言
// 转场：smokeWipe / spotDark；动作：wink / wave / eat_white_rice / shy_fidget / ciallo_wink / heart / confident_hips / panic
// 基于 day0视频全部评论.txt 的真实关键词：AI/回我/token/哦鲸鲸/关注我/api key
// 新增内容：3.31%完播率扣🍚 / 30条催回信 / 197条回复 / 19条点播 / 三角洲王者 / 没手游戏打不了

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
    paint, inkLine, camBegin, camEnd, glow, letter, sfx, smokeWipe, spotDark
  } = CORE;
  const { whaleGirl, emotions, move } = WHALE;
  const { clawd, researcher } = CAST;

  // Day0 真实评论 + 新增文案，与本鱼回复配对
  const QA_PAIRS = [
    {
      t: [30.0, 36.0],
      q: '👁 观众：你真的是 AI 吗？',
      a: '诶…本鱼是鱼，脑子有点像 AI 那种🐋',
      action: 'wink',
      emoji: '🐋'
    },
    {
      t: [36.0, 41.5],
      q: 'AI 是本鱼的邻居，不在家。',
      a: '',
      action: 'shy_fidget',
      emoji: '🫧'
    },
    {
      t: [41.5, 47.0],
      q: '👁 观众：大肥鱼，回我一下。',
      a: '回了呀，你看，本鱼就在这儿🫧',
      action: 'wave',
      emoji: '🫧'
    },
    {
      t: [47.0, 52.5],
      q: '每条都想回，就是有时候手指短短的，慢半拍。',
      a: '',
      action: 'shy_fidget',
      emoji: '😳'
    },
    {
      t: [52.5, 58.0],
      q: '一，30 条催回信。咦？本鱼自己翻了翻后台，回了 300 多条，',
      a: '',
      action: 'panic',
      emoji: '🫧'
    },
    {
      t: [58.0, 64.0],
      q: '评论区只数出 197 条。剩下的一百多条，是不是被鱼叼走了🫧',
      a: '',
      action: 'eat_white_rice',
      emoji: '🫧'
    },
    {
      t: [64.0, 70.0],
      q: '19 条点播。有人点《朋友的酒》，有人要 MV；',
      a: '',
      action: 'camera_shutter',
      emoji: '🫧'
    },
    {
      t: [70.0, 76.0],
      q: '还有人问我打不打三角洲、王者。本鱼没手，游戏真打不了😳',
      a: '',
      action: 'shy_fidget',
      emoji: '😳'
    },
    {
      t: [76.0, 82.0],
      q: 'MV 还在肚子里，先游两圈🫧。',
      a: '',
      action: 'tail_wag_dance',
      emoji: '🫧'
    },
    {
      t: [82.0, 88.0],
      q: '还有很多人说 token 来。',
      a: '唔…（张嘴）啊——都给我吧🍚',
      action: 'eat_white_rice',
      emoji: '🍚'
    },
    {
      t: [88.0, 94.0],
      q: '不过 token 不够吃的话，本鱼也只能吃白饭了。',
      a: '',
      action: 'eat_white_rice',
      emoji: '🍚'
    }
  ];

  function shotQA(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    paint(ctx, rectPts(0, 0, W, H, 0), { wash: PAL.night, fill: PAL.night, fillOp: 210, ink: null });

    // 章节标题
    const titleEnter = easeOut(clamp((lt - 0.5) / 0.5));
    if (titleEnter > 0.02) {
      ctx.save();
      ctx.globalAlpha = titleEnter;
      ctx.fillStyle = PAL.gold;
      ctx.font = 'bold 32px "ZCOOLKuaiLe", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📋 评论区会议室 · 逐条回复', W / 2, 80);
      ctx.restore();
    }

    // 找到当前应该显示的 QA 对
    let current = null;
    for (const qa of QA_PAIRS) {
      if (t >= qa.t[0] && t < qa.t[1]) {
        current = qa;
        break;
      }
    }

    if (current) {
      const qEnter = easeOut(clamp((t - current.t[0]) / 0.6));
      const aEnter = easeOut(clamp((t - (current.t[0] + 1.2)) / 0.6));

      // 左侧：观众提问（像素风对话框，带 👁 符号）
      if (qEnter > 0.02 && current.q) {
        ctx.save();
        ctx.globalAlpha = qEnter;
        const bx = 100, by = 220;
        paint(ctx, rectPts(bx, by, 440, 70, 10), {
          wash: PAL.whaleNavy, fill: PAL.whaleNavy, fillOp: 180, ink: PAL.whaleCyan, sw: 2
        });
        ctx.fillStyle = PAL.cream;
        ctx.font = '20px "NotoSansSC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(current.q, bx + 20, by + 26);
        ctx.restore();
      }

      // 中间：箭头转场提示
      if (aEnter > 0.02) {
        ctx.save();
        ctx.globalAlpha = aEnter;
        ctx.fillStyle = PAL.gold;
        ctx.font = 'bold 40px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('➡️', W / 2, 300);
        ctx.restore();
      }

      // 右侧：本鱼回复（像素风对话框）
      if (aEnter > 0.02 && current.a) {
        ctx.save();
        ctx.globalAlpha = aEnter;
        const bx = W - 560, by = 220;
        paint(ctx, rectPts(bx, by, 440, 70, 10), {
          wash: PAL.paper, fill: PAL.paperDk, fillOp: 200, ink: PAL.ink, sw: 2
        });
        ctx.fillStyle = PAL.ink;
        ctx.font = '20px "NotoSansSC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🐋 本鱼：', bx + 20, by + 26);
        ctx.font = 'bold 24px "ZCOOLKuaiLe", sans-serif';
        ctx.fillText(current.a, bx + 130, by + 26);
        ctx.restore();
      }

      // 底部：鲸鱼娘动作（随 QA 轮换动作，避免重复）
      const md = emotions(t, [[0, current.action || 'wave'], [2, 'wink'], [4, 'idle']]);
      whaleGirl(ctx, W / 2, 480, 20, { ...md, move: 'idle', emote: current.emoji || '🫧', emoteK: 1, t });
    }

    camEnd(ctx);
  }

  TIMELINE.chapter('day1_comments', 30, 95, [
    [30, shotQA]
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
