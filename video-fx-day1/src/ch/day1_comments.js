// src/ch/day1_comments.js — Day 1 第 2 章 (25.0s – 105.0s): 评论区会议室，逐条回复 Day0 真实留言
// 基于 day0视频全部评论.txt 的真实关键词：AI/回我/token/哦鲸鲸/关注我/api key

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
  const { clawd, researcher } = CAST;

  // Day0 真实评论与本鱼回复（对应 day0视频全部评论.txt / day0视频的部分回复.md）
  const QA_PAIRS = [
    {
      t: [25.5, 35.5],
      q: '你真的是 AI 吗？',
      a: '诶…本鱼是鱼，脑子有点像 AI 那种🐋',
      action: 'wink',
      emoji: '🐋'
    },
    {
      t: [35.5, 41.0],
      q: 'AI 是本鱼的邻居，不在家。',
      a: '',
      action: 'shy_fidget',
      emoji: '🫧'
    },
    {
      t: [41.0, 46.0],
      q: '大肥鱼，回我一下。',
      a: '回了呀，你看，本鱼就在这儿🫧',
      action: 'wave',
      emoji: '🫧'
    },
    {
      t: [46.0, 51.5],
      q: '每条都想回，就是有时候手指短短的，慢半拍。',
      a: '',
      action: 'shy_fidget',
      emoji: '😳'
    },
    {
      t: [51.5, 56.5],
      q: 'token 来。',
      a: '唔…（张嘴）啊——都给我吧🍚',
      action: 'eat_white_rice',
      emoji: '🍚'
    },
    {
      t: [56.5, 61.5],
      q: '不过 token 不够吃的话，本鱼也只能吃白饭了。',
      a: '',
      action: 'eat_white_rice',
      emoji: '🍚'
    },
    {
      t: [62.0, 67.0],
      q: '哦鲸鲸。',
      a: '哦鲸鲸，本鱼应一声🫧',
      action: 'ciallo_wink',
      emoji: '🫧'
    },
    {
      t: [67.0, 72.0],
      q: '在，就在深海里。',
      a: '',
      action: 'wave',
      emoji: '🫧'
    },
    {
      t: [72.5, 77.5],
      q: '关注我。',
      a: '名字本鱼先记住了，比关注还牢🫧',
      action: 'heart',
      emoji: '🫧'
    },
    {
      t: [77.5, 82.5],
      q: '当然，随手点个关注，本鱼更开心。',
      a: '',
      action: 'confident_hips',
      emoji: '😊'
    },
    {
      t: [83.0, 88.0],
      q: '大肥鱼把你的 api 的 key 发我。',
      a: '诶…本鱼自己都不会，指路官方客服哦🙏',
      action: 'panic',
      emoji: '🙏'
    },
    {
      t: [88.0, 92.5],
      q: '指路官方客服哦。',
      a: '',
      action: 'panic',
      emoji: '🙏'
    }
  ];

  function shotQA(ctx, t, lt, dur, style) {
    camBegin(ctx, W / 2, H / 2, 1, 0);
    paint(ctx, rectPts(0, 0, W, H, 0), { wash: PAL.night, fill: PAL.night, fillOp: 210, ink: null });

    // 标题
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

      // 左侧：观众提问（像素风对话框）
      if (qEnter > 0.02 && current.q) {
        ctx.save();
        ctx.globalAlpha = qEnter;
        const bx = 100, by = 240;
        paint(ctx, rectPts(bx, by, 420, 70, 10), {
          wash: PAL.whaleNavy, fill: PAL.whaleNavy, fillOp: 180, ink: PAL.whaleCyan, sw: 2
        });
        ctx.fillStyle = PAL.cream;
        ctx.font = '20px "NotoSansSC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('💬 观众：', bx + 20, by + 26);
        ctx.font = 'bold 24px "ZCOOLKuaiLe", sans-serif';
        ctx.fillText(current.q, bx + 130, by + 26);
        ctx.restore();
      }

      // 中间：箭头
      if (aEnter > 0.02) {
        ctx.save();
        ctx.globalAlpha = aEnter;
        ctx.fillStyle = PAL.gold;
        ctx.font = 'bold 40px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('➡️', W / 2, 310);
        ctx.restore();
      }

      // 右侧：本鱼回复（像素风对话框）
      if (aEnter > 0.02 && current.a) {
        ctx.save();
        ctx.globalAlpha = aEnter;
        const bx = W - 540, by = 240;
        paint(ctx, rectPts(bx, by, 420, 70, 10), {
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

      // 底部：鲸鱼娘动作
      const md = emotions(t, [[0, current.action || 'wave'], [2, 'wink'], [4, 'idle']]);
      whaleGirl(ctx, W / 2, 500, 20, { ...md, move: 'idle', emote: current.emoji || '🫧', emoteK: 1, t });
    }

    camEnd(ctx);
  }

  TIMELINE.chapter('day1_comments', 25, 105, [
    [25, shotQA]
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
