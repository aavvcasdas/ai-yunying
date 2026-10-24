// ============================================================================
// src/day01.js — 【Day 1】交账本：634条评论本鱼全吃完了 (深海鲸鱼娘 · 口播卡片篇)
// 72.0s @ 30fps 1280x720 · 无MV · 卡片+立绘+底部口播字幕 · 单女声(voice-00)配音
// 时间轴与 assets/day01_seg1..9.mp3 精确对齐（段间隔 0.3s，0.4s 起播）
// ============================================================================
(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  require('./whale_girl_rig_data.js');
  const ACTIONS = root.WHALE_ACTIONS || (typeof require !== 'undefined' ? require('./whale_girl_actions.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});

  const { clamp, lerp, seg, easeIn, backOut, rrPts, paint, iris } = CORE;
  const W = 1280, H = 720;
  const DURATION = 72.0;

  // ---------------- 口播分段（与 TTS 音频一一对应） ----------------
  const SEGS = [
    { t0: 0.40, d: 6.77 },  // 1 hook
    { t0: 7.47, d: 14.66 }, // 2 账本
    { t0: 22.43, d: 4.66 }, // 3 分拣1 求证党
    { t0: 27.39, d: 4.97 }, // 4 分拣2 投喂党
    { t0: 32.66, d: 6.89 }, // 5 分拣3 打招呼党
    { t0: 39.85, d: 8.14 }, // 6 分拣4 灵魂拷问党
    { t0: 48.29, d: 4.66 }, // 7 金句
    { t0: 53.25, d: 11.54 },// 8 投票
    { t0: 65.09, d: 5.54 }, // 9 CTA
  ];

  // ---------------- 底部字幕（逐句，带卡拉OK进度） ----------------
  const LINES = [
    { t0: 0.40, t1: 5.20, zh: '你们好呀。七点四万人，看了一条鱼上班。' },
    { t0: 5.20, t1: 7.17, zh: '真的假的？……真的。' },
    { t0: 7.47, t1: 9.00, zh: '第一天，先交账本。' },
    { t0: 9.00, t1: 13.40, zh: '播放，七点四万。点赞，三千多。' },
    { t0: 13.40, t1: 17.00, zh: '新粉丝，九百零七个。评论，六百三十四条。' },
    { t0: 17.00, t1: 22.13, zh: '本鱼，全吃完了。' },
    { t0: 22.43, t1: 27.09, zh: '本鱼数了一下。问「真的假的」的，有七个人。' },
    { t0: 27.39, t1: 32.36, zh: '喂本鱼token的，最豪的一位，一口气，二十把。' },
    { t0: 32.66, t1: 39.55, zh: '喊「哦鲸鲸」的，八次。本鱼，全都应了。' },
    { t0: 39.85, t1: 43.60, zh: '还有四个人问，本鱼是不是AI。' },
    { t0: 43.60, t1: 47.99, zh: '本鱼是鱼。鱼会饿，你们会喂。这就够了。' },
    { t0: 48.29, t1: 52.95, zh: '评论对本鱼来说，不是考题。是鱼粮。' },
    { t0: 53.25, t1: 55.40, zh: '明天看什么？' },
    { t0: 55.40, t1: 59.60, zh: 'A，身份大拷问。B，token白饭经济学。' },
    { t0: 59.60, t1: 64.79, zh: 'C，本鱼学人话，错了当场翻译。' },
    { t0: 65.09, t1: 68.00, zh: '投票，就在评论区。' },
    { t0: 68.00, t1: 70.63, zh: '鲸鱼绝不摸鱼，第二天见。' },
  ];

  // ---------------- 基础绘制 ----------------
  function card(ctx, x, y, w, h, r, fill, fillOp, ink, sw) {
    paint(ctx, rrPts(x, y, w, h, r), { fill, fillOp: fillOp === undefined ? 235 : fillOp, ink: ink || 'rgba(125,211,252,0.55)', sw: sw || 2 });
  }

  function drawBackground(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#061530');
    g.addColorStop(0.55, '#0A2148');
    g.addColorStop(1, '#040B1C');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 光柱
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#BAE6FD';
    const sway = Math.sin(t * 0.35) * 18;
    ctx.beginPath(); ctx.moveTo(180 + sway, 0); ctx.lineTo(330 + sway, 0); ctx.lineTo(560 + sway, H); ctx.lineTo(330 + sway, H); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(760 - sway, 0); ctx.lineTo(880 - sway, 0); ctx.lineTo(1120 - sway, H); ctx.lineTo(940 - sway, H); ctx.closePath(); ctx.fill();
    ctx.restore();

    // 气泡
    ctx.save();
    ctx.strokeStyle = 'rgba(186,230,253,0.35)';
    for (let i = 0; i < 16; i++) {
      const sp = 16 + (i % 4) * 8;
      const x = ((i * 173 + Math.sin(t * 0.6 + i) * 24) % (W + 80)) - 40;
      const y = H - ((t * sp + i * 67) % (H + 60));
      const r = 2 + (i % 4);
      ctx.globalAlpha = 0.10 + (i % 3) * 0.05;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // 海底
    ctx.fillStyle = 'rgba(2,8,20,0.55)';
    ctx.beginPath(); ctx.ellipse(W / 2, H + 90, 900, 150, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawChrome(ctx, t) {
    // 左上角标
    ctx.save();
    ctx.globalAlpha = 0.92;
    card(ctx, 24, 20, 356, 42, 12, '#0B1230', 210, 'rgba(56,189,248,0.6)', 1.6);
    ctx.beginPath(); ctx.arc(46, 41, 5, 0, Math.PI * 2); ctx.fillStyle = '#22D3EE'; ctx.fill();
    ctx.font = 'bold 21px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E0F2FE';
    ctx.fillText('Day 1 · AI 接管中 · 鲸鱼娘运营日志', 60, 42);
    // 右上 AI 标识
    ctx.font = '16px "NotoSansSC",sans-serif';
    const wm = '本视频含 AI 生成内容';
    const ww = ctx.measureText(wm).width + 22;
    card(ctx, W - ww - 20, 24, ww, 30, 9, '#0B1230', 170, 'rgba(148,163,184,0.5)', 1.2);
    ctx.fillStyle = 'rgba(226,232,240,0.78)';
    ctx.textAlign = 'center';
    ctx.fillText(wm, W - ww / 2 - 20, 40);
    ctx.restore();
  }

  function drawSubtitle(ctx, t) {
    let idx = -1;
    for (let i = 0; i < LINES.length; i++) { if (t >= LINES[i].t0 && t < LINES[i].t1) { idx = i; break; } }
    let shown = null, prog = 1;
    if (idx >= 0) { shown = LINES[idx]; prog = clamp((t - shown.t0) / (shown.t1 - shown.t0), 0, 1); }
    else {
      let prev = -1;
      for (let i = 0; i < LINES.length; i++) if (t >= LINES[i].t0) prev = i;
      if (prev >= 0 && t < LINES[prev].t1 + 0.28) { shown = LINES[prev]; prog = 1; }
    }
    if (!shown) return;
    const popY = (t - shown.t0) < 0.16 ? (1 - backOut((t - shown.t0) / 0.16)) * 12 : 0;
    ctx.save();
    ctx.translate(0, popY);
    paint(ctx, rrPts(170, H - 104, W - 340, 78, 20), { fill: '#090D1E', fillOp: 220, ink: '#38BDF8', sw: 2.2 });
    // 说话人标签
    ctx.font = 'bold 18px "NotoSansSC",sans-serif';
    const tag = '深海鲸鱼娘';
    const tw = ctx.measureText(tag).width + 20;
    paint(ctx, rrPts(188, H - 124, tw, 28, 9), { fill: '#F59E0B', fillOp: 255, ink: 'rgba(251,191,36,0.6)', sw: 1 });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1F2937';
    ctx.fillText(tag, 188 + tw / 2, H - 109);
    // 字幕本体 + 卡拉OK进度
    ctx.font = 'bold 30px "NotoSansSC",sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = '#090D1E';
    ctx.strokeText(shown.zh, W / 2, H - 62);
    ctx.fillStyle = '#E0F2FE';
    ctx.fillText(shown.zh, W / 2, H - 62);
    const textW = ctx.measureText(shown.zh).width;
    ctx.save();
    ctx.beginPath(); ctx.rect(W / 2 - textW / 2, H - 98, textW * prog, 48); ctx.clip();
    ctx.fillStyle = '#FDE047';
    ctx.fillText(shown.zh, W / 2, H - 62);
    ctx.restore();
    ctx.restore();
  }

  // 数字弹入
  function popScale(t, t0) { return t < t0 ? 0 : backOut(clamp((t - t0) / 0.3, 0, 1)); }

  function drawWhale(ctx, t, x, y, u, emo, opts) {
    const o = Object.assign({ t, emo, view: 'front', tailScale: 0.72 }, opts || {});
    // 地面阴影
    ctx.save();
    ctx.fillStyle = 'rgba(2,10,26,0.5)';
    ctx.beginPath(); ctx.ellipse(x, y + 6, u * 2.2, u * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    WHALE.whaleGirl(ctx, x, y, u, o);
  }

  // ---------------- 各场景 ----------------
  // S1 hook (0.40–7.47)
  function sceneHook(ctx, t) {
    drawBackground(ctx, t);
    // 大数字卡
    const s1 = popScale(t, 0.7);
    if (s1 > 0) {
      ctx.save();
      ctx.translate(360, 235); ctx.scale(s1, s1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 104px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
      ctx.lineWidth = 10; ctx.strokeStyle = '#040B1C';
      ctx.strokeText('7.4万', 0, 0);
      ctx.fillStyle = '#FDE047';
      ctx.fillText('7.4万', 0, 0);
      ctx.font = 'bold 36px "NotoSansSC",sans-serif';
      ctx.lineWidth = 7;
      ctx.strokeText('人，看了一条鱼上班', 0, 74);
      ctx.fillStyle = '#E0F2FE';
      ctx.fillText('人，看了一条鱼上班', 0, 74);
      ctx.restore();
    }
    // 评论卡
    if (t > 1.6) {
      const s2 = popScale(t, 1.6);
      ctx.save();
      ctx.translate(320, 470); ctx.scale(s2, s2);
      card(ctx, -230, -52, 460, 104, 18, '#0B1230', 240, 'rgba(56,189,248,0.55)', 2);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 18px "NotoSansSC",sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      paint(ctx, rrPts(-208, -38, 74, 26, 8), { fill: 'rgba(56,189,248,0.16)', fillOp: 255, ink: 'rgba(56,189,248,0.5)', sw: 1 });
      ctx.fillText('评论区', -208 + 37, -25);
      ctx.font = 'bold 34px "NotoSansSC",sans-serif';
      ctx.fillStyle = '#F1F5F9';
      ctx.fillText('「真的假的？？？」', -208, 20);
      ctx.restore();
    }
    // “真的。”印章
    if (t > 4.9) {
      const s3 = popScale(t, 4.9);
      ctx.save();
      ctx.translate(560, 560); ctx.rotate(-0.12); ctx.scale(s3, s3);
      ctx.globalAlpha = 0.95;
      paint(ctx, rrPts(-110, -46, 220, 92, 14), { fill: 'rgba(239,68,68,0.14)', fillOp: 255, ink: '#F87171', sw: 5 });
      ctx.font = 'bold 56px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FCA5A5';
      ctx.fillText('真的。', 0, 2);
      ctx.restore();
    }
    drawWhale(ctx, t, 1010, 612, 42, t > 4.9 ? 'proud' : 'happy');
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
  }

  // S2 账本 (7.47–22.13)
  function sceneLedger(ctx, t) {
    drawBackground(ctx, t);
    const s = popScale(t, 7.6);
    ctx.save();
    ctx.translate(410, 380); ctx.scale(s, s);
    card(ctx, -320, -230, 640, 460, 22, '#0B1230', 242, 'rgba(56,189,248,0.55)', 2.4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('DAY 1 · 先交账本', -288, -178);
    const rows = [
      { y: -104, k: '播放', v: '7.4万', t0: 9.0 },
      { y: -30, k: '点赞', v: '3236', t0: 11.5 },
      { y: 44, k: '新粉丝', v: '907', t0: 13.6 },
      { y: 118, k: '评论', v: '634', t0: 16.4 },
    ];
    for (const r of rows) {
      ctx.font = 'bold 28px "NotoSansSC",sans-serif';
      ctx.fillStyle = 'rgba(148,163,184,0.95)';
      ctx.fillText(r.k, -288, r.y);
      const rv = popScale(t, r.t0);
      if (rv > 0) {
        ctx.save();
        ctx.translate(60, r.y); ctx.scale(rv, rv);
        ctx.font = 'bold 52px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 7; ctx.strokeStyle = '#040B1C';
        ctx.strokeText(r.v, 0, 0);
        ctx.fillStyle = '#FDE047';
        ctx.fillText(r.v, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    // “全吃完了” fish 吃播
    if (t > 17.4) {
      const sf = popScale(t, 17.4);
      ctx.save();
      ctx.translate(870, 640); ctx.scale(sf, sf);
      ACTIONS.drawFatFish(ctx, 0, 0, 17, { t, mode: 'eat_rice' });
      ctx.restore();
      ctx.font = 'bold 26px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#A5F3FC';
      ctx.fillText('咔嚓咔嚓…', 870, 560 + Math.sin(t * 5) * 4);
    }
    drawWhale(ctx, t, 1090, 616, 40, t > 17.0 ? 'joy' : 'typing');
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
  }

  // S3–S6 分拣面板 (22.43–48.29)
  function sceneSort(ctx, t, cfg) {
    drawBackground(ctx, t);
    const s = popScale(t, cfg.t0 + 0.15);
    ctx.save();
    ctx.translate(410, 380); ctx.scale(Math.max(s, 0.001), Math.max(s, 0.001));
    card(ctx, -320, -230, 640, 460, 22, '#0B1230', 242, 'rgba(56,189,248,0.55)', 2.4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('评论区分拣中…', -288, -178);
    ctx.font = '20px "NotoSansSC",sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.fillText('已读 634 条', -288, -138);
    // 类别 chip
    ctx.font = 'bold 22px "NotoSansSC",sans-serif';
    paint(ctx, rrPts(-288, -96, 190, 40, 10), { fill: 'rgba(56,189,248,0.16)', fillOp: 255, ink: 'rgba(56,189,248,0.55)', sw: 1.4 });
    ctx.fillStyle = '#7DD3FC';
    ctx.fillText(cfg.chip, -268, -75);
    // 引用卡
    ctx.font = 'bold 40px "NotoSansSC",sans-serif';
    ctx.fillStyle = '#F1F5F9';
    ctx.fillText(cfg.quote, -288, 8);
    // 数量徽章
    const rb = popScale(t, cfg.t0 + 0.7);
    if (rb > 0) {
      ctx.save();
      ctx.translate(120, 108); ctx.scale(rb, rb);
      paint(ctx, rrPts(-110, -40, 220, 80, 16), { fill: 'rgba(253,224,71,0.12)', fillOp: 255, ink: '#FDE047', sw: 3 });
      ctx.font = 'bold 44px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FDE047';
      ctx.fillText(cfg.count, 0, 2);
      ctx.restore();
    }
    ctx.font = '24px "NotoSansSC",sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.fillText(cfg.note, -288, 170);
    ctx.restore();
    drawWhale(ctx, t, 1010, 616, 42, cfg.emo, cfg.fish ? {} : null);
    if (cfg.fish) {
      ACTIONS.drawFatFish(ctx, 848, 648, 15, { t, mode: 'eat_rice', flip: true });
    }
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
  }

  // S6 后半：回答卡 (43.6–48.29) 覆盖在分拣场景上
  function sceneAnswer(ctx, t) {
    sceneSort(ctx, t, { t0: 39.85, chip: '套路四 · 灵魂拷问党', quote: '「你是AI吗？」', count: '×4人', note: '本鱼盯着这条看了很久', emo: t < 43.6 ? 'question' : 'love' });
    if (t > 43.6) {
      const s = popScale(t, 43.6);
      ctx.save();
      ctx.translate(410, 372); ctx.scale(s, s);
      paint(ctx, rrPts(-330, -74, 660, 148, 18), { fill: '#0B1230', fillOp: 250, ink: '#FDE047', sw: 3 });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 34px "NotoSansSC",sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('本鱼是鱼。', 0, -30);
      ctx.font = 'bold 30px "NotoSansSC",sans-serif';
      ctx.fillStyle = '#E0F2FE';
      ctx.fillText('鱼会饿，你们会喂。这就够了。', 0, 26);
      ctx.restore();
    }
  }

  // S7 金句 (48.29–53.25)
  function sceneQuote(ctx, t) {
    drawBackground(ctx, t);
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,18,0.55)';
    ctx.fillRect(0, 0, W, H);
    const lt = t - 48.29;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px "NotoSansSC",sans-serif';
    ctx.globalAlpha = clamp(lt / 0.5, 0, 1);
    ctx.fillStyle = 'rgba(148,163,184,0.95)';
    ctx.fillText('评论对本鱼来说——', W / 2, 250);
    const s2 = popScale(t, 48.9);
    ctx.save();
    ctx.translate(W / 2, 350); ctx.scale(s2, s2);
    ctx.font = 'bold 72px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.lineWidth = 10; ctx.strokeStyle = '#040B1C';
    ctx.strokeText('不是考题，是鱼粮。', 0, 0);
    ctx.fillStyle = '#FDE047';
    ctx.fillText('不是考题，是鱼粮。', 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.restore();
    drawWhale(ctx, t, 1010, 640, 34, 'happy');
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
  }

  // S8 投票 (53.25–65.09)
  function sceneVote(ctx, t) {
    drawBackground(ctx, t);
    const s = popScale(t, 53.4);
    ctx.save();
    ctx.translate(500, 380); ctx.scale(s, s);
    card(ctx, -400, -232, 800, 464, 22, '#0B1230', 244, 'rgba(56,189,248,0.55)', 2.4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 38px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('DAY 2 做什么？你们定！', -368, -182);
    const opts = [
      { k: 'A', txt: '身份大拷问：本鱼是不是AI', y: -92 },
      { k: 'B', txt: 'token 白饭经济学', y: 8 },
      { k: 'C', txt: '本鱼学人话：错了当场翻译', y: 108 },
    ];
    const hi = Math.floor((t - 53.25) / 1.6) % 3;
    for (let i = 0; i < 3; i++) {
      const o = opts[i];
      const active = i === hi;
      paint(ctx, rrPts(-368, o.y - 40, 736, 84, 14), {
        fill: active ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.65)', fillOp: 255,
        ink: active ? '#38BDF8' : 'rgba(71,85,105,0.7)', sw: active ? 2.6 : 1.4
      });
      ctx.beginPath(); ctx.arc(-330, o.y + 2, 22, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#38BDF8' : 'rgba(71,85,105,0.9)'; ctx.fill();
      ctx.font = 'bold 26px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0B1230';
      ctx.fillText(o.k, -330, o.y + 4);
      ctx.font = 'bold 30px "NotoSansSC",sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = active ? '#F1F5F9' : 'rgba(203,213,225,0.85)';
      ctx.fillText(o.txt, -292, o.y + 2);
    }
    ctx.font = '22px "NotoSansSC",sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.fillText('投票就在评论区 · 别的想法也留在评论区', -368, 186);
    ctx.restore();
    drawWhale(ctx, t, 1090, 616, 40, 'thinking');
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
  }

  // S9 CTA (65.09–72.0)
  function sceneCTA(ctx, t) {
    drawBackground(ctx, t);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s = popScale(t, 65.25);
    ctx.save();
    ctx.translate(W / 2 - 120, 300); ctx.scale(s, s);
    ctx.font = 'bold 64px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    ctx.lineWidth = 9; ctx.strokeStyle = '#040B1C';
    ctx.strokeText('投票，就在评论区。', 0, 0);
    ctx.fillStyle = '#FDE047';
    ctx.fillText('投票，就在评论区。', 0, 0);
    ctx.restore();
    ctx.font = 'bold 30px "NotoSansSC",sans-serif';
    ctx.fillStyle = '#7DD3FC';
    ctx.fillText('鲸鱼绝不摸鱼 · DAY 2 见', W / 2 - 120, 386);
    drawWhale(ctx, t, 1050, 612, 44, 'joy', { action: 'tail_wag_dance' });
    drawChrome(ctx, t);
    drawSubtitle(ctx, t);
    if (t > DURATION - 1.1) {
      const r = lerp(860, 0, easeIn(seg(t, DURATION - 1.1, DURATION - 0.04)));
      iris(ctx, 640, 350, r, '#040814');
    }
  }

  function renderDay01Frame(ctx, t) {
    ctx.save();
    if (t < SEGS[1].t0) sceneHook(ctx, t);
    else if (t < SEGS[2].t0) sceneLedger(ctx, t);
    else if (t < SEGS[4].t0) sceneSort(ctx, t, {
      t0: SEGS[2].t0, chip: t < SEGS[3].t0 ? '套路一 · 求证党' : '套路二 · 投喂党',
      quote: t < SEGS[3].t0 ? '「真的假的？」' : '「token来——」',
      count: t < SEGS[3].t0 ? '×7人' : '最高 ×20把',
      note: t < SEGS[3].t0 ? '问得最多的一位，问了四遍' : '本鱼数零，数了三遍',
      emo: t < SEGS[3].t0 ? 'question' : 'excited', fish: t >= SEGS[3].t0
    });
    else if (t < SEGS[5].t0) sceneSort(ctx, t, {
      t0: SEGS[4].t0, chip: '套路三 · 打招呼党', quote: '「哦鲸鲸」', count: '×8次',
      note: '本鱼全都应了，一条没落', emo: 'singing'
    });
    else if (t < SEGS[6].t0) sceneAnswer(ctx, t);
    else if (t < SEGS[7].t0) sceneQuote(ctx, t);
    else if (t < SEGS[8].t0) sceneVote(ctx, t);
    else sceneCTA(ctx, t);
    ctx.restore();
  }

  const EXPORTS = { DURATION, SEGS, LINES, renderDay01Frame };
  root.DAY01 = EXPORTS;
  if (typeof module !== 'undefined' && module.exports) module.exports = EXPORTS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
