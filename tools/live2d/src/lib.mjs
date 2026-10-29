/* 部件绘制库 v2 —— 「鲸鱼娘」同族画法
   坐标基于 1024×1024 画布：脸心 (512, 396)，眼心 (436/588, 442)，下巴 592。
   所有函数返回 SVG 字符串；角色模块负责把渐变塞进 defs。 */

export const CX = 512;
export const FACE = { cx: CX, cy: 396, rx: 186, ry: 196 };
export const EYE = { l: 436, r: 588, cy: 446, rx: 54, ry: 58 };

/* ── 渐变工具 ─────────────────────────────────── */
export const lg = (id, stops, x1 = 0.35, y1 = 0, x2 = 0.6, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}%" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</linearGradient>`;

export const rg = (id, stops, cx = 0.5, cy = 0.62, r = 1.0) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}%" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</radialGradient>`;

/** 眼睛虹膜渐变：默认下亮上暗（参考图的玻璃球质感） */
export const toPairs = (stops) =>
  typeof stops[0] === "string"
    ? stops.map((c, i) => [Math.round((i * 100) / Math.max(1, stops.length - 1)), c])
    : stops;
export const irisDef = (stops) => rg("iris", toPairs(stops), 0.5, 0.72, 1.02);

export function defs(iris, extra = "") {
  const irisDefs = Array.isArray(iris) ? irisDef(iris) : String(iris || "");
  const dup = extra.includes('id="iris"') ? "" : "";
  return `<defs>${irisDefs}${extra}</defs>`;
}

/* ── 脸 ───────────────────────────────────────── */
/** 脸皮：上方接近半圆、下巴收窄并带一点颊肉 */
export function face({ cx = CX, cy = 396, rx = 186, ry = 196, skin, shade = "#F0B9B4" }) {
  const d = `M${cx - rx},${cy - 26}
C${cx - rx},${cy - ry * 0.94} ${cx - rx * 0.6},${cy - ry} ${cx},${cy - ry}
C${cx + rx * 0.6},${cy - ry} ${cx + rx},${cy - ry * 0.94} ${cx + rx},${cy - 26}
C${cx + rx},${cy + ry * 0.4} ${cx + rx * 0.64},${cy + ry * 0.84} ${cx},${cy + ry}
C${cx - rx * 0.64},${cy + ry * 0.84} ${cx - rx},${cy + ry * 0.4} ${cx - rx},${cy - 26} Z`;
  return `<path fill="${skin}" d="${d}"/>
<path fill="${shade}" opacity="0.22" d="M${cx - rx * 0.9},${cy + 40} C${cx - rx * 0.8},${cy + ry * 0.52} ${cx - rx * 0.4},${cy + ry * 0.86} ${cx - 10},${cy + ry * 0.97} C${cx - rx * 0.42},${cy + ry * 0.72} ${cx - rx * 0.72},${cy + ry * 0.36} ${cx - rx * 0.7},${cy + 30} Z"/>
<ellipse cx="${cx}" cy="${cy + ry - 6}" rx="30" ry="9" fill="${shade}" opacity="0.18"/>`;
}

/* ── 眼 ───────────────────────────────────────── */
export function eyeWhite({ x, y = EYE.cy, rx = EYE.rx, ry = EYE.ry, color = "#FFFFFF" }) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}"/>
<ellipse cx="${x}" cy="${y - ry * 0.62}" rx="${rx * 0.94}" ry="${ry * 0.4}" fill="#D9E4F2" opacity="0.55"/>`;
}

/** 虹膜：渐变 + 深色瞳孔 + 上方暗环 + 底部反光 + 三处高光 */
export function iris({ x, y = EYE.cy + 2, r = 46, pupil = "#16224A", spark = 1 }) {
  const s = (n) => (n * spark).toFixed(1);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#iris)"/>
<circle cx="${x}" cy="${y - r * 0.02}" r="${(r * 0.42).toFixed(1)}" fill="${pupil}" opacity="0.94"/>
<ellipse cx="${x}" cy="${y + r * 0.5}" rx="${(r * 0.46).toFixed(1)}" ry="${(r * 0.28).toFixed(1)}" fill="#FFFFFF" opacity="0.3"/>
<circle cx="${x - r * 0.33}" cy="${y - r * 0.38}" r="${s(13)}" fill="#FFFFFF" opacity="0.95"/>
<circle cx="${x + r * 0.4}" cy="${y + r * 0.28}" r="${s(6.5)}" fill="#FFFFFF" opacity="0.7"/>
<circle cx="${x + r * 0.04}" cy="${y - r * 0.62}" r="${s(3.6)}" fill="#FFFFFF" opacity="0.6"/>
<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${pupil}" stroke-width="5" opacity="0.42"/>`;
}

