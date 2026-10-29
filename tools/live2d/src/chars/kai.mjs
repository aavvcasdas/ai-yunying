/* 凯 Kai ·「赤潮鲸」/ Crimson Whale
   鲸鱼娘同族：短发鲸鳍耳 + 鲸尾，深蓝→钢蓝发，红发带与红领结，机能感女仆短外套。 */
import { buildWhaleGirl } from "../girl.mjs";
import { bow } from "../lib.mjs";

const p = {
  id: "kai", name: "凯 Kai", theme: "赤潮鲸", nameAscii: "Kai", themeAscii: "Crimson Whale",
  desc: "鲸鱼娘同族：深蓝短发 + 鲸鳍耳 + 鲸尾，红色发带与红领结，立领短外套配白胸襟；酷帅型。",
  palette: ["#16203C", "#24417C", "#6E8FD0", "#D8484A"],

  hair: { root: "#1A2544", mid: "#2E5090", mid2: "#4A79BE", tip: "#8FB6E8", light: "#B6D2F2" },
  skin: "#FFE7DE", shade: "#F0BEB6",
  iris: ["#DFF0FF", "#6E9EDC", "#243E7A", "#14264E"],
  cloth: "#1A2440", clothDark: "#10182C", clothLight: "#2C3D63",
  white: "#F7FAFF", trim: "#C8A06A", bow: "#C6393C", bowDark: "#8C2429", gem: "#5FD8D0",
  fin: "#16223C", finInner: "#8FB4DE", tailLight: "#5E86C8", mark: "#3C6FBF",
  eyeR: 50, wing: 1.35, browTilt: 4, browColor: "#232E4E", lashColor: "#0F1730",
  headwear: "ribbon", sideBottom: 700, sideW: 54, ahoge: 0.7,
  back: { top: 224, bottom: 796, outL: 286, outR: 740 },
  bangs: { left: 316, right: 710, crownY: 152, tipY: 368, valleyY: 332 },
};

export const meta = { ...p };
export function render() { return buildWhaleGirl(p); }
