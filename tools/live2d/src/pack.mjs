/* 现成分层素材包的运行时（node / 浏览器共用）
   输入：包自带的 rig.json（parts / groups / physics / 眼睛与嘴的差分命名）
   输出：往 ctx 上画一帧 —— 头部转动 + 面部视差 + 头发次级物理 + 眨眼 + 口型 + 表情

   注意：这不是 Live2D 官方运行时，是把 rig.json 里的意图用 canvas 2D 复刻一遍，
   用来在没有 .moc3 的情况下验证「这套层拆得对不对、动起来像不像」。 */

export const CANVAS = { w: 1024, h: 1536 };

/* 每张图对应的 psd2live 语义层名（build-pack.mjs 出 PSD 时用） */
export const SEMANTIC = {
  backHair: "back hair",
  longHairLeft: "back hair 2-l",
  longHairRight: "back hair 2-r",
  neck: "neck",
  body: "topwear",
  face: "face",
  blushLeft: "facedetail-l",
  blushRight: "facedetail-r",
  chestBow: "neckwear",
  eyeWhiteLeft: "eyewhite-l",
  irisLeft: "irides-l",
  highlightLeft: "eyedetail-l",
  eyelidLeft: "eyelash-l",
  eyeWhiteRight: "eyewhite-r",
  irisRight: "irides-r",
  highlightRight: "eyedetail-r",
  eyelidRight: "eyelash-r",
  mouth: "mouth",
  headdress: "headwear",
  ribbonLeft: "headwear 2-l",
  ribbonRight: "headwear 2-r",
  sideHairLeft: "side hair-l",
  sideHairRight: "side hair-r",
  frontHair: "front hair",
  ahoge: "front hair 2",
  browLeft: "eyebrow-l",
  browRight: "eyebrow-r",
  whaleClip: "objects",
  tassel: "objects 2",
};

export const MOODS = ["neutral", "happy", "excited", "surprised", "sad", "angry", "shy"];