/** 上睫毛：填充块 + 外眼角小翘，比描边更像参考图 */
export function lash({ x, y = EYE.cy, rx = EYE.rx, ry = EYE.ry, color = "#1B2444", side = "l", wing = 1 }) {
  const dir = side === "l" ? -1 : 1;
  const pt = (a, sx, sy) => [x + Math.cos((a * Math.PI) / 180) * sx * dir, y - Math.sin((a * Math.PI) / 180) * sy];
  const a0 = 6, a1 = 174, steps = 12;
  let outer = "", inner = "";
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const [ox, oy] = pt(a, rx + 13 + 7 * Math.sin((Math.PI * i) / steps), ry + 15 + 6 * Math.sin((Math.PI * i) / steps));
    outer += (i ? "L" : "M") + ox.toFixed(1) + "," + oy.toFixed(1) + " ";
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const [ix, iy] = pt(a, rx - 1, ry - 2);
    inner += "L" + ix.toFixed(1) + "," + iy.toFixed(1) + " ";
  }
  const [tx, ty] = pt(a1, rx + 8, ry + 8);
  const tip = `M${tx.toFixed(1)},${ty.toFixed(1)} C${(tx + dir * 10 * wing).toFixed(1)},${(ty - 16).toFixed(1)} ${(tx + dir * 16 * wing).toFixed(1)},${(ty - 30).toFixed(1)} ${(tx + dir * 20 * wing).toFixed(1)},${(ty - 46).toFixed(1)}
 C${(tx + dir * 6 * wing).toFixed(1)},${(ty - 26).toFixed(1)} ${(tx - dir * 2).toFixed(1)},${(ty - 14).toFixed(1)} ${(tx - dir * 6).toFixed(1)},${(ty - 2).toFixed(1)} Z`;
  return `<path fill="${color}" d="${outer}${inner}Z"/><path fill="${color}" d="${tip}"/>`;
}

/** 闭眼线（笑眼 / 眨眼） */
export function closedEye({ x, y = EYE.cy, rx = EYE.rx, color = "#1B2444", w = 9, happy = false }) {
  const dy = happy ? -10 : 6;
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"
 d="M${x - rx * 0.86},${y + 6} C${x - rx * 0.4},${y + dy - 20} ${x + rx * 0.4},${y + dy - 20} ${x + rx * 0.86},${y + 6}"/>
<path fill="none" stroke="${color}" stroke-width="${w * 0.7}" stroke-linecap="round" opacity="0.55"
 d="M${x + rx * 0.5},${y + dy - 12} L${x + rx * 0.8},${y + 2}"/>`;
}

export function brow({ x, y = 344, rx = 36, color = "#3A4568", w = 6.5, tilt = 0 }) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="0.85"
 d="M${x - rx},${y + 8 + tilt} C${x - rx * 0.4},${y - 10 + tilt} ${x + rx * 0.4},${y - 10 - tilt} ${x + rx},${y + 2 - tilt}"/>`;
}

/* ── 嘴 / 鼻 / 腮红 ───────────────────────────── */
export function mouthClose({ x = CX, y = 522, color = "#B85F6B", w = 6, curve = 13 }) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"
 d="M${x - 20},${y} C${x - 7},${y + curve} ${x + 7},${y + curve} ${x + 20},${y}"/>`;
}

/** 张嘴：上唇 + 口腔 + 舌 + 可选小虎牙 */
export function mouthOpen({ x = CX, y = 514, inner = "#8E3F4E", tongue = "#E98E9A", fang = false, w = 26 }) {
  return `<path fill="${inner}" d="M${x - w},${y}
