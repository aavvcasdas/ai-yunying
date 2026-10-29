/* 共享骨架逻辑：浏览器预览与 Node 离线渲染共用同一份，避免两边行为不一致。
   输入：parts（已加载的图层）、参数对象
   输出：往 ctx 上画一帧 */

export const S = 2048;                       // 画布尺寸（与 PSD 一致）
const PIVOT_S = { x: 512 * (S / 1024), y: 560 * (S / 1024) };
export const EYE = { l: { x: 438 * (S / 1024), y: 432 * (S / 1024) }, r: { x: 586 * (S / 1024), y: 432 * (S / 1024) } };
const TAIL_ANCHOR = { x: 716 * (S / 1024), y: 850 * (S / 1024) };

export function roleOf(name) {
  const n = name.toLowerCase();
  if (n.startsWith("back hair")) return "backhair";
  if (n === "neck") return "neck";
  if (n.startsWith("tail")) return "tail";
  if (/^(face|facedetail|eyewhite|irides|eyelash|eye close|eyebrow|mouth|front hair|headwear|objects|ear)/.test(n)) return "head";
  return "body";
}

function drawPart(ctx, p, opt = {}) {
  const { tx = 0, ty = 0, rot = 0, pivot = PIVOT_S, scaleY = 1, scalePivotY = null, alpha = 1, scaleX = 1 } = opt;
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(pivot.x + tx, pivot.y + ty);
  ctx.rotate(rot);
  ctx.translate(-pivot.x, -pivot.y);
  if (scaleY !== 1 || scaleX !== 1) {
    const py = scalePivotY == null ? 0 : scalePivotY;
    ctx.translate(0, py);
    ctx.scale(scaleX, scaleY);
    ctx.translate(0, -py);
  }
  ctx.drawImage(p.img, p.left, p.top, p.w, p.h);
  ctx.restore();
}

/**
 * @param ctx   canvas 2d context
 * @param parts [{name,img,left,top,w,h,role}]
 * @param st    {ax,ay,az,bx,eo,mo,blink,breath,sway,talk}  ← 已计算好的数值（不是滑杆）
 */
export function drawScene(ctx, parts, st) {
  const { ax = 0, ay = 0, az = 0, bx = 0 } = st;
  const blink = st.blink ?? st.eo ?? 1;
  const breath = st.breath ?? 0;
  const sway = st.sway ?? 0;
  const sway2 = st.sway2 ?? sway;
  const eyeOpen = Math.min(blink, st.eo ?? 1);
  const mouthOpen = Math.min(1, Math.max(st.mo ?? 0, st.talk ?? 0));

  const headTx = ax * 3.2;
  const headTy = ay * 2.6;
  const headRot = ((az * Math.PI) / 180) * 0.55;
  const eyeTx = headTx * 0.42;
  const eyeTy = headTy * 0.42;

  ctx.clearRect(0, 0, S, S);

  for (const p of parts) {
    const name = p.name.toLowerCase();
    if (p.role === "backhair") {
      drawPart(ctx, p, { tx: headTx * 0.55, ty: headTy * 0.55 + breath * 1.2, rot: headRot * 0.35 + sway * 0.006 });
    } else if (p.role === "neck") {
      drawPart(ctx, p, { tx: headTx * 0.45, ty: headTy * 0.45 });
    } else if (p.role === "tail") {
      drawPart(ctx, p, { rot: sway * 0.09, pivot: TAIL_ANCHOR, ty: breath * 1.4 });
    } else if (p.role === "body") {
      drawPart(ctx, p, { tx: bx * 2.4, scaleY: 1 + breath * 0.006, scalePivotY: S * 0.98 });
    } else {
      const isFaceBit = /^(eyewhite|irides|eyelash|eye close|eyebrow|mouth)/.test(name);
      const opt = {
        tx: headTx + (isFaceBit ? eyeTx : 0),
        ty: headTy + (isFaceBit ? eyeTy : 0) + breath * 0.9,
        rot: headRot,
      };
      if (name === "eye close-l" || name === "eye close-r") {
        drawPart(ctx, p, { ...opt, alpha: Math.max(0, 1 - eyeOpen * 1.4) });
        continue;
      }
      if (/^eyewhite|^irides/.test(name)) {
        const c = p.name.endsWith("-r") ? EYE.r : EYE.l;
        drawPart(ctx, p, { ...opt, scaleY: Math.max(0.04, eyeOpen), scalePivotY: c.y });
        continue;
      }
      if (/^eyelash/.test(name)) {
        drawPart(ctx, p, { ...opt, alpha: Math.min(1, eyeOpen * 1.15) });
        continue;
      }
      if (p.name === "mouth open") {
        drawPart(ctx, p, { ...opt, scaleY: Math.max(0.001, mouthOpen), scalePivotY: 512 * (S / 1024), alpha: Math.min(1, mouthOpen * 3) });
        continue;
      }
      if (p.name === "mouth close") {
        drawPart(ctx, p, { ...opt, alpha: Math.max(0, 1 - mouthOpen * 2.2) });
        continue;
      }
      if (name.startsWith("front hair")) {
        drawPart(ctx, p, { ...opt, rot: headRot + sway * 0.012, tx: headTx + sway * 1.6 });
        continue;
      }
      if (name.startsWith("ear")) {
        drawPart(ctx, p, { ...opt, rot: headRot + sway2 * 0.02 });
        continue;
      }
      drawPart(ctx, p, opt);
    }
  }
}
