/* 妮莉 Nelly ·「兔兔海军」
   原创角色：奶油金短发 + 一对长兔耳 + 海军蓝贝雷帽 + 红领结 + 水手服。 */
import { face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose, defs, bangs, sideLock } from "../lib.mjs";

const p = {
  hair: "#EFD9A3", hairMid: "#E3C784", hairDark: "#C9A961", hairLight: "#FFF3D0",
  skin: "#FFEDE4", shade: "#F9D3C6",
  iris: ["#FFC9C9", "#E8656F", "#8C2432"],
  cloth: "#27355F", clothDark: "#18213C", clothLight: "#3D5088",
  red: "#E4555F", redDark: "#B93A46",
  white: "#FAFCFF",
};

export const meta = {
  nameAscii: "Nelly", themeAscii: "Bunny Navy",
  id: "nelly",
  name: "妮莉 Nelly",
  theme: "兔兔海军",
  desc: "奶油金短发 + 长兔耳 + 海军贝雷帽 + 红领结水手服，脸上有雀斑；活泼型。",
  palette: ["#EFD9A3", "#27355F", "#E4555F", "#FAFCFF"],
};

export function render() {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  add("back hair", `
<path fill="${p.hairMid}" d="M512,132 C672,132 782,246 784,430 C786,540 776,614 762,668 L724,616 L700,676 L512,700 L324,676 L300,616 L262,668 C248,614 238,540 240,430 C242,246 352,132 512,132 Z"/>
<path fill="${p.hairDark}" opacity="0.35" d="M512,340 C596,340 654,400 662,480 C668,548 654,614 644,668 L512,700 L380,668 C370,614 356,548 362,480 C370,400 428,340 512,340 Z"/>`);

  add("ear-l", `
<path fill="${p.hair}" d="M420,196 C404,118 414,58 448,34 C470,20 486,32 486,56 C486,96 476,150 466,204 Z"/>
<path fill="#F7B9BE" d="M436,176 C424,116 432,72 452,52 C462,44 470,50 470,64 C470,98 462,140 454,180 Z"/>`);

  add("ear-r", `
<path fill="${p.hair}" d="M604,196 C628,124 660,76 692,62 C712,54 722,68 714,88 C700,124 672,164 646,204 Z"/>
<path fill="#F7B9BE" d="M620,180 C640,124 664,88 686,76 C696,70 702,78 696,90 C680,120 658,152 638,184 Z"/>
<path fill="${p.hairDark}" opacity="0.25" d="M640,196 C664,140 690,104 710,92 C698,116 676,158 656,200 Z"/>`);

  add("neck", `<path fill="${p.shade}" d="M482,548 L542,548 L548,650 L476,650 Z"/>`);

  add("topwear", `
<path fill="${p.cloth}" d="M512,606 C572,606 626,634 668,676 C716,724 744,796 750,884 L756,1024 L268,1024 L274,884 C280,796 308,724 356,676 C398,634 452,606 512,606 Z"/>
<path fill="${p.white}" d="M512,626 C468,626 426,638 388,660 L344,742 L470,782 L512,700 L554,782 L680,742 L636,660 C598,638 556,626 512,626 Z"/>
<path fill="${p.clothLight}" d="M512,644 C474,644 440,652 408,670 L378,728 L470,758 L512,686 L554,758 L646,728 L616,670 C584,652 550,644 512,644 Z"/>
<path fill="${p.white}" opacity="0.92" d="M470,782 L554,782 L548,1024 L476,1024 Z"/>
<path fill="${p.red}" d="M480,700 L544,700 L544,712 L480,712 Z"/>
<path fill="${p.red}" d="M480,860 L544,860 L544,872 L480,872 Z"/>
<path fill="${p.clothLight}" d="M328,766 C318,836 316,934 320,1024 L388,1024 C380,922 382,838 392,782 Z"/>
<path fill="${p.clothLight}" d="M696,766 C706,836 708,934 704,1024 L636,1024 C644,922 642,838 632,782 Z"/>`);

  add("handwear-l", `
<path fill="${p.white}" d="M296,700 C264,766 250,868 254,970 C258,1002 288,1014 314,1004 C336,996 342,972 338,948 C328,856 330,768 346,712 Z"/>
<path fill="${p.clothLight}" d="M292,946 C310,938 336,938 344,946 C346,968 344,992 340,1006 C316,1012 292,1006 288,986 C286,970 288,956 292,946 Z"/>`);

  add("handwear-r", `
<path fill="${p.white}" d="M728,700 C760,766 774,868 770,970 C766,1002 736,1014 710,1004 C688,996 682,972 686,948 C696,856 694,768 678,712 Z"/>
<path fill="${p.clothLight}" d="M732,946 C714,938 688,938 680,946 C678,968 680,992 684,1006 C708,1012 732,1006 736,986 C738,970 736,956 732,946 Z"/>`);

  add("neckwear", `
<path fill="#FFFFFF" d="M512,640 C486,640 462,646 444,656 C466,678 490,690 512,690 C534,690 558,678 580,656 C562,646 538,640 512,640 Z"/>
<path fill="${p.red}" d="M512,686 C500,676 486,672 474,674 C476,690 484,700 496,704 Z"/>
<path fill="${p.red}" d="M512,686 C524,676 538,672 550,674 C548,690 540,700 528,704 Z"/>
<circle cx="512" cy="690" r="8" fill="${p.redDark}"/>`);

  add("face", face({ skin: p.skin, shade: p.shade, rx: 192, ry: 204 }));

  add("facedetail", `
${blush({ x: 366, y: 492, color: "#F7A9B0", opacity: 0.4 })}
${blush({ x: 658, y: 492, color: "#F7A9B0", opacity: 0.4 })}
<g fill="#D9A377" opacity="0.55">
  <circle cx="352" cy="474" r="2.6"/><circle cx="366" cy="466" r="2.2"/><circle cx="378" cy="478" r="2.4"/>
  <circle cx="646" cy="474" r="2.6"/><circle cx="660" cy="466" r="2.2"/><circle cx="672" cy="478" r="2.4"/>
</g>
${nose({ y: 496, color: "#F2BCB4", opacity: 0.62 })}`);

  add("eyewhite-l", eyeWhite({ x: 438, y: 434 }));
  add("eyewhite-r", eyeWhite({ x: 586, y: 434 }));
  add("irides-l", iris({ x: 438, y: 436, r: 38 }));
  add("irides-r", iris({ x: 586, y: 436, r: 38 }));
  add("eyelash-l", lash({ x: 438, y: 432, rx: 50, color: "#4A3030", w: 10, style: "long", side: "l" }));
  add("eyelash-r", lash({ x: 586, y: 432, rx: 50, color: "#4A3030", w: 10, style: "long", side: "r" }));
  add("eye close-l", closedEye({ x: 438, y: 434, rx: 44, color: "#4A3030", w: 7 }));
  add("eye close-r", closedEye({ x: 586, y: 434, rx: 44, color: "#4A3030", w: 7 }));
  add("eyebrow-l", brow({ x: 438, y: 356, rx: 36, color: p.hairDark, w: 8, angle: -8, side: "l" }));
  add("eyebrow-r", brow({ x: 586, y: 356, rx: 36, color: p.hairDark, w: 8, angle: -8, side: "r" }));

  add("mouth close", mouthClose({ y: 522, color: "#C4727E", w: 6, curve: 9 }));
  add("mouth open", mouthOpen({ y: 514, fang: true }));

  add("front hair", bangs({ hair: p.hair, light: p.hairLight, tipY: 344, valleyY: 288, spikes: 6, shine: 0.5 }));

  add("front hair 2", sideLock({ x: 352, dir: -1, bottom: 664, w: 62, hair: p.hair, light: p.hairLight, shine: 0.2 }) +
    sideLock({ x: 672, dir: 1, bottom: 664, w: 62, hair: p.hair, light: p.hairLight, shine: 0.2 }));

  add("headwear", `
<path fill="${p.cloth}" d="M334,296 C346,214 410,166 512,166 C614,166 678,214 690,296 C640,276 576,266 512,266 C448,266 384,276 334,296 Z"/>
<path fill="${p.clothLight}" opacity="0.55" d="M356,286 C372,226 420,190 486,182 C428,202 384,238 366,290 Z"/>
<circle cx="512" cy="170" r="17" fill="${p.red}"/>
<path fill="${p.red}" d="M568,240 C592,228 614,230 624,240 C610,252 586,256 570,250 Z"/>
<path fill="${p.redDark}" d="M572,248 C590,244 606,246 616,252 C602,258 586,256 574,252 Z"/>`);

  add("objects", `
<circle cx="712" cy="212" r="15" fill="${p.white}"/>
<path fill="none" stroke="${p.red}" stroke-width="4" d="M704,224 C688,254 676,286 672,318"/>
<circle cx="670" cy="326" r="8" fill="${p.red}"/>
<circle cx="700" cy="214" r="6" fill="${p.hairLight}" opacity="0.8"/>`);

  return { defs: defs(p.iris), layers: L };
}
