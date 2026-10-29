/* 露米 Lumi ·「星鲸」
   原创角色：长直深蓝紫发 + 星环额饰 + 水手领 + 鲸尾，鳍状耳。 */
import { face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose, star, defs, bangs, sideLock, finEar } from "../lib.mjs";

const p = {
  hair: "#3B3A7E", hairMid: "#443F92", hairDark: "#282555", hairLight: "#6663C4",
  skin: "#FFE9E3", shade: "#F8CFC9",
  iris: ["#B6F2E8", "#5FC8C0", "#1F5E6B"],
  cloth: "#2A3566", clothDark: "#1B2347", clothLight: "#3E4C86",
  accent: "#7CE0D0", gold: "#FFE7A8",
  white: "#FAFCFF",
};

export const meta = {
  nameAscii: "Lumi", themeAscii: "Star Whale",
  id: "lumi",
  name: "露米 Lumi",
  theme: "星鲸",
  desc: "长直深蓝紫发 + 星环额饰 + 水手领，鳍状耳与鲸尾；冷色系，安静型。",
  palette: ["#3B3A7E", "#6663C4", "#7CE0D0", "#FFE7A8"],
};

export function render() {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  add("back hair", `
<path fill="${p.hair}" d="M512,110 C680,110 794,228 794,424 C794,600 788,772 780,900 L744,900 L726,832 L700,900 L512,872 L324,900 L298,832 L280,900 L244,900 C236,772 230,600 232,424 C232,228 344,110 512,110 Z"/>
<path fill="${p.hairDark}" opacity="0.42" d="M512,330 C604,330 664,392 672,480 C680,562 666,660 656,740 L512,872 L368,740 C358,660 344,562 352,480 C360,392 420,330 512,330 Z"/>`);

  add("tail", `
<path fill="#4A6FA8" d="M700,866 C780,832 862,846 910,894 C924,910 918,926 900,926 C856,894 794,886 734,904 Z"/>
<path fill="#4A6FA8" d="M892,878 C920,852 954,846 978,860 C964,886 936,906 906,912 Z"/>
<path fill="#6E9BD0" opacity="0.7" d="M712,876 C774,848 838,858 876,892 C834,872 772,870 726,892 Z"/>`);

  add("neck", `<path fill="${p.shade}" d="M480,548 L544,548 L550,652 L474,652 Z"/>`);

  add("topwear", `
<path fill="${p.cloth}" d="M512,606 C570,606 622,634 664,672 C716,718 744,788 752,880 L760,1024 L264,1024 L272,880 C280,788 308,718 360,672 C402,634 454,606 512,606 Z"/>
<path fill="${p.clothDark}" d="M512,606 C558,606 600,622 636,646 C602,666 558,678 512,678 C466,678 422,666 388,646 C424,622 466,606 512,606 Z"/>
<path fill="${p.white}" d="M512,642 C470,642 430,652 392,674 L350,746 L464,776 L512,702 L560,776 L674,746 L632,674 C594,652 554,642 512,642 Z"/>
<path fill="${p.clothLight}" d="M512,656 C476,656 444,664 414,680 L386,730 L464,750 L512,690 L560,750 L638,730 L610,680 C580,664 548,656 512,656 Z"/>
<path fill="${p.cloth}" d="M512,700 C520,700 528,706 528,716 L528,1024 L496,1024 L496,716 C496,706 504,700 512,700 Z"/>
<path fill="${p.clothLight}" d="M334,760 C324,830 322,930 326,1024 L392,1024 C384,920 386,832 396,776 Z"/>
<path fill="${p.clothLight}" d="M690,760 C700,830 702,930 698,1024 L632,1024 C640,920 638,832 628,776 Z"/>`);

  add("handwear-l", `
<path fill="${p.clothDark}" d="M300,690 C268,756 254,858 258,962 C262,994 290,1006 316,996 C338,988 344,966 340,942 C330,850 332,762 348,704 Z"/>
<path fill="${p.clothLight}" d="M306,704 C284,762 274,854 278,944 C282,962 294,968 304,964 C298,864 300,768 314,718 Z"/>`);

  add("handwear-r", `
<path fill="${p.clothDark}" d="M724,690 C756,756 770,858 766,962 C762,994 734,1006 708,996 C686,988 680,966 684,942 C694,850 692,762 676,704 Z"/>
<path fill="${p.clothLight}" d="M718,704 C740,762 750,854 746,944 C742,962 730,968 720,964 C726,864 724,768 710,718 Z"/>`);

  add("neckwear", `
<path fill="${p.accent}" d="M512,668 L462,644 L466,700 C482,696 500,692 512,690 Z"/>
<path fill="${p.accent}" d="M512,668 L562,644 L558,700 C542,696 524,692 512,690 Z"/>
<circle cx="512" cy="668" r="11" fill="#54BFB2"/>
<circle cx="508" cy="664" r="4" fill="#CFF7F1"/>`);

  add("ear-l", finEar({ x: 336, y: 448, dir: -1, len: 116, h: 62, color: "#5A78B4", color2: "#84A6D8" }));

  add("ear-r", finEar({ x: 688, y: 448, dir: 1, len: 116, h: 62, color: "#5A78B4", color2: "#84A6D8" }));

  add("face", face({ skin: p.skin, shade: p.shade, rx: 190, ry: 206 }));

  add("facedetail", `
${blush({ x: 372, y: 490, color: "#F7A9B0", opacity: 0.42 })}
${blush({ x: 652, y: 490, color: "#F7A9B0", opacity: 0.42 })}
${nose({ y: 494, color: "#F2BCB4", opacity: 0.6 })}`);

  add("eyewhite-l", eyeWhite({ x: 436, y: 432 }));
  add("eyewhite-r", eyeWhite({ x: 588, y: 432 }));
  add("irides-l", iris({ x: 436, y: 434, r: 38 }));
  add("irides-r", iris({ x: 588, y: 434, r: 38 }));
  add("eyelash-l", lash({ x: 436, y: 430, rx: 50, color: "#2A2F58", w: 10, style: "soft", side: "l" }));
  add("eyelash-r", lash({ x: 588, y: 430, rx: 50, color: "#2A2F58", w: 10, style: "soft", side: "r" }));
  add("eye close-l", closedEye({ x: 436, y: 432, rx: 44, color: "#2A2F58", w: 7 }));
  add("eye close-r", closedEye({ x: 588, y: 432, rx: 44, color: "#2A2F58", w: 7 }));
  add("eyebrow-l", brow({ x: 436, y: 352, rx: 38, color: p.hairDark, w: 9, angle: -2, side: "l" }));
  add("eyebrow-r", brow({ x: 588, y: 352, rx: 38, color: p.hairDark, w: 9, angle: -2, side: "r" }));

  add("mouth close", mouthClose({ y: 522, color: "#C4727E", w: 6, curve: 10 }));
  add("mouth open", mouthOpen({ y: 514 }));

  add("front hair", bangs({ hair: p.hair, light: p.hairLight, tipY: 352, valleyY: 292, spikes: 5 }));

  add("front hair 2", sideLock({ x: 358, dir: -1, bottom: 716, w: 58, hair: p.hairMid || p.hair, light: p.hairLight, shine: 0.16 }) +
    sideLock({ x: 666, dir: 1, bottom: 716, w: 58, hair: p.hairMid || p.hair, light: p.hairLight, shine: 0.16 }) +
    `<path fill="${p.hair}" d="M648,180 C644,140 662,114 692,106 C714,100 728,112 722,126 C714,114 702,110 690,116 C672,126 668,152 672,184 Z"/>`);

  add("headwear", `
<path fill="none" stroke="${p.gold}" stroke-width="9" opacity="0.95" d="M330,292 C350,214 416,170 512,170 C608,170 674,214 694,292"/>
${star({ x: 338, y: 268, r: 17, fill: p.gold })}
${star({ x: 404, y: 216, r: 14, fill: p.gold })}
${star({ x: 512, y: 192, r: 20, fill: p.gold })}
${star({ x: 620, y: 216, r: 14, fill: p.gold })}
${star({ x: 686, y: 268, r: 17, fill: p.gold })}
${star({ x: 512, y: 192, r: 8, fill: "#FFFFFF", opacity: 0.9 })}
${star({ x: 742, y: 210, r: 12, fill: p.accent, rot: 20, opacity: 0.9 })}
${star({ x: 760, y: 250, r: 8, fill: p.accent, rot: -15, opacity: 0.8 })}`);

  add("objects", `
${star({ x: 792, y: 132, r: 22, fill: p.gold, rot: 12, opacity: 0.95 })}
${star({ x: 846, y: 196, r: 13, fill: "#FFFFFF", rot: -20, opacity: 0.85 })}
${star({ x: 754, y: 206, r: 10, fill: p.accent, rot: 30, opacity: 0.9 })}`);

  return { defs: defs(p.iris), layers: L };
}