C${x - w * 0.6},${y - 12} ${x + w * 0.6},${y - 12} ${x + w},${y}
C${x + w * 0.86},${y + 30} ${x - w * 0.86},${y + 30} ${x - w},${y} Z"/>
<path fill="#FFFFFF" d="M${x - w * 0.8},${y - 1} C${x - w * 0.4},${y - 9} ${x + w * 0.4},${y - 9} ${x + w * 0.8},${y - 1}
C${x + w * 0.4},${y + 6} ${x - w * 0.4},${y + 6} ${x - w * 0.8},${y - 1} Z"/>
<ellipse cx="${x}" cy="${y + 21}" rx="${w * 0.56}" ry="10" fill="${tongue}"/>${
    fang
      ? `<path fill="#FFFFFF" d="M${x - 13},${y + 2} L${x - 4},${y + 2} L${x - 8.5},${y + 15} Z"/>`
      : ""
  }`;
}

export function nose({ x = CX, y = 496, color = "#EBA9A6", opacity = 0.6 }) {
  return `<ellipse cx="${x}" cy="${y}" rx="6" ry="4.5" fill="${color}" opacity="${opacity}"/>`;
}

export function blush({ x, y = 486, rx = 32, ry = 17, color = "#F79FB4", opacity = 0.42, stripes = true }) {
  const st = stripes
    ? `<g stroke="${color}" stroke-width="3.4" stroke-linecap="round" opacity="${(opacity + 0.16).toFixed(2)}">
<path d="M${x - 15},${y - 6} L${x - 8},${y + 6}"/><path d="M${x - 1},${y - 8} L${x + 6},${y + 4}"/>
<path d="M${x + 13},${y - 6} L${x + 20},${y + 6}"/></g>`
    : "";
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}"/>${st}`;
}

/* ── 头发 ─────────────────────────────────────── */
/**
 * 刘海：五束带弧度的水滴形发绺（不是锯齿块），尖端 tipY 必须高于眼顶 376
 * fill / light 支持 url(#grad)
 */
export function bangs({ fill, light, left = 306, right = 718, crownY = 146, tipY = 372, valleyY = 338, spikes = 5, shine = 0.45 }) {
  const span = right - left;
  const tips = [
    { x: left + span * 0.12, y: tipY - 2 },
    { x: left + span * 0.30, y: tipY + 6 },
    { x: left + span * 0.5, y: tipY - 6 },
    { x: left + span * 0.70, y: tipY + 4 },
    { x: left + span * 0.88, y: tipY - 4 },
  ];
  const valleys = [left, left + span * 0.22, left + span * 0.41, left + span * 0.6, left + span * 0.79, right];
  const vy = (i) => valleyY + (i % 2 ? 8 : -4);
  let edge = `L${right},${vy(5)} `;
  for (let i = tips.length - 1; i >= 0; i--) {
    const t = tips[i];
    edge += `L${t.x.toFixed(1)},${t.y.toFixed(1)} `;
    edge += `Q${(t.x - 6).toFixed(1)},${(t.y - 12).toFixed(1)} ${valleys[i].toFixed(1)},${vy(i)} `;
  }
  const d = `M${left},${crownY + 150}
C${left + 14},${crownY + 26} ${left + 96},${crownY - 6} 512,${crownY - 6}
C${right - 96},${crownY - 6} ${right - 14},${crownY + 26} ${right},${crownY + 150} ${edge}Z`;
  let strands = "";
  for (const t of tips) {
    strands += `<path fill="none" stroke="#0B1533" stroke-width="2.6" opacity="0.16" stroke-linecap="round"
 d="M${(t.x + 10).toFixed(1)},${crownY + 70} C${(t.x + 16).toFixed(1)},${t.y - 150} ${(t.x + 6).toFixed(1)},${t.y - 60} ${t.x.toFixed(1)},${t.y - 4}"/>`;
  }
  return `<path fill="${fill}" d="${d}"/>${strands}
<path fill="${light}" opacity="${shine}" d="M${left + 56},${crownY + 92} C${left + 112},${crownY + 24} ${left + 200},${crownY + 2} 512,${crownY}
C${right - 112},${crownY + 24} ${right - 56},${crownY + 92} ${right - 56},${crownY + 92}
C${right - 120},${crownY + 44} ${370},${crownY + 22} 512,${crownY + 20} C${300},${crownY + 22} ${left + 120},${crownY + 44} ${left + 56},${crownY + 92} Z"/>
<path fill="${light}" opacity="${(shine * 0.45).toFixed(2)}" d="M${left + 110},${crownY + 126}
C${left + 186},${crownY + 66} ${left + 268},${crownY + 46} ${left + 330},${crownY + 50}
C${left + 258},${crownY + 68} ${left + 190},${crownY + 104} ${left + 152},${crownY + 160} Z"/>
`;
}

