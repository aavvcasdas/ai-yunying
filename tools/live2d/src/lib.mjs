/* 部件绘制库：给角色模块复用的脸/眼/嘴零件。
   所有函数返回 SVG 字符串，坐标基于 1024×1024 画布，脸心约 (512, 400)。 */

export const CX = 512;

export function defs(iris, extra = "") {
  return `<defs>
  <radialGradient id="iris" cx="0.5" cy="0.3" r="0.8">
    <stop offset="0%" stop-color="${iris[0]}"/>
    <stop offset="52%" stop-color="${iris[1]}"/>
    <stop offset="100%" stop-color="${iris[2]}"/>
  </radialGradient>${extra}
</defs>`;
}

/** 脸皮：rx 决定脸宽，ry 决定脸长 */
export function face({ cx = CX, cy = 402, rx = 190, ry = 206, skin, shade }) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>
<path fill="${shade}" opacity="0.45" d="M${cx - rx + 30},${cy + 70} C${cx - rx + 50},${cy + 140} ${cx - 110},${cy + ry - 40} ${cx - 60},${cy + ry - 16} C${cx - 110},${cy + ry - 6} ${cx - 150},${cy + 120} ${cx - rx + 30},${cy + 70} Z"/>
<path fill="${shade}" opacity="0.3" d="M${cx - 18},${cy + ry - 26} C${cx - 6},${cy + ry - 18} ${cx + 6},${cy + ry - 18} ${cx + 18},${cy + ry - 26} C${cx + 6},${cy + ry - 10} ${cx - 6},${cy + ry - 10} ${cx - 18},${cy + ry - 26} Z"/>`;
}

/** 眼白 */
export function eyeWhite({ x, y, rx = 50, ry = 56, color = "#FFFFFF" }) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}"/>`;
}

/** 虹膜 + 瞳孔 + 高光；spark 控制高光大小 */
export function iris({ x, y, r = 39, pupil = "#1A2242", spark = 1, grad = "iris" }) {
  const s = (n) => (n * spark).toFixed(1);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})"/>
<circle cx="${x}" cy="${y + 2}" r="${(r * 0.46).toFixed(1)}" fill="${pupil}"/>
<circle cx="${x - r * 0.31}" cy="${y - r * 0.41}" r="${s(11.5)}" fill="#FFFFFF" opacity="0.95"/>
<circle cx="${x + r * 0.36}" cy="${y + r * 0.46}" r="${s(5.5)}" fill="#FFFFFF" opacity="0.85"/>
<path fill="#FFFFFF" opacity="0.28" d="M${x - r * 0.82},${y + r * 0.26} C${x - r * 0.82},${y - r * 0.38} ${x - r * 0.42},${y - r * 0.86} ${x},${y - r * 0.88} C${x - r * 0.56},${y - r * 0.62} ${x - r * 0.82},${y - r * 0.16} ${x - r * 0.82},${y + r * 0.26} Z"/>`;
}

/** 上睫毛：style 决定外眼角上挑还是下垂 */
export function lash({ x, y, rx = 50, color = "#232C4E", w = 11, style = "soft", side = "l" }) {
  const dir = side === "l" ? -1 : 1; // 供外眼角方向使用
  const outer = x + dir * rx * 0.9;
  const inner = x - dir * rx * 0.85;
  const top = y - 26;
  const base = `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="M${inner},${y - 8} C${inner + dir * rx * 0.45},${top - 6} ${outer - dir * rx * 0.45},${top - 6} ${outer},${y - 14}"/>`;
  let tip = "";
  if (style === "long") {
    tip = `<path fill="none" stroke="${color}" stroke-width="${(w * 0.85).toFixed(1)}" stroke-linecap="round" d="M${outer},${y - 14} C${outer + dir * 16},${y - 30} ${outer + dir * 26},${y - 44} ${outer + dir * 32},${y - 58}"/>`;
  } else if (style === "sharp") {
    tip = `<path fill="${color}" d="M${outer + dir * 4},${y - 22} C${outer + dir * 20},${y - 30} ${outer + dir * 30},${y - 40} ${outer + dir * 36},${y - 50} C${outer + dir * 22},${y - 30} ${outer + dir * 12},${y - 20} ${outer + dir * 4},${y - 14} Z"/>`;
  } else if (style === "droop") {
    tip = `<path fill="none" stroke="${color}" stroke-width="${(w * 0.8).toFixed(1)}" stroke-linecap="round" d="M${outer},${y - 14} C${outer + dir * 6},${y + 2} ${outer + dir * 14},${y + 14} ${outer + dir * 22},${y + 22}"/>`;
  }
  return base + tip;
}

/** 闭眼线 */
export function closedEye({ x, y, rx = 44, color = "#232C4E", w = 8 }) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="M${x - rx},${y} C${x - rx * 0.5},${y - 22} ${x + rx * 0.5},${y - 22} ${x + rx},${y}"/>`;
}

