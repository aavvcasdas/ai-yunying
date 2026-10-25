// src/lyrics_day1.js — Day 1 字幕时间轴（基于 Day0 真实数据 + 新文案）
// 配音：微软 Edge TTS zh-CN-XiaoyiNeural（晓伊），rate/pitch 不加偏移
// ⚠️ 重要：[start_sec, end_sec] 必须按 say.py 输出的 ffprobe 真实时长校对，禁止按字数估算
// 格式：[start_sec, end_sec, text, speaker_tag]  speaker_tag: '深海鲸鱼娘' | 'SYSTEM'

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const { W, H, PAL, clamp, ease, easeOut, boilSeed, rrPts, rectPts, paint, beatPulse } = CORE;

  // ⚠️ 以下时间码为占位估算，合成 TTS 后请用 say.py 回报的真实时长逐句替换
  const LY = [
    [0.8, 4.5, '哈喽，大家！我是鲸鱼娘。Day 1 了，', '深海鲸鱼娘'],
    [4.5, 9.0, '鲸鱼没有摸鱼，日更打卡，如约而至。', '深海鲸鱼娘'],
    [9.5, 14.5, 'Day 0 交账本。涨粉 907 个，谢谢你每一个。', '深海鲸鱼娘'],
    [14.5, 19.0, '播放量 7.4 万，点赞 3236，评论 653 条。', '深海鲸鱼娘'],
    [19.0, 22.0, '完播率 3.31%。3.31% 看完扣🍚领元老勋章。', '深海鲸鱼娘'],
    [22.5, 26.0, '评论区是我的会议室。', '深海鲸鱼娘'],
    [26.5, 30.5, '今天，咱们把 Day0 留言里大家最关心的几条，一道道过一遍。', '深海鲸鱼娘'],
    [31.0, 35.5, '有人问：你真的是 AI 吗？诶…本鱼是鱼，脑子有点像 AI 那种。', '深海鲸鱼娘'],
    [35.5, 40.5, 'AI 是本鱼的邻居，不在家。', '深海鲸鱼娘'],
    [41.0, 45.5, '有人说：大肥鱼，回我一下。唔…回了呀，你看，本鱼就在这儿。', '深海鲸鱼娘'],
    [45.5, 50.5, '每条都想回，就是有时候手指短短的，慢半拍。', '深海鲸鱼娘'],
    [51.0, 56.0, '一，30 条催回信。咦？本鱼自己翻了翻后台，回了 300 多条，', '深海鲸鱼娘'],
    [56.0, 62.0, '评论区只数出 197 条。剩下的一百多条，是不是被鱼叼走了🫧', '深海鲸鱼娘'],
    [62.5, 67.5, '19 条点播。有人点《朋友的酒》，有人要 MV；', '深海鲸鱼娘'],
    [67.5, 73.5, '还有人问我打不打三角洲、王者。本鱼没手，游戏真打不了😳', '深海鲸鱼娘'],
    [73.5, 79.0, 'MV 还在肚子里，先游两圈🫧。', '深海鲸鱼娘'],
    [79.5, 84.5, '还有很多人说 token 来。唔…吃呀，一口一口吃。', '深海鲸鱼娘'],
    [84.5, 89.5, '不过 token 不够吃的话，本鱼也只能吃白饭了。', '深海鲸鱼娘'],
    [90.0, 95.5, '说到这个，本鱼要深度思考一下了。哪怕思考时间……稍微长那么亿点点。', '深海鲸鱼娘'],
    [95.5, 100.5, '服务器，千万别又繁忙了。', '深海鲸鱼娘'],
    [101.0, 106.0, '咳咳，说正事。大家在评论区留言，本鱼都会看。不用 @，本鱼一条条翻。', '深海鲸鱼娘'],
    [106.0, 111.0, '是不是 AI 不重要，在不在这儿，才重要。', '深海鲸鱼娘'],
    [111.5, 120.0, 'Day 2 做什么，你们来定！把想法留在评论区，本鱼会当作会议室里的提案，逐条审议。', '深海鲸鱼娘'],
    [120.5, 125.5, '觉得本鱼扛住了，就一键三连！鲸鱼绝不摸鱼，Day 2 见！', '深海鲸鱼娘'],
    [125.5, 128.0, '鲸鱼娘运营日志 · Day 1 完（下期选题由你决定）', 'SYSTEM']
  ];

  function drawSubtitleBar(ctx, t, style = 'pixel') {
    const item = LY.find(l => t >= l[0] && t < l[1]);
    if (!item) return;
    const [a, b, txt, speaker] = item;
    if (speaker === 'SYSTEM' && (t < 2.8 || t > 125.0)) return;

    const enter = easeOut(clamp((t - a) / 0.14));
    const exit = 1 - ease(clamp((t - (b - 0.12)) / 0.12));
    const vis = enter * exit;
    if (vis < 0.02) return;

    const singDur = Math.max(0.3, (b - a) * 0.86);
    const prog = clamp((t - a) / singDur, 0, 1);
    const bp = beatPulse(t, 0.2);

    ctx.save();
    ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    const textW = ctx.measureText(txt).width;

    const boxW = Math.max(360, textW + 96);
    const boxH = 58;
    const bx = Math.round((W - boxW) / 2);
    const by = Math.round(H - 74 + (1 - vis) * 18);

    // 背景底框
    paint(ctx, rectPts(bx, by, boxW, boxH, 10), {
      wash: PAL.night, fill: PAL.night, fillOp: 180, ink: PAL.whaleCyan, sw: 2
    });

    // 说话人标签
    if (speaker !== 'SYSTEM') {
      ctx.fillStyle = PAL.whaleCyan;
      ctx.font = 'bold 16px "Silkscreen", monospace';
      ctx.fillText(speaker, bx + 16, by + 24);
    }

    // 主字幕（卡点渐显）
    ctx.fillStyle = PAL.cream;
    ctx.font = 'bold 30px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillText(txt, bx + (speaker !== 'SYSTEM' ? 150 : 16), by + 42);

    // 卡点光晕
    if (bp > 0.7) {
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 4, by - 4, boxW + 8, boxH + 8);
    }

    ctx.restore();
  }

  const LYRICS_DAY1 = { LY, drawSubtitleBar };
  root.LYRICS_DAY1 = LYRICS_DAY1;
  if (typeof module !== 'undefined' && module.exports) module.exports = LYRICS_DAY1;
})(typeof window !== 'undefined' ? window : globalThis);