/** 侧发：一条 S 形发绺，末端呈尖；dir -1 左 / 1 右 */
export function sideLock({ x, dir, top = 300, bottom = 760, w = 58, fill, light, shine = 0.4 }) {
  const outer = x + dir * w;
  const d = `M${x},${top}
C${x + dir * 16},${top + 130} ${x + dir * (w * 1.15)},${bottom - 160} ${outer + dir * 6},${bottom}
C${x + dir * (w * 0.46)},${bottom - 40} ${x + dir * 6},${bottom - 150} ${x - dir * 10},${top + 50} Z`;
  const hl = `M${x + dir * 10},${top + 60} C${x + dir * 14},${top + 170} ${x + dir * (w * 0.62)},${bottom - 230} ${x + dir * (w * 0.8)},${bottom - 120}
C${x + dir * (w * 0.44)},${bottom - 210} ${x + dir * 24},${top + 170} ${x + dir * 10},${top + 60} Z`;
  return `<path fill="${fill}" d="${d}"/><path fill="${light}" opacity="${shine}" d="${hl}"/>`;
}

/** 后发：左右两片大波浪，发梢更亮 */
export function backHair({ fill, light, top = 210, bottom = 900, outL = 260, outR = 764, wavy = 1 }) {
  const L = `<path fill="${fill}" d="M${outR - 20},${top + 60}
C${outR + 30},${top + 190} ${outR + 16},${top + 380} ${outR - 24},${top + 470}
C${outR + 8},${top + 520} ${outR - 30},${top + 580} ${outR - 10},${top + 640}
C${outL + 40},${bottom - 20} ${outL + 90},${bottom + 10} ${outL + 40},${bottom - 40}
C${outL + 10},${bottom - 200} ${outL + 18},${top + 380} ${outL + 4},${top + 210}
C${outL + 20},${top + 90} ${512 - 120},${top - 10} 512,${top - 4}
C${512 + 130},${top - 10} ${outR - 40},${top + 10} ${outR - 20},${top + 60} Z"/>`;
  const hl = `<path fill="${light}" opacity="0.28" d="M${outL + 60},${top + 250}
C${outL + 40},${top + 430} ${outL + 54},${top + 560} ${outL + 74},${top + 640}
C${outL + 30},${top + 560} ${outL + 26},${top + 420} ${outL + 46},${top + 250} Z"/>
<path fill="${light}" opacity="0.22" d="M${outR - 60},${top + 260}
C${outR - 40},${top + 440} ${outR - 56},${top + 570} ${outR - 76},${top + 650}
C${outR - 32},${top + 560} ${outR - 26},${top + 420} ${outR - 46},${top + 260} Z"/>`;
  return `${L}${hl}`;
}

/** 呆毛：一根卷曲 */
export function ahoge({ x = 566, y = 132, s = 1, fill, stroke = "none" }) {
  return `<path fill="none" stroke="${fill}" stroke-width="${16 * s}" stroke-linecap="round"
 d="M${x},${y + 20 * s} C${x + 10 * s},${y - 26 * s} ${x + 62 * s},${y - 44 * s} ${x + 54 * s},${y - 4 * s}
C${x + 48 * s},${y + 22 * s} ${x + 16 * s},${y + 12 * s} ${x + 20 * s},${y - 12 * s}"/>`;
}

/* ── 鲸鱼族特征 ───────────────────────────────── */

