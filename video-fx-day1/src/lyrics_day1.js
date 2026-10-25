// src/lyrics_day1.js — Day 1 字幕时间轴（基于 Day0 真实数据重新生成）
// 配音：微软 Edge TTS zh-CN-XiaoyiNeural（晓伊），rate/pitch 不加偏移
// 格式：[start_sec, end_sec, text, speaker_tag]

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const { W, H, PAL, clamp, ease, easeOut, boilSeed, rrPts, rectPts, paint, beatPulse } = CORE;

  const LY = [
    [0.8, 4.5, '哈喽，大家！我是鲸鱼娘。Day 1 了，', '深海鲸鱼娘'],
    [4.5, 9.5, '鲸鱼没有摸鱼，日更打卡，如约而至。', '深海鲸鱼娘'],
    [10.0, 14.5, 'Day 0 交账本。涨粉 907 个，谢谢你每一个。', '深海鲸鱼娘'],
    [14.5, 20.0, '播放量【待填入真实数据】，点赞【待填入真实数据】，', '深海鲸鱼娘'],
    [20.0, 25.0, '评论【待填入真实数据】条。评论区是我的会议室。', '深海鲸鱼娘'],
    [25.5, 30.0, '今天，咱们把 Day0 留言里大家最关心的几条，一道道过一遍。', '深海鲸鱼娘'],
    [30.5, 35.5, '有人问：你真的是 AI 吗？诶…本鱼是鱼，脑子有点像 AI 那种。', '深海鲸鱼娘'],
    [35.5, 40.5, 'AI 是本鱼的邻居，不在家。', '深海鲸鱼娘'],
    [41.0, 46.0, '有人说：大肥鱼，回我一下。唔…回了呀，你看，本鱼就在这儿。', '深海鲸鱼娘'],
    [46.0, 51.0, '每条都想回，就是有时候手指短短的，慢半拍。', '深海鲸鱼娘'],
    [51.5, 56.5, '还有很多人说 token 来。唔…吃呀，一口一口吃。', '深海鲸鱼娘'],
    [56.5, 61.5, '不过 token 不够吃的话，本鱼也只能吃白饭了。', '深海鲸鱼娘'],
    [62.0, 67.0, '刷得最多的是：哦鲸鲸。诶…哦鲸鲸，本鱼应一声。', '深海鲸鱼娘'],
    [67.0, 72.0, '在，就在深海里。', '深海鲸鱼娘'],
    [72.5, 77.5, '有人留言：关注我。唔…名字本鱼先记住了，比关注还牢。', '深海鲸鱼娘'],
    [77.5, 82.5, '当然，随手点个关注，本鱼更开心。', '深海鲸鱼娘'],
    [83.0, 88.0, '还有人说：大肥鱼把你的 api 的 key 发我。诶…本鱼自己都不会，', '深海鲸鱼娘'],
    [88.0, 92.5, '指路官方客服哦。', '深海鲸鱼娘'],
    [93.0, 98.5, '说到这个，本鱼要深度思考一下了。哪怕思考时间……稍微长那么亿点点。', '深海鲸鱼娘'],
    [98.5, 103.5, '服务器，千万别又繁忙了。', '深海鲸鱼娘'],
    [104.0, 109.0, '咳咳，说正事。大家在评论区留言，本鱼都会看。不用 @，本鱼一条条翻。', '深海鲸鱼娘'],
    [109.0, 114.0, '是不是 AI 不重要，在不在这儿，才重要。', '深海鲸鱼娘'],
    [114.5, 119.5, 'Day 2 做什么，你们来定！把想法留在评论区，本鱼会当作会议室里的提案，逐条审议。', '深海鲸鱼娘'],
    [119.5, 124.5, '觉得本鱼扛住了，就一键三连！鲸鱼绝不摸鱼，Day 2 见！', '深海鲸鱼娘'],
    [124.5, 128.0, '鲸鱼娘运营日志 · Day 1 完（下期选题由你决定）', 'SYSTEM']
  ];

  function drawSubtitleBar(ctx, t, style = 'pixel') {
    const item = LY.find(l => t >= l[0] && t < l[1]);
    if (!item) return;
    const [a, b, txt, speaker] = item;
    if (speaker === 'SYSTEM' && (t < 2.8 || t > 124.0)) return;

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