/** 眉毛；angle>0 内侧压下（生气/得意） */
export function brow({ x, y, rx = 36, color, w = 9, angle = 0, side = "l" }) {
  const dir = side === "l" ? -1 : 1;
  const innerY = y + angle * dir * -1;
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="M${x - rx},${innerY + 8} C${x - rx * 0.3},${y - 10} ${x + rx * 0.4},${y - 12} ${x + rx},${y + 2}"/>`;
}

/** 闭嘴（微笑线） */
export function mouthClose({ x = CX, y = 520, color = "#C4727E", w = 7, curve = 12 }) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="M${x - 17},${y} C${x - 6},${y + curve} ${x + 6},${y + curve} ${x + 17},${y}"/>`;
}

/** 张嘴：inner 口腔色，tongue 舌色，fang 是否画虎牙 */
export function mouthOpen({ x = CX, y = 512, inner = "#A34A56", tongue = "#E98E9A", fang = false }) {
  const f = fang
    ? `<path fill="#FFFFFF" d="M${x - 12},${y + 4} L${x - 4},${y + 4} L${x - 8},${y + 16} Z"/>`
    : "";
  return `<path fill="${inner}" d="M${x - 24},${y} C${x - 12},${y - 10} ${x + 12},${y - 10} ${x + 24},${y} C${x + 22},${y + 28} ${x - 22},${y + 28} ${x - 24},${y} Z"/>
<path fill="#FFFFFF" d="M${x - 20},${y - 2} C${x - 10},${y - 7} ${x + 10},${y - 7} ${x + 20},${y - 2} C${x + 12},${y + 4} ${x - 12},${y + 4} ${x - 20},${y - 2} Z"/>
<ellipse cx="${x}" cy="${y + 20}" rx="15" ry="9" fill="${tongue}"/>${f}`;
}

/** 腮红 */
export function blush({ x, y, rx = 36, ry = 19, color = "#F7A9B0", opacity = 0.5, stripes = true }) {
  const st = stripes
    ? `<path stroke="${color}" stroke-width="3.5" stroke-linecap="round" opacity="${opacity + 0.05}" fill="none"
     d="M${x - 14},${y - 6} L${x - 7},${y + 5} M${x + 1},${y - 8} L${x + 8},${y + 3} M${x + 16},${y - 6} L${x + 23},${y + 5}"/>`
    : "";
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}"/>${st}`;
}

/** 鼻子小点 */
export function nose({ x = CX, y = 492, color = "#F2BCB4", opacity = 0.75 }) {
  return `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${color}" opacity="${opacity}"/>`;
}

/** 四角星（发饰/道具） */
export function star({ x, y, r = 12, fill = "#FFE7A8", rot = 0, opacity = 1 }) {
  const k = r * 0.34;
  return `<path transform="rotate(${rot} ${x} ${y})" fill="${fill}" opacity="${opacity}"
    d="M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z"/>`;
}

