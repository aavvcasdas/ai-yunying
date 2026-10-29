/* 只改布料的色相，保住原来的明暗与笔触。
 *
 * 之前用 HSL 逐像素软权重，蕾丝边缘会残留一圈异色噪点 —— 因为「带蓝调的近白」
 * 和布料只差 4~5% 的饱和度，阈值一放松就被一起染了。
 * 现在改成：先按「暗 + 蓝调」规则生成蒙版 → 开运算去掉孤立噪点 →
 * 3×3 羽化 → 只在蒙版内做色相旋转。白色蕾丝、皮肤、宝石完全不动。
 */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/* ── 蒙版工具 ───────────────────────────────── */

/** 3×3 腐蚀（缩小一像素）：去孤立噪点 */
function erode(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      out[i] = mask[i] && mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w] ? 1 : 0;
    }
  }
  return out;
}
/** 3×3 膨胀 */
function dilate(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      out[i] = mask[i] || mask[i - 1] || mask[i + 1] || mask[i - w] || mask[i + w] ? 1 : 0;
    }
  }
  return out;
}
/** 3×3 盒式羽化 → 0..1 的软权重 */
function feather(mask, w, h) {
  const out = new Float32Array(mask.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      out[i] =
        (mask[i] * 4 + (mask[i - 1] + mask[i + 1] + mask[i - w] + mask[i + w]) * 2 +
          mask[i - w - 1] + mask[i - w + 1] + mask[i + w - 1] + mask[i + w + 1]) / 16;
    }
  }
  return out;
}

/**
 * 布料蒙版：暗部 + 蓝调。蕾丝/围裙是近白（l 高），宝石是高饱和青，都会被排除。
 * @param lightMax 明度上限（低于它才算布料）
 * @param lightSoft 明度软过渡宽度
 * @param satTol 最低饱和度（排除纯灰/白）
 */
export function clothMask(data, w, h, { hueFrom = 196, hueTo = 272, lightMax = 0.56, lightSoft = 0.1, satTol = 0.1 } = {}) {
  const raw = new Uint8Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    if (data[i + 3] < 24) continue;                 // 透明/半透明边缘不参与
    const [hh, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
    if (l > lightMax + lightSoft) continue;
    if (s < satTol) continue;
    if (hh < hueFrom || hh > hueTo) continue;
    raw[p] = 1;
  }
  return feather(dilate(erode(dilate(raw, w, h), w, h), w, h), w, h);
}

/**
 * 在蒙版内换色相。lightMul / satMul 用来顺带压暗或提饱和。
 * @param spec { toHue, fromHue, satMul, lightMul, keepSpread }
 */
export function recolorWithMask(data, mask, spec) {
  const { fromHue = 228, toHue = 174, satMul = 1, lightMul = 1, keepSpread = 0.4 } = spec;
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const wgt = mask[p];
    if (wgt < 0.02) continue;
    const [h, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
    const nh = toHue + (h - fromHue) * keepSpread;
    const [r, g, b] = hsl2rgb(nh, clamp(s * satMul, 0, 0.92), clamp(l * lightMul, 0.02, 0.97));
    data[i] += (r - data[i]) * wgt;
    data[i + 1] += (g - data[i + 1]) * wgt;
    data[i + 2] += (b - data[i + 2]) * wgt;
  }
  return data;
}

/* ── 配色方案 ──────────────────────────────── */
/* cloth = 裙 / 胸衣 / 发箍织带；accent = 领结；ribbon = 侧飘带 / 流苏 */
export const PALETTES = {
  original: {
    label: "原色 · 藏青", labelAscii: "Original Navy",
    cloth: null, accent: null, ribbon: null,
  },
  teal: {
    label: "深海青", labelAscii: "Deep Teal",
    cloth:  { toHue: 174, satMul: 1.15, lightMul: 0.94 },
    accent: { toHue: 176, satMul: 1.2, lightMul: 1.0 },
    ribbon: { toHue: 174, satMul: 1.1, lightMul: 0.94 },
  },
  wine: {
    label: "酒红", labelAscii: "Wine Red",
    cloth:  { toHue: 348, satMul: 1.05, lightMul: 1.0 },
    accent: { toHue: 350, satMul: 1.05, lightMul: 1.0 },
    ribbon: { toHue: 348, satMul: 1.02, lightMul: 0.98 },
  },
  lavender: {
    label: "暮紫", labelAscii: "Dusk Lavender",
    cloth:  { toHue: 274, satMul: 0.9, lightMul: 1.08 },
    accent: { toHue: 276, satMul: 0.95, lightMul: 1.05 },
    ribbon: { toHue: 274, satMul: 0.92, lightMul: 1.05 },
  },
};

export const LAYER_SLOT = {
  "body.png": "cloth",
  "headdress.png": "cloth",
  "chestBow.png": "accent",
  "ribbonLeft.png": "ribbon",
  "ribbonRight.png": "ribbon",
  "tassel.png": "ribbon",
};