/** 鲸鳍耳：外鳍带三个扇贝缺口，内侧浅色鳍膜；dir -1 左 / 1 右 */
export function whaleEar({ x, y = 430, dir = -1, len = 128, color, inner = "#A9C8E8", edge = "#8FB6DE" }) {
  const o = (v) => (x + dir * v).toFixed(1);
  const outer = `M${x},${y - 30}
C${o(34)},${y - 70} ${o(78)},${y - 80} ${o(len)},${y - 62}
Q${o(len - 4)},${y - 30} ${o(len - 30)},${y - 14}
Q${o(len - 6)},${y + 6} ${o(len - 44)},${y + 10}
Q${o(len - 20)},${y + 30} ${o(len - 64)},${y + 26}
C${o(64)},${y + 44} ${o(26)},${y + 38} ${x},${y + 20} Z`;
  const membrane = `M${o(14)},${y - 16}
C${o(42)},${y - 50} ${o(78)},${y - 56} ${o(len - 12)},${y - 48}
Q${o(len - 22)},${y - 26} ${o(len - 44)},${y - 12}
Q${o(len - 26)},${y + 2} ${o(len - 58)},${y + 4}
C${o(62)},${y + 16} ${o(34)},${y + 14} ${o(14)},${y - 16} Z`;
  const lines = `<g stroke="${edge}" stroke-width="2.6" opacity="0.55" fill="none">
<path d="M${o(20)},${y - 8} C${o(54)},${y - 16} ${o(90)},${y - 26} ${o(len - 26)},${y - 40}"/>
<path d="M${o(26)},${y + 2} C${o(58)},${y + 0} ${o(86)},${y - 6} ${o(len - 48)},${y - 10}"/>
<path d="M${o(32)},${y + 10} C${o(56)},${y + 12} ${o(78)},${y + 10} ${o(len - 62)},${y + 6}"/></g>`;
  return `<path fill="${color}" d="${outer}"/><path fill="${inner}" opacity="0.92" d="${membrane}"/>
<path fill="none" stroke="${color}" stroke-width="3" opacity="0.6" d="${outer}"/>${lines}`;
}

/** 鲸尾：root 在 (x,y)，向右后方甩起；main 主色 / light 腹面 / edge 描线 */
export function whaleTail({ x = 690, y = 880, s = 1, rot = -12, main, light, edge = "#0E2140" }) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
<path fill="${main}" d="M0,-40
C84,-52 168,-58 240,-44
C292,-84 322,-120 356,-146
C346,-96 326,-58 300,-18
C328,-4 352,30 368,74
C328,60 296,42 266,20
C198,36 92,42 0,44 Z"/>
<path fill="${light}" opacity="0.55" d="M6,16
C88,14 186,10 252,4
C282,20 312,40 344,60
C304,52 272,36 248,18
C180,30 90,30 6,30 Z"/>
<path fill="none" stroke="${edge}" stroke-width="4" opacity="0.35" d="M8,-26 C96,-40 178,-46 246,-36"/>
<path fill="none" stroke="${light}" stroke-width="5" opacity="0.5" d="M40,6 C130,2 210,-2 268,-6"/>
</g>`;
}

/** 小鲸鱼徽记（围裙 / 领口用） */
export function whaleMark({ x = CX, y = 900, s = 1, color = "#3C6FBF", belly = "#FFFFFF" }) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
<path fill="${color}" d="M-30,4 C-30,-16 -12,-26 4,-24 C20,-22 30,-12 30,0
C30,10 20,18 4,18 C-14,18 -30,14 -30,4 Z"/>
<path fill="${color}" d="M28,-2 C38,-12 50,-18 58,-18 C54,-8 50,0 46,4 C54,8 58,14 62,22 C52,20 40,14 30,8 Z"/>
<path fill="${belly}" opacity="0.9" d="M-24,10 C-8,16 10,16 26,10 C20,18 4,22 -6,20 C-16,18 -22,14 -24,10 Z"/>
<circle cx="-16" cy="-6" r="2.6" fill="#FFFFFF"/>
<path fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" d="M-6,-26 C-6,-34 -2,-38 2,-40 M4,-24 C6,-32 10,-34 14,-36"/>
<circle cx="-1" cy="-42" r="3" fill="${color}" opacity="0.75"/>
<circle cx="15" cy="-38" r="2.4" fill="${color}" opacity="0.75"/>
</g>`;
}

