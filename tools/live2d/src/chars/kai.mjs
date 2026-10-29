/* 凯 Kai ·「赤潮机甲」
   原创角色：墨绿黑短发 + 机械鳍状耳 + 红色目镜/耳机 + 立领机能外套 + 荧光电路线。 */
import { face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose, defs, bangs, sideLock } from "../lib.mjs";

const p = {
  hair: "#22303C", hairMid: "#2C3D4B", hairDark: "#161F27", hairLight: "#485F71",
  skin: "#FFE7DC", shade: "#F6C4B4",
  iris: ["#FFEBB0", "#F2A33F", "#7A3B12"],
  coat: "#1C242E", coatDark: "#111721", coatLight: "#2E3B49",
  red: "#E03C46", redDark: "#A2242D",
  cyan: "#5FE8E0",
  metal: "#8A98A8",
};

export const meta = {
  nameAscii: "Kai", themeAscii: "Crimson Mech",
  id: "kai",
  name: "凯 Kai",
  theme: "赤潮机甲",
  desc: "墨绿黑短发 + 机械鳍耳 + 红色目镜耳机 + 立领机能外套，荧光电路；酷帅型。",
  palette: ["#22303C", "#1C242E", "#E03C46", "#5FE8E0"],
};

export function render() {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  add("back hair", `
<path fill="${p.hairMid}" d="M512,134 C674,134 784,248 786,436 C788,520 782,572 772,610 L736,566 L714,616 L512,632 L310,616 L288,566 L252,610 C242,572 236,520 238,436 C240,248 350,134 512,134 Z"/>
<path fill="${p.hairDark}" opacity="0.45" d="M512,344 C600,344 660,406 668,490 C676,552 662,600 654,632 L512,632 L370,632 C362,600 348,552 356,490 C364,406 424,344 512,344 Z"/>`);

  add("tail", `
<path fill="${p.coatLight}" d="M690,900 C770,884 852,908 890,952 C900,966 892,978 876,974 C840,944 780,932 722,944 Z"/>
<path fill="${p.red}" opacity="0.85" d="M700,914 C760,900 812,910 848,938 C806,924 754,922 712,936 Z"/>
<path fill="${p.coatLight}" d="M868,932 C892,912 918,910 936,922 C926,940 906,952 884,954 Z"/>`);

  add("neck", `<path fill="${p.shade}" d="M482,546 L542,546 L548,648 L476,648 Z"/>`);

  add("topwear", `
<path fill="${p.coat}" d="M512,602 C576,602 634,630 678,674 C728,726 756,800 762,890 L768,1024 L256,1024 L262,890 C268,800 296,726 346,674 C390,630 448,602 512,602 Z"/>
<path fill="${p.coatDark}" d="M512,602 C566,602 616,620 656,648 C616,672 566,686 512,686 C458,686 408,672 368,648 C408,620 458,602 512,602 Z"/>
<path fill="${p.coatLight}" d="M512,650 C486,650 462,656 440,668 L418,712 L512,700 L606,712 L584,668 C562,656 538,650 512,650 Z"/>
<path fill="${p.coatDark}" d="M512,700 C522,700 530,708 530,718 L530,1024 L494,1024 L494,718 C494,708 502,700 512,700 Z"/>
<path fill="${p.red}" d="M418,712 L452,930 L470,930 L448,708 Z" opacity="0.9"/>
<path fill="${p.red}" d="M606,712 L572,930 L554,930 L576,708 Z" opacity="0.9"/>
<path fill="none" stroke="${p.cyan}" stroke-width="5" opacity="0.85" d="M300,844 C332,828 366,824 392,832"/>
<path fill="none" stroke="${p.cyan}" stroke-width="5" opacity="0.85" d="M724,844 C692,828 658,824 632,832"/>
<path fill="none" stroke="${p.cyan}" stroke-width="4" opacity="0.5" d="M276,944 C312,928 350,924 382,932"/>
<path fill="none" stroke="${p.cyan}" stroke-width="4" opacity="0.5" d="M748,944 C712,928 674,924 642,932"/>
<path fill="${p.metal}" d="M300,764 C296,816 294,880 296,930 L330,930 C326,878 328,816 336,768 Z"/>`);

  add("handwear-l", `
<path fill="${p.coatDark}" d="M294,690 C262,758 248,862 252,966 C256,998 286,1010 312,1000 C334,992 340,970 336,946 C326,852 328,762 344,704 Z"/>
<path fill="${p.metal}" d="M282,908 C302,898 330,898 342,908 C344,928 342,950 338,966 C314,974 288,966 284,946 C282,932 282,918 282,908 Z"/>
<path fill="none" stroke="${p.cyan}" stroke-width="3.5" opacity="0.8" d="M292,926 C310,918 330,918 340,926"/>`);

  add("handwear-r", `
<path fill="${p.coatDark}" d="M730,690 C762,758 776,862 772,966 C768,998 738,1010 712,1000 C690,992 684,970 688,946 C698,852 696,762 680,704 Z"/>
<path fill="${p.metal}" d="M742,908 C722,898 694,898 682,908 C680,928 682,950 686,966 C710,974 736,966 740,946 C742,932 742,918 742,908 Z"/>
<path fill="none" stroke="${p.cyan}" stroke-width="3.5" opacity="0.8" d="M732,926 C714,918 694,918 684,926"/>`);

  add("neckwear", `
<path fill="${p.coatLight}" d="M452,632 C472,620 552,620 572,632 C566,676 542,700 512,700 C482,700 458,676 452,632 Z"/>
<path fill="${p.coatDark}" d="M452,632 C472,620 552,620 572,632 L566,648 C542,636 482,636 458,648 Z"/>
<path fill="${p.red}" d="M512,696 C504,680 494,672 484,668 C486,684 494,698 506,706 Z"/>
<path fill="${p.red}" d="M512,696 C520,680 530,672 540,668 C538,684 530,698 518,706 Z"/>
<circle cx="512" cy="700" r="6" fill="${p.cyan}"/>`);

  add("face", face({ skin: p.skin, shade: p.shade, rx: 184, ry: 198 }));

  add("facedetail", `
${blush({ x: 372, y: 500, color: "#E8888F", opacity: 0.3, stripes: false })}
${blush({ x: 652, y: 500, color: "#E8888F", opacity: 0.3, stripes: false })}
${nose({ y: 500, color: "#E3A196", opacity: 0.55 })}
<path fill="none" stroke="${p.metal}" stroke-width="3" opacity="0.55" d="M640,392 L664,384"/>`);

  add("eyewhite-l", eyeWhite({ x: 438, y: 438, rx: 48, ry: 50 }));
  add("eyewhite-r", eyeWhite({ x: 586, y: 438, rx: 48, ry: 50 }));
  add("irides-l", iris({ x: 438, y: 440, r: 36, pupil: "#241A10", spark: 0.9 }));
  add("irides-r", iris({ x: 586, y: 440, r: 36, pupil: "#241A10", spark: 0.9 }));
  add("eyelash-l", lash({ x: 438, y: 434, rx: 49, color: "#121A22", w: 10, style: "sharp", side: "l" }));
  add("eyelash-r", lash({ x: 586, y: 434, rx: 49, color: "#121A22", w: 10, style: "sharp", side: "r" }));
  add("eye close-l", closedEye({ x: 438, y: 438, rx: 43, color: "#121A22", w: 7 }));
  add("eye close-r", closedEye({ x: 586, y: 438, rx: 43, color: "#121A22", w: 7 }));
  add("eyebrow-l", brow({ x: 438, y: 360, rx: 38, color: "#121A22", w: 10, angle: 10, side: "l" }));
  add("eyebrow-r", brow({ x: 586, y: 360, rx: 38, color: "#121A22", w: 10, angle: 10, side: "r" }));

  add("mouth close", `<path fill="none" stroke="#B4676E" stroke-width="6" stroke-linecap="round" d="M492,524 L532,522"/>`);
  add("mouth open", mouthOpen({ y: 516, inner: "#933E4A", tongue: "#DE808E", fang: true }));

  add("front hair", bangs({ hair: p.hair, light: p.hairLight, tipY: 348, valleyY: 292, spikes: 6, shine: 0.42 }));

  add("front hair 2", sideLock({ x: 344, dir: -1, bottom: 760, w: 50, hair: p.hair, light: p.hairLight, shine: 0.16 }) +
    sideLock({ x: 680, dir: 1, bottom: 760, w: 50, hair: p.hair, light: p.hairLight, shine: 0.16 }) +
    `<path fill="${p.hair}" d="M626,182 C622,142 642,114 672,106 C694,100 708,112 702,126 C694,114 682,110 670,116 C650,126 644,152 648,184 Z"/>`);

  add("ear-l", `
<path fill="${p.metal}" d="M338,452 C304,430 262,436 236,470 C228,496 252,520 292,516 C314,512 332,494 342,474 Z"/>
<path fill="${p.coatLight}" d="M330,462 C302,446 272,450 252,474 C258,492 280,504 304,498 C320,494 330,482 334,474 Z"/>
<path fill="${p.red}" d="M252,470 C246,458 248,446 256,438 C264,450 266,462 262,474 Z"/>
<path fill="none" stroke="${p.cyan}" stroke-width="3" opacity="0.8" d="M268,470 C288,462 306,464 322,472"/>`);

  add("ear-r", `
<path fill="${p.metal}" d="M686,452 C720,430 762,436 788,470 C796,496 772,520 732,516 C710,512 692,494 682,474 Z"/>
<path fill="${p.coatLight}" d="M694,462 C722,446 752,450 772,474 C766,492 744,504 720,498 C704,494 694,482 690,474 Z"/>
<path fill="${p.red}" d="M772,470 C778,458 776,446 768,438 C760,450 758,462 762,474 Z"/>
<path fill="none" stroke="${p.cyan}" stroke-width="3" opacity="0.8" d="M756,470 C736,462 718,464 702,472"/>`);

  add("headwear", `
<path fill="${p.red}" d="M300,330 C312,236 396,186 512,186 C628,186 712,236 724,330 C700,318 668,312 640,310 L640,282 C612,268 412,268 384,282 L384,310 C356,312 324,318 300,330 Z"/>
<path fill="${p.redDark}" opacity="0.5" d="M320,318 C332,250 396,208 470,200 C400,216 348,258 332,320 Z"/>
<path fill="${p.metal}" d="M414,268 L610,268 L610,306 L414,306 Z"/>
<path fill="${p.cyan}" opacity="0.9" d="M424,282 L600,282 L600,292 L424,292 Z"/>
<circle cx="452" cy="286" r="0" fill="none"/>
<path fill="${p.coatLight}" d="M350,314 C322,332 304,372 300,414 C316,422 334,412 342,390 C350,362 352,336 350,314 Z"/>
<path fill="${p.coatLight}" d="M674,314 C702,332 720,372 724,414 C708,422 690,412 682,390 C674,362 672,336 674,314 Z"/>
<circle cx="702" cy="386" r="15" fill="${p.metal}"/><circle cx="702" cy="386" r="7" fill="${p.red}"/>
<path fill="none" stroke="${p.cyan}" stroke-width="3" opacity="0.65" d="M668,462 C696,478 726,482 752,478"/>`);

  add("objects", `
<path fill="none" stroke="${p.cyan}" stroke-width="3" opacity="0.55" d="M786,214 L846,214 M786,214 L786,274 M816,244 L846,274"/>
<circle cx="846" cy="214" r="4" fill="${p.cyan}"/><circle cx="846" cy="274" r="4" fill="${p.cyan}"/>
<circle cx="786" cy="274" r="4" fill="${p.cyan}"/>
<path fill="${p.red}" opacity="0.8" d="M806,300 L824,300 L818,318 L800,318 Z"/>`);

  return { defs: defs(p.iris), layers: L };
}