export function bubble({ x, y, r = 14, stroke = "#FFFFFF", opacity = 0.75 }) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${stroke}" opacity="${opacity * 0.18}"/>
<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${stroke}" stroke-width="2" opacity="${opacity}"/>
<circle cx="${x - r * 0.32}" cy="${y - r * 0.36}" r="${r * 0.18}" fill="#FFFFFF" opacity="${opacity}"/>`;
}

/** 扇形刘海：尖端最低点由 tipY 控制，务必高于眼睛（眼顶 ≈ 376） */
export function bangs({ hair, light, left = 316, right = 708, crownY = 152, edgeY = 344, tipY = 356, valleyY = 296, spikes = 5, shine = 0.48 }) {
  const span = right - left;
  const vx = (i) => (left + (span * i) / spikes).toFixed(1);
  const tx = (i) => (left + (span * (i + 0.5)) / spikes).toFixed(1);
  let d = `M${left},${edgeY} L${vx(0)},${valleyY} `;
  for (let i = 0; i < spikes; i++) {
    d += `Q${((+vx(i) + +tx(i)) / 2).toFixed(1)},${tipY + 14} ${tx(i)},${tipY} `;
    d += `Q${((+tx(i) + +vx(i + 1)) / 2).toFixed(1)},${valleyY - 10} ${vx(i + 1)},${valleyY} `;
  }
  d += `L${right},${edgeY} `;
  d += `C${right - 6},${crownY + 130} ${right - 60},${crownY + 44} 512,${crownY} `;
  d += `C${left + 60},${crownY + 44} ${left + 6},${crownY + 130} ${left},${edgeY} Z`;
  return `<path fill="${hair}" d="${d}"/>
<path fill="${light}" opacity="${shine}" d="M${left + 46},${crownY + 96} C${left + 96},${crownY + 24} ${left + 190},${crownY - 8} 512,${crownY - 10} C${left + 340},${crownY - 8} ${right - 96},${crownY + 24} ${right - 46},${crownY + 96} C${right - 130},${crownY + 40} ${370},${crownY + 16} 512,${crownY + 14} C${300},${crownY + 16} ${left + 130},${crownY + 40} ${left + 46},${crownY + 96} Z"/>
<path fill="${light}" opacity="${(shine * 0.55).toFixed(2)}" d="M${left + 74},${crownY + 140} C${left + 120},${crownY + 84} ${left + 186},${crownY + 60} ${left + 236},${crownY + 56} C${left + 176},${crownY + 84} ${left + 116},${crownY + 122} ${left + 96},${crownY + 168} Z"/>`;
}

/** 侧发束：从发根垂到 sideBottom，dir=-1 左 / 1 右 */
export function sideLock({ x, dir, top = 320, bottom = 720, w = 74, hair, light, shine = 0.36 }) {
  const outer = x + dir * w;
  const d = `M${x},${top} C${x + dir * 8},${top + 130} ${x + dir * (w * 0.95)},${bottom - 190} ${outer},${bottom}
C${x + dir * (w * 0.52)},${bottom - 26} ${x + dir * 14},${bottom - 130} ${x - dir * 4},${top + 40} Z`;
  const hl = `M${x + dir * 12},${top + 46} C${x + dir * 14},${top + 150} ${x + dir * (w * 0.56)},${bottom - 210} ${x + dir * (w * 0.72)},${bottom - 96}
C${x + dir * (w * 0.4)},${bottom - 200} ${x + dir * 26},${top + 170} ${x + dir * 12},${top + 46} Z`;
  return `<path fill="${hair}" d="${d}"/>
<path fill="${light}" opacity="${shine}" d="${hl}"/>`;
}

/** 鳍耳：base 贴头，tip 外扩；dir -1 左 / 1 右 */
export function finEar({ x, y, dir, len = 108, h = 60, color, color2, fin = "#9DC2EC" }) {
  const tipX = x + dir * len;
  return `<path fill="${color}" d="M${x},${y + h * 0.5} C${x + dir * len * 0.55},${y - h * 0.55} ${tipX - dir * 26},${y - h * 0.42} ${tipX},${y}
C${tipX - dir * 20},${y + h * 0.5} ${x + dir * len * 0.4},${y + h * 0.72} ${x},${y + h * 0.5} Z"/>
<path fill="${color2}" d="M${x + dir * 10},${y + h * 0.34} C${x + dir * len * 0.5},${y - h * 0.24} ${tipX - dir * 34},${y - h * 0.16} ${tipX - dir * 22},${y + h * 0.04}
C${tipX - dir * 40},${y + h * 0.24} ${x + dir * len * 0.36},${y + h * 0.44} ${x + dir * 10},${y + h * 0.34} Z"/>
<path fill="none" stroke="${fin}" stroke-width="4" opacity="0.55" stroke-linecap="round" d="M${x + dir * 26},${y + h * 0.1} C${x + dir * 56},${y - h * 0.02} ${x + dir * 84},${y + h * 0.02} ${x + dir * (len - 30)},${y + h * 0.02}"/>`;
}
