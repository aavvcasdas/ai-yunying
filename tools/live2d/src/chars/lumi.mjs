/* 露米 Lumi ·「星鲸」/ Star Whale
   大肥鱼同族：深蓝→海蓝渐变长发、白蕾丝女仆发箍 + 海蓝蝴蝶结、鲸鳍耳、鲸尾、
   藏青女仆裙 + 白胸襟（小鲸徽记）、青蓝玻璃眼。 */
import {
  face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose,
  defs, lg, irisDef, bangs, sideLock, backHair, ahoge,
  whaleEar, whaleTail, whaleMark, laceBand, bow, maidTop, collar, neck, sleeve, star, bubble, ruffle,
} from "../lib.mjs";

const p = {
  hairRoot: "#1B2557", hairMid: "#2C4E9E", hairTip: "#6FB8EE", hairLight: "#8FD2F7",
  skin: "#FFE9E1", shade: "#F3C3BD",
  iris: ["#DFF8FF", "#6BC6F2", "#2A64BE", "#17306E"],
  cloth: "#1B2A57", clothDark: "#121D3E", clothLight: "#2C3F77",
  white: "#FFFFFF", trim: "#D8B36A", gem: "#3FC9C4", accent: "#4FB3EA",
  fin: "#1E3566", finInner: "#A9C8E8", tailLight: "#8CC6EE",
};

export const meta = {
  nameAscii: "Lumi", themeAscii: "Star Whale",
  id: "lumi",
  name: "露米 Lumi",
  theme: "星鲸",
  desc: "鲸鱼娘同族：深蓝→海蓝渐变长发、白蕾丝发箍 + 海蓝蝴蝶结、鲸鳍耳与鲸尾、藏青女仆裙配白色胸襟（小鲸徽记）；安静型。",
  palette: ["#1B2557", "#2C4E9E", "#6FB8EE", "#3FC9C4"],
};

export function render() {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  const G = [
    lg("hair", [[0, p.hairRoot], [38, p.hairMid], [74, "#4795DC"], [100, p.hairTip]]),
    lg("hairF", [[0, "#24407E"], [55, "#3A79C8"], [100, "#7CC3F2"]], 0.3, 0.05, 0.65, 0.95),
    lg("cloth", [[0, p.clothLight], [30, p.cloth], [100, p.clothDark]]),
    irisDef(p.iris),
  ].join("");

  /* 1 后发 */
  add("back hair", backHair({ fill: "url(#hair)", light: p.hairLight, top: 214, bottom: 928, outL: 250, outR: 774 }));

  /* 2 鲸尾 */
  add("tail", whaleTail({ x: 686, y: 888, s: 0.96, rot: -14, main: p.fin, light: p.tailLight }));

  /* 3 脖子 */
  add("neck", neck({ skin: p.shade, shade: "#E0A9A6" }));

  /* 4 胸衣 */
  add("topwear", `${maidTop({ cloth: "url(#cloth)", clothDark: p.clothDark, clothLight: p.clothLight, white: p.white, trim: p.trim })}
${whaleMark({ x: 512, y: 946, s: 0.9, color: "#3C6FBF" })}
${collar({ white: p.white, trim: p.clothDark })}`);

  /* 5-6 手臂 */
  add("handwear-l", sleeve({ dir: -1, cloth: "url(#cloth)", clothLight: p.clothLight, skin: p.skin, cuff: p.white }));
  add("handwear-r", sleeve({ dir: 1, cloth: "url(#cloth)", clothLight: p.clothLight, skin: p.skin, cuff: p.white }));

  /* 7 领结 + 宝石 */
  add("neckwear", `${bow({ x: 512, y: 676, s: 1.12, color: p.cloth, dark: p.clothDark, gem: p.gem })}
${bow({ x: 512, y: 676, s: 0.38, color: p.clothDark, dark: p.clothDark })}`);

  /* 8 脸 */
  add("face", face({ skin: p.skin, shade: p.shade }));

  /* 9 腮红 + 鼻子 */
  add("facedetail", `${blush({ x: 358, y: 494, color: "#F79FB4", opacity: 0.42 })}
${blush({ x: 666, y: 494, color: "#F79FB4", opacity: 0.42 })}
${nose({ y: 502, color: "#EBA9A6" })}`);

  /* 10-15 眼 */
  for (const [side, x] of [["l", 436], ["r", 588]]) {
    add(`eyewhite-${side}`, eyeWhite({ x, y: 446 }));
    add(`irides-${side}`, iris({ x, y: 448, r: 53 }));
    add(`eyelash-${side}`, lash({ x, y: 448, side, color: "#141C3C" }));
    add(`eye close-${side}`, closedEye({ x, y: 448, color: "#141C3C" }));
  }

  /* 16-17 嘴 */
  add("mouth close", mouthClose({ y: 530, color: "#B85F6B" }));
  add("mouth open", mouthOpen({ y: 522, inner: "#8E3F4E", tongue: "#E98E9A" }));

  /* 18 刘海 */
  add("front hair", bangs({ fill: "url(#hairF)", light: p.hairLight }));

  /* 19 侧发 + 呆毛 */
  add("front hair 2", `${sideLock({ x: 342, dir: -1, top: 296, bottom: 792, w: 60, fill: "url(#hairF)", light: p.hairLight })}
${sideLock({ x: 682, dir: 1, top: 296, bottom: 792, w: 60, fill: "url(#hairF)", light: p.hairLight })}
${ahoge({ x: 566, y: 164, s: 0.9, fill: p.hairMid })}`);

  /* 眉毛压在发丝上（动画常见画法） */
  add("eyebrow-l", brow({ x: 436, y: 364, color: "#2E3A60", rx: 36 }));
  add("eyebrow-r", brow({ x: 588, y: 364, color: "#2E3A60", rx: 36 }));

  /* 20 鲸鳍耳 */
  add("ear-l", whaleEar({ x: 330, y: 430, dir: -1, len: 138, color: p.fin, inner: p.finInner }));
  add("ear-r", whaleEar({ x: 694, y: 430, dir: 1, len: 138, color: p.fin, inner: p.finInner }));

  /* 21 蕾丝发箍 + 蝴蝶结 */
  add("headwear", `${laceBand({ cy: 332, rx: 200, ry: 128, band: p.cloth, lace: p.white, w: 19 })}
${bow({ x: 706, y: 318, s: 1.05, color: p.accent, dark: "#2E7BB5" })}`);

  /* 22 道具 */
  add("objects", `${bubble({ x: 806, y: 208, r: 15, opacity: 0.6 })}
${bubble({ x: 856, y: 268, r: 9, opacity: 0.5 })}
${bubble({ x: 772, y: 292, r: 6, opacity: 0.45 })}
${star({ x: 856, y: 168, r: 16, fill: "#FFFFFF", rot: 12, opacity: 0.85 })}`);

  return { defs: defs(p.iris, G), layers: L };
}
