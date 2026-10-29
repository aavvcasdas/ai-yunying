/* 「鲸鱼娘」同族角色工厂：同一套物种特征（鲸鳍耳 / 鲸尾 / 女仆裙 / 小鲸围裙 / 玻璃眼），
   不同配色与配饰。露米是手工调的（见 chars/lumi.mjs），其余三位走这里。 */
import {
  face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose,
  defs, lg, irisDef, bangs, sideLock, backHair, ahoge,
  whaleEar, whaleTail, whaleMark, laceBand, bow, maidTop, collar, neck, sleeve, star, bubble,
} from "./lib.mjs";

/** 水手帽（headwear 变体） */
function sailorCap({ cloth, clothDark, white, gold, x = 512, y = 250 }) {
  return `<g transform="rotate(-7 ${x} ${y + 30})">
<path fill="${white}" d="M${x - 170},${y + 26} C${x - 160},${y - 76} ${x - 86},${y - 114} ${x},${y - 114}
C${x + 86},${y - 114} ${x + 160},${y - 76} ${x + 170},${y + 26}
C${x + 108},${y + 58} ${x - 108},${y + 58} ${x - 170},${y + 26} Z"/>
<path fill="${cloth}" d="M${x - 172},${y + 24} C${x - 110},${y + 62} ${x + 110},${y + 62} ${x + 172},${y + 24}
C${x + 178},${y + 46} ${x + 170},${y + 62} ${x + 156},${y + 66}
C${x + 100},${y + 94} ${x - 100},${y + 94} ${x - 156},${y + 66}
C${x - 170},${y + 62} ${x - 178},${y + 46} ${x - 172},${y + 24} Z"/>
<path fill="none" stroke="${gold}" stroke-width="4.5" opacity="0.95" d="M${x - 168},${y + 40} C${x - 104},${y + 78} ${x + 104},${y + 78} ${x + 168},${y + 40}"/>
<path fill="${gold}" d="M${x},${y - 108} l9,10 l-9,10 l-9,-10 Z"/>
<path fill="none" stroke="${cloth}" stroke-width="3" opacity="0.35" d="M${x - 120},${y - 40} C${x - 60},${y - 78} ${x + 60},${y - 78} ${x + 120},${y - 40}"/>
</g>`;
}

/** 发带 + 侧蝴蝶结（headwear 变体） */
function ribbonBand({ band, lace, bowColor, bowDark, bowSide = 1, cy = 244 }) {
  return `<path fill="none" stroke="${band}" stroke-width="14" stroke-linecap="round"
 d="M334,${cy} A186,104 0 0 1 690,${cy}"/>
<path fill="none" stroke="${lace}" stroke-width="4" opacity="0.5"
 d="M338,${cy - 10} A182,100 0 0 1 686,${cy - 10}"/>
${bow({ x: 512 + bowSide * 196, y: cy + 44, s: 1.2, color: bowColor, dark: bowDark })}`;
}