/** 蕾丝扇贝边：沿 y 排一圈白色小半圆（包头 / 围裙 / 裙摆通用） */
export function scallop({ from, to, y, r = 15, color = "#FFFFFF", curve = 0 }) {
  let out = "";
  const n = Math.max(2, Math.round((to - from) / (r * 1.72)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const cx = from + (to - from) * t;
    const cy = y + curve * Math.sin(Math.PI * t);
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${color}"/>`;
  }
  return out;
}

/** 女仆蕾丝发箍：贴头弧带 + 上缘扇贝 + 侧蝴蝶结 */
export function laceBand({ cx = CX, cy = 330, rx = 196, ry = 126, band = "#22305A", lace = "#FFFFFF", w = 18 }) {
  let scallops = "";
  const n = 15;
  for (let i = 1; i < n; i++) {
    const a = Math.PI * (i / n);
    const px = cx - Math.cos(a) * (rx + 4);
    const py = cy - Math.sin(a) * (ry + 6);
    scallops += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="15" fill="${lace}"/>`;
  }
  return `<path fill="none" stroke="${lace}" stroke-width="${w * 2.2}" stroke-linecap="round"
 d="M${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy}"/>
<path fill="none" stroke="${band}" stroke-width="${w}" stroke-linecap="round"
 d="M${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy}"/>
${scallops}`;
}

/** 蝴蝶结；size 缩放，le 是左侧小飘带 */
export function bow({ x, y, s = 1, color, dark, gem = null }) {
  const g = gem
    ? `<circle cx="${x}" cy="${y + 2}" r="${7 * s}" fill="${gem}"/><circle cx="${x - 2.4 * s}" cy="${y - 1}" r="${2.4 * s}" fill="#FFFFFF" opacity="0.8"/>`
    : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">
<path fill="${dark}" d="M-6,0 C-30,-22 -52,-14 -46,4 C-40,20 -18,14 -6,4 Z"/>
<path fill="${color}" d="M6,0 C30,-22 52,-14 46,4 C40,20 18,14 6,4 Z"/>
<path fill="${dark}" opacity="0.55" d="M-8,4 C-18,24 -30,34 -40,34 C-34,22 -22,10 -10,2 Z"/>
<path fill="${color}" opacity="0.9" d="M8,4 C18,24 30,34 40,34 C34,22 22,10 10,2 Z"/>
<ellipse cx="0" cy="2" rx="${9 * s}" ry="${8 * s}" fill="${color}"/>
<ellipse cx="0" cy="2" rx="${9 * s}" ry="${8 * s}" fill="#FFFFFF" opacity="0.18"/>
${g}</g>`;
}

/** 荷叶边裙摆 / 围裙边：一排白色小圆弧 */
export function ruffle({ from, to, y, r = 13, color = "#FFFFFF", step = 1.7 }) {
  return scallop({ from, to, y, r, color, curve: -6 * step });
}

/* ── 服装 ─────────────────────────────────────── */
/** 女仆胸衣：深色主体 + 白色前襟 + 立领 + 金线 + 小鲸围裙 */
export function maidTop({ cloth, clothDark, clothLight, white = "#FFFFFF", trim = "#D8B36A", skin = "#FFE8DD" }) {
  return `<path fill="${cloth}" d="M512,614
C604,614 684,648 708,702 C732,754 742,868 746,1024
L278,1024 C282,868 292,754 316,702 C340,648 420,614 512,614 Z"/>
<path fill="${clothLight}" opacity="0.45" d="M512,624 C574,624 626,640 660,668 C624,652 570,644 512,644 C454,644 400,652 364,668 C398,640 450,624 512,624 Z"/>
<path fill="${white}" d="M512,640
C552,640 582,654 598,680 C612,734 618,862 620,1024 L404,1024
C406,862 412,734 426,680 C442,654 472,640 512,640 Z"/>
<path fill="${clothDark}" opacity="0.28" d="M404,1024 C406,862 412,734 426,680 C418,738 414,862 412,1024 Z"/>
<path fill="${clothDark}" opacity="0.28" d="M620,1024 C618,862 612,738 598,680 C606,738 610,862 612,1024 Z"/>
<path fill="none" stroke="${trim}" stroke-width="3.2" opacity="0.9" d="M378,1010 C380,860 390,748 406,692"/>
<path fill="none" stroke="${trim}" stroke-width="3.2" opacity="0.9" d="M646,1010 C644,860 634,748 618,692"/>
${ruffle({ from: 434, to: 590, y: 672, r: 13, color: white })}
<path fill="none" stroke="${trim}" stroke-width="2.8" opacity="0.75" d="M446,720 L578,720"/>
<circle cx="478" cy="800" r="5.5" fill="${trim}"/><circle cx="512" cy="806" r="5.5" fill="${trim}"/><circle cx="546" cy="800" r="5.5" fill="${trim}"/>
<circle cx="462" cy="884" r="4.5" fill="${trim}" opacity="0.7"/><circle cx="562" cy="884" r="4.5" fill="${trim}" opacity="0.7"/>`;
}

/** 白色立领 + 领口金扣 */
export function collar({ white = "#FFFFFF", trim = "#22305A" }) {
  return `<path fill="${white}" d="M512,624 C546,624 570,634 582,650 L512,704 L442,650 C454,634 478,624 512,624 Z"/>
<path fill="none" stroke="${trim}" stroke-width="3.2" opacity="0.6" d="M512,628 C544,628 566,637 577,650 L512,699 L447,650 C458,637 480,628 512,628 Z"/>`;
}

/** 脖子 + 颈下阴影 */
export function neck({ skin, shade }) {
  return `<path fill="${skin}" d="M474,548 L550,548 L556,650 C538,664 486,664 468,650 Z"/>
<path fill="${shade}" opacity="0.38" d="M474,548 L550,548 L550,588 C532,600 490,600 474,588 Z"/>`;
}

/** 袖子 + 手（dir -1 左 / 1 右） */
export function sleeve({ dir, cloth, clothLight, skin, cuff = "#FFFFFF", x = 512, y = 690, inner = 128, outer = 208 }) {
  const o = (v) => (x + dir * v).toFixed(1);
  return `<path fill="${cloth}" d="M${o(inner)},${y}
C${o(outer - 28)},${y + 2} ${o(outer)},${y + 40} ${o(outer)},${y + 96}
C${o(outer)},${y + 160} ${o(outer - 6)},${y + 220} ${o(outer - 12)},${y + 262}
C${o(outer - 34)},${y + 278} ${o(outer - 70)},${y + 278} ${o(outer - 92)},${y + 262}
C${o(outer - 94)},${y + 200} ${o(outer - 92)},${y + 130} ${o(outer - 90)},${y + 96}
C${o(outer - 88)},${y + 40} ${o(outer - 82)},${y + 4} ${o(inner)},${y} Z"/>
<path fill="${clothLight}" opacity="0.4" d="M${o(outer - 20)},${y + 12} C${o(outer - 6)},${y + 24} ${o(outer - 4)},${y + 60} ${o(outer - 6)},${y + 104}
C${o(outer - 16)},${y + 62} ${o(outer - 26)},${y + 28} ${o(outer - 20)},${y + 12} Z"/>
<path fill="${cuff}" d="M${o(outer - 96)},${y + 250} C${o(outer - 66)},${y + 268} ${o(outer - 36)},${y + 268} ${o(outer - 12)},${y + 250}
C${o(outer - 8)},${y + 286} ${o(outer - 10)},${y + 308} ${o(outer - 14)},${y + 320}
C${o(outer - 44)},${y + 334} ${o(outer - 74)},${y + 334} ${o(outer - 96)},${y + 320}
C${o(outer - 100)},${y + 306} ${o(outer - 100)},${y + 286} ${o(outer - 96)},${y + 250} Z"/>
<path fill="${skin}" d="M${o(outer - 92)},${y + 314} C${o(outer - 62)},${y + 328} ${o(outer - 40)},${y + 328} ${o(outer - 16)},${y + 314}
C${o(outer - 14)},${y + 352} ${o(outer - 30)},${y + 374} ${o(outer - 54)},${y + 374}
C${o(outer - 78)},${y + 374} ${o(outer - 94)},${y + 352} ${o(outer - 92)},${y + 314} Z"/>`;
}

/** 四角星 / 水泡（道具层） */
export function star({ x, y, r = 12, fill = "#FFE7A8", rot = 0, opacity = 1 }) {
  const k = r * 0.34;
  return `<path transform="rotate(${rot} ${x} ${y})" fill="${fill}" opacity="${opacity}"
 d="M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z"/>`;
}

export function bubble({ x, y, r = 14, stroke = "#FFFFFF", opacity = 0.75 }) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${stroke}" opacity="${opacity * 0.18}"/>
<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${stroke}" stroke-width="2" opacity="${opacity}"/>
<circle cx="${x - r * 0.32}" cy="${y - r * 0.36}" r="${r * 0.2}" fill="#FFFFFF" opacity="${opacity}"/>`;
}