export function createState() {
  return {
    yaw: 0, pitch: 0, roll: 0,          // yaw/pitch -1..1；roll / bodyRoll 单位为「度」
    bodyX: 0, bodyY: 0, bodyRoll: 0,
    gazeX: 0, gazeY: 0,
    blink: 1,                            // 1 睁眼 0 闭眼
    mouth: 0,                            // 0..1
    cheekPuff: 0,
    blush: 0.82,
    mood: "neutral",
  };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 表情 → 眉 / 眼 / 嘴 的差分名 */
const MOOD_MAP = {
  neutral: { brow: "neutral", eye: "open", mouth: "N" },
  happy: { brow: "happy", eye: "happy", mouth: "happy-A" },
  excited: { brow: "excited", eye: "open", mouth: "happy-A" },
  surprised: { brow: "surprised", eye: "open", mouth: "O" },
  sad: { brow: "sad", eye: "half", mouth: "sad-N" },
  angry: { brow: "angry", eye: "open", mouth: "angry-N" },
  shy: { brow: "happy", eye: "half", mouth: "N" },
};

/** 眨眼值 → (eyelid 差分, eyeWhite 差分) */
function blinkVariants(v) {
  if (v <= 0.23) return ["closed", "closed"];
  if (v <= 0.7) return ["half", "half"];
  return ["open", "open"];
}

/** 张口值 → 嘴型差分 */
function mouthVariant(open, base) {
  if (open <= 0.03) return base === "happy" ? "happy-N" : base === "sad" ? "sad-N" : base === "angry" ? "angry-N" : "N";
  if (open <= 0.35) return "half";
  if (base === "happy") return "happy-A";
  if (base === "sad") return "sad-A";
  if (base === "angry") return "angry-A";
  return "A";
}

export function createPack(rig, images) {
  const parts = [...rig.parts].sort((a, b) => a.z - b.z);
  const springs = new Map();
  for (const p of parts) {
    if (p.physics) springs.set(p.id, { a: 0, v: 0, cfg: rig.physics[p.physics] || {} });
  }
  const byId = new Map(parts.map((p) => [p.id, p]));
  const head = rig.groups.find((g) => g.id === "head");
  const body = rig.groups.find((g) => g.id === "body");
  const face = rig.deformers?.face || { pivot: [519, 846], parallax: [190, 130] };

  const img = (name) => images[name];

  function pick(id, variant) {
    const p = byId.get(id);
    if (!p) return null;
    const base = p.image.replace(/\.png$/, "");
    if (!variant) return { p, image: img(p.image) };
    const v = img(`${base.split("-")[0]}-${variant}.png`);
    return { p, image: v || img(p.image) };
  }

  /** 画一帧 */
  function draw(ctx, st, dt = 1 / 60) {
    const mood = MOOD_MAP[st.mood] || MOOD_MAP.neutral;
    const [lidV, whiteV] = blinkVariants(st.blink);

    /* ── 次级物理（头发 / 飘带 / 呆毛）── */
    for (const [id, s] of springs) {
      const cfg = s.cfg;
      const drive = cfg.drive || {};
      const target =
        (st.yaw * (drive.yaw ?? 0) * 0.25 + st.roll * (drive.roll ?? 0) * 3 + st.bodyX * (drive.bodyX ?? 0) * 20) * 0.06;
      const k = (cfg.stiffness ?? 60) / 100;
      const damp = (cfg.damping ?? 15) / 100;
      s.v += (target - s.a) * (0.12 * k) - s.v * (0.18 + damp * 0.5);
      s.a += s.v * Math.min(2, dt * 60);
      s.a = clamp(s.a, -0.03, 0.03);
    }

    ctx.clearRect(0, 0, CANVAS.w, CANVAS.h);
    ctx.save();

    /* ── 身体组（bodyRoll 单位为度）── */
    const bPivot = body?.pivot || [519, 1536];
    const breath = Math.sin(Date.now() / 700) * 0.8;
    ctx.translate(bPivot[0] + st.bodyX * 26, bPivot[1] + st.bodyY * 18 + breath);
    ctx.rotate(clamp(st.bodyRoll * 0.5, -0.05, 0.05));
    ctx.translate(-bPivot[0], -bPivot[1] - breath);

    /* ── 头部组（roll 单位为度 × 组增益）── */
    const hPivot = head?.pivot || [520, 1035];
    const gain = head?.bindings?.rotation?.gain ?? 2.3;
    // rig.json 里的 roll 是弧度；乘组增益后再限幅，避免整块图旋转出 rect 露边
    const headRot = clamp(st.roll * gain, -0.10, 0.10);

    // 面部视差：转头时五官相对脸皮偏移；同时脸皮自身做轻微透视收窄
    const pdx = st.yaw * face.parallax[0] * 0.17 + st.gazeX * 6;
    const pdy = st.pitch * face.parallax[1] * 0.13 + st.gazeY * 5;
    const faceSquash = 1 - Math.min(0.05, Math.abs(st.yaw) * 0.045);

    for (const p of parts) {
      if (lidV === "closed" && /^(iris|highlight)/.test(p.id)) continue;
      const variant = variantFor(p.id, { lidV, whiteV, mood, open: st.mouth });
      const picked = pick(p.id, variant);
      const image = picked.image;
      if (!image) continue;

      const [px, py] = p.pivot || [CANVAS.w / 2, CANVAS.h];
      let dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, skew = 0;

      const onHead = p.parent === "head";
      if (onHead) {
        ctx.save();
        ctx.translate(hPivot[0] + clamp(st.yaw * 7, -7, 7), hPivot[1] + clamp(st.pitch * 5, -5, 5));
        ctx.rotate(headRot);
        ctx.translate(-hPivot[0], -hPivot[1]);
      }

      if (p.id === "face") { sx = faceSquash; dx += st.yaw * 7; }
      else if (/^(eyeWhite|iris|highlight|eyelid)/.test(p.id)) { dx += pdx; dy += pdy; }
      else if (/^(mouth|brow)/.test(p.id)) { dx += pdx * 1.08; dy += pdy * 1.08; }
      else if (/^blush/.test(p.id)) { dx += pdx * 0.9 + st.yaw * 5; dy += pdy * 0.9; sy = 1 + st.cheekPuff * 0.1 || 1; }
      else if (/^(frontHair|ahoge|headdress|whaleClip|tassel)/.test(p.id)) { dx += st.yaw * 5; dy += st.pitch * 3; }
      else if (/^(sideHair|ribbon)/.test(p.id)) {
        const s2 = springs.get(p.id);
        rot += s2 ? s2.a : 0;
        dx += st.yaw * 3;
      }
      else if (/^(backHair|longHair)/.test(p.id)) {
        const s2 = springs.get(p.id);
        rot += s2 ? s2.a : 0;
        dx -= st.yaw * 4;
      }
      else if (p.id === "body" || p.id === "neck") { dx += st.bodyX * 2; }

      ctx.save();
      if (dx || dy || rot || sx !== 1 || sy !== 1 || skew) {
        ctx.translate(px + dx, py + dy);
        if (rot) ctx.rotate(rot);
        if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
        if (skew) ctx.transform(1, 0, skew, 1, 0, 0);
        ctx.translate(-px, -py);
      }
      if (p.id === "blushLeft" || p.id === "blushRight") ctx.globalAlpha = clamp(st.blush, 0, 1);
      ctx.drawImage(image, p.rect[0], p.rect[1], p.rect[2], p.rect[3]);
      ctx.restore();

      if (onHead) ctx.restore();
    }

    ctx.restore();
  }

  function variantFor(id, { lidV, whiteV, mood, open }) {
    if (id === "eyelidLeft" || id === "eyelidRight") return lidV;
    if (id === "eyeWhiteLeft" || id === "eyeWhiteRight") return whiteV;
    if (id === "browLeft" || id === "browRight") return mood.brow;
    if (id === "mouth") return mouthVariant(open, mood.mouth);
    return null;
  }

  return { draw, parts, rig };
}