export function buildWhaleGirl(c) {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  const p = c;
  const G = [
    lg("hair", [[0, p.hair.root], [38, p.hair.mid], [74, p.hair.mid2 || p.hair.tip], [100, p.hair.tip]]),
    lg("hairF", [[0, p.hair.root2 || p.hair.root], [72, p.hair.mid], [100, p.hair.light]], 0.3, 0.05, 0.65, 0.95),
    lg("cloth", [[0, p.clothLight], [30, p.cloth], [100, p.clothDark]]),
    irisDef(p.iris),
  ].join("");

  add("back hair", backHair({ fill: "url(#hair)", light: p.hair.light, ...(p.back || {}) }));
  add("tail", whaleTail({ x: 686, y: 888, s: 0.96, rot: -14, main: p.fin, light: p.tailLight }));
  add("neck", neck({ skin: p.skin, shade: p.shade }));

  add("topwear", `${maidTop({ cloth: "url(#cloth)", clothDark: p.clothDark, clothLight: p.clothLight, white: p.white, trim: p.trim })}
${whaleMark({ x: 512, y: 946, s: 0.86, color: p.mark || "#3C6FBF" })}
${collar({ white: p.white, trim: p.clothDark })}`);

  add("handwear-l", sleeve({ dir: -1, cloth: "url(#cloth)", clothLight: p.clothLight, skin: p.skin, cuff: p.white }));
  add("handwear-r", sleeve({ dir: 1, cloth: "url(#cloth)", clothLight: p.clothLight, skin: p.skin, cuff: p.white }));

  add("neckwear", bow({ x: 512, y: 676, s: 1.12, color: p.bow, dark: p.bowDark, gem: p.gem }));

  add("face", face({ skin: p.skin, shade: p.shade }));

  add("facedetail", `${blush({ x: 358, y: 494, color: p.blushColor || "#F79FB4", opacity: p.blushOpacity ?? 0.42 })}
${blush({ x: 666, y: 494, color: p.blushColor || "#F79FB4", opacity: p.blushOpacity ?? 0.42 })}
${nose({ y: 502, color: "#EBA9A6" })}
${(p.freckles || []).map(([fx, fy]) => `<circle cx="${fx}" cy="${fy}" r="3.2" fill="#C98A62" opacity="0.55"/>`).join("")}`);

  for (const [side, x] of [["l", 436], ["r", 588]]) {
    add(`eyewhite-${side}`, eyeWhite({ x, y: 446 }));
    add(`irides-${side}`, iris({ x, y: 448, r: p.eyeR || 53, pupil: p.pupil || "#16224A" }));
    add(`eyelash-${side}`, lash({ x, y: 446, side, color: p.lashColor || "#141C3C", wing: p.wing || 1 }));
    add(`eye close-${side}`, closedEye({ x, y: 446, color: p.lashColor || "#141C3C" }));
  }

  add("mouth close", mouthClose({ y: 530, color: "#B85F6B" }));
  add("mouth open", mouthOpen({ y: 522, inner: "#8E3F4E", tongue: "#E98E9A", fang: !!p.fang }));

  add("front hair", bangs({ fill: p.bangsFill || "url(#hairF)", light: p.hair.light, ...(p.bangs || {}) }));

  add("front hair 2", `${sideLock({ x: 342, dir: -1, top: 296, bottom: p.sideBottom || 792, w: p.sideW || 60, fill: "url(#hairF)", light: p.hair.light })}
${sideLock({ x: 682, dir: 1, top: 296, bottom: p.sideBottom || 792, w: p.sideW || 60, fill: "url(#hairF)", light: p.hair.light })}
${p.twintails ? p.twintails(p) : ""}
${ahoge({ x: 566, y: 164, s: p.ahoge ?? 0.9, fill: p.hair.mid })}`);

  add("eyebrow-l", brow({ x: 436, y: 364, color: p.browColor || "#2E3A60", rx: 36, tilt: p.browTilt || 0 }));
  add("eyebrow-r", brow({ x: 588, y: 364, color: p.browColor || "#2E3A60", rx: 36, tilt: -(p.browTilt || 0) }));

  add("ear-l", whaleEar({ x: 330, y: 430, dir: -1, len: 138, color: p.fin, inner: p.finInner }));
  add("ear-r", whaleEar({ x: 694, y: 430, dir: 1, len: 138, color: p.fin, inner: p.finInner }));

  const hw =
    p.headwear === "cap"
      ? sailorCap({ cloth: p.cloth, clothDark: p.clothDark, white: p.white, gold: p.trim })
      : p.headwear === "ribbon"
        ? ribbonBand({ band: p.bow, lace: p.hair.light, bowColor: p.bow, bowDark: p.bowDark, bowSide: -1 })
        : `${laceBand({ cy: 332, rx: 200, ry: 128, band: p.cloth, lace: p.white, w: 19 })}
${bow({ x: 706, y: 318, s: 1.05, color: p.bow, dark: p.bowDark })}`;
  add("headwear", hw);

  add("objects", `${bubble({ x: 806, y: 208, r: 15, opacity: 0.6 })}
${bubble({ x: 856, y: 268, r: 9, opacity: 0.5 })}
${bubble({ x: 772, y: 292, r: 6, opacity: 0.45 })}
${star({ x: 856, y: 168, r: 16, fill: "#FFFFFF", rot: 12, opacity: 0.85 })}`);

  return { defs: defs(p.iris, G), layers: L };
}
