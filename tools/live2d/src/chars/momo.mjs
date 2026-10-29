/* 桃桃 Momo ·「甜梦鲸」/ Sweet Whale
   鲸鱼娘同族：淡紫→粉发梢、双马尾、鲸鳍耳 + 鲸尾、粉领结，荷叶边女仆裙。 */
import { buildWhaleGirl } from "../girl.mjs";
import { bow } from "../lib.mjs";

const p = {
  id: "momo", name: "桃桃 Momo", theme: "甜梦鲸", nameAscii: "Momo", themeAscii: "Sweet Whale",
  desc: "鲸鱼娘同族：淡紫到粉的发梢 + 双马尾、鲸鳍耳与鲸尾、粉蝴蝶结，荷叶边女仆裙；软萌型，有虎牙。",
  palette: ["#3B2E6B", "#6A5BB5", "#F0A6C8", "#FF7FA8"],

  hair: { root: "#33285E", mid: "#6A5BB5", mid2: "#9A83D0", tip: "#F2AFCB", light: "#FFD3E4" },
  skin: "#FFEAE4", shade: "#F4C4BE",
  iris: ["#FFF3D8", "#F3B36A", "#A85E3C", "#5E2E22"],
  cloth: "#2A2450", clothDark: "#1C1838", clothLight: "#453C7A",
  white: "#FFFBFF", trim: "#E8C07A", bow: "#F2809F", bowDark: "#B84E70", gem: "#7FE0D0",
  fin: "#3A3170", finInner: "#FFD0E0", tailLight: "#C9A6E0", mark: "#6A5BB5",
  eyeR: 56, wing: 1.1, browTilt: -3, browColor: "#4A3560", lashColor: "#3A2340",
  headwear: "lace", sideBottom: 830, sideW: 62, ahoge: 1.05, fang: true,
  blushColor: "#FF8FAE", blushOpacity: 0.55,
  bangs: { left: 302, right: 722, crownY: 144, tipY: 370, valleyY: 330 },
  twintails: (p) => `<path fill="url(#hair)" d="M296,300 C212,404 196,620 226,800 C246,890 320,914 344,858 C362,816 332,706 330,596 C328,462 340,368 360,312 Z"/>
<path fill="url(#hair)" d="M728,300 C812,404 828,620 798,800 C778,890 704,914 680,858 C662,816 692,706 694,596 C696,462 684,368 664,312 Z"/>
<path fill="${p.hair.light}" opacity="0.32" d="M282,382 C238,520 234,672 252,772 C240,672 246,520 278,386 Z"/>
<path fill="${p.hair.light}" opacity="0.32" d="M742,382 C786,520 790,672 772,772 C784,672 778,520 746,386 Z"/>
${bow({ x: 292, y: 316, s: 1.0, color: p.bow, dark: p.bowDark })}
${bow({ x: 732, y: 316, s: 1.0, color: p.bow, dark: p.bowDark })}`,
};

export const meta = { ...p };
export function render() { return buildWhaleGirl(p); }
