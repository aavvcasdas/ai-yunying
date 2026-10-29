/* 妮莉 Nelly ·「冰海鲸」/ Ice Whale
   鲸鱼娘同族：冰蓝到奶油发梢、水手帽、鲸鳍耳 + 鲸尾、雀斑与虎牙。 */
import { buildWhaleGirl } from "../girl.mjs";

const p = {
  id: "nelly", name: "妮莉 Nelly", theme: "冰海鲸", nameAscii: "Nelly", themeAscii: "Ice Whale",
  desc: "鲸鱼娘同族：冰蓝到奶油色发梢、藏青水手帽、鲸鳍耳与鲸尾，金线领结，脸上有雀斑；活泼型。",
  palette: ["#40608F", "#7BA1C6", "#EDDDB8", "#E8B85E"],

  hair: { root: "#40608F", mid: "#7BA1C6", mid2: "#B4CCE4", tip: "#EDDDB8", light: "#FFF6DE" },
  skin: "#FFEDE6", shade: "#F3C6C0",
  iris: ["#E8FBFF", "#79D2E8", "#2B6E9E", "#123A5E"],
  cloth: "#1F2E56", clothDark: "#141F3E", clothLight: "#33497A",
  white: "#FFFFFF", trim: "#E0B863", bow: "#2E4C86", bowDark: "#1A2C55", gem: "#F2C572",
  fin: "#22335C", finInner: "#D6E6F4", tailLight: "#A9C8E8", mark: "#2B5FA8",
  eyeR: 54, wing: 0.95, browTilt: -2, browColor: "#4A5A78", lashColor: "#22304E",
  headwear: "cap", bangsFill: "#6F97C2", sideBottom: 806, sideW: 58, ahoge: 0.8, fang: true,
  freckles: [[382, 512], [402, 526], [366, 528], [642, 512], [622, 526], [656, 528]],
  blushColor: "#F9A9AE", blushOpacity: 0.5,
  bangs: { left: 310, right: 714, crownY: 146, tipY: 366, valleyY: 328 },
};

export const meta = { ...p };
export function render() { return buildWhaleGirl(p); }
