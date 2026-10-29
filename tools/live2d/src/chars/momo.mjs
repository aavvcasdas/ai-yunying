/* 桃桃 Momo ·「甜梦草莓」
   原创角色：粉色双马尾 + 熊猫帽 + 草莓发卡 + 荷叶边连衣裙，永远的困倦脸。 */
import { face, eyeWhite, iris, lash, closedEye, brow, mouthClose, mouthOpen, blush, nose, defs, bangs, sideLock, star } from "../lib.mjs";

const p = {
  hair: "#F7C0D6", hairMid: "#EFA9C4", hairDark: "#D487A6", hairLight: "#FFE6F1",
  skin: "#FFEFE9", shade: "#FBD5CC",
  iris: ["#FFE7A8", "#F2A63F", "#8E5116"],
  cloth: "#F3A8C4", clothDark: "#DE86A8", clothLight: "#FFD4E4",
  white: "#FFFAFC", cream: "#FFF6E4",
  panda: "#3C3550", pandaLight: "#59507A",
  berry: "#E8556E", leaf: "#6FBF73",
};

export const meta = {
  nameAscii: "Momo", themeAscii: "Sweet Berry",
  id: "momo",
  name: "桃桃 Momo",
  theme: "甜梦草莓",
  desc: "粉色双马尾 + 熊猫连帽 + 草莓发卡 + 荷叶边连衣裙，半困眼；软萌型。",
  palette: ["#F7C0D6", "#F3A8C4", "#E8556E", "#3C3550"],
};

export function render() {
  const L = [];
  const add = (name, body) => L.push({ name, body });

  add("back hair", `
<path fill="${p.hairMid}" d="M512,128 C676,128 786,244 788,432 C790,548 780,628 766,684 L512,712 L258,684 C244,628 234,548 236,432 C238,244 348,128 512,128 Z"/>
<path fill="${p.hairDark}" opacity="0.32" d="M512,336 C600,336 660,398 668,482 C674,552 660,624 650,684 L512,712 L374,684 C364,624 350,552 356,482 C364,398 424,336 512,336 Z"/>`);

  add("tail", `
<path fill="${p.hair}" d="M236,420 C186,472 162,576 178,676 C188,740 220,782 252,794 C270,798 280,782 272,764 C240,714 226,620 240,520 C246,470 248,438 236,420 Z"/>
<path fill="${p.hair}" d="M788,420 C838,472 862,576 846,676 C836,740 804,782 772,794 C754,798 744,782 752,764 C784,714 798,620 784,520 C778,470 776,438 788,420 Z"/>
<path fill="${p.hairLight}" opacity="0.45" d="M244,470 C212,540 204,624 216,700 C224,726 236,744 246,752 C232,712 226,626 240,540 C244,506 246,484 244,470 Z"/>
<path fill="${p.hairLight}" opacity="0.45" d="M780,470 C812,540 820,624 808,700 C800,726 788,744 778,752 C792,712 798,626 784,540 C780,506 778,484 780,470 Z"/>`);

  add("neck", `<path fill="${p.shade}" d="M482,548 L542,548 L548,650 L476,650 Z"/>`);

  add("topwear", `
<path fill="${p.cloth}" d="M512,606 C572,606 626,632 668,672 C716,720 744,792 750,884 L756,1024 L268,1024 L274,884 C280,792 308,720 356,672 C398,632 452,606 512,606 Z"/>
<path fill="${p.clothLight}" d="M512,624 C486,624 462,630 442,640 C470,660 488,668 512,668 C536,668 554,660 582,640 C562,630 538,624 512,624 Z"/>
<path fill="${p.white}" d="M452,690 C476,682 548,682 572,690 L586,1024 L438,1024 Z"/>
<path fill="${p.cream}" d="M452,786 C470,798 554,798 572,786 C576,796 576,806 572,812 C548,822 476,822 452,812 C448,806 448,796 452,786 Z"/>
<path fill="${p.cream}" d="M446,884 C468,896 556,896 578,884 C582,894 582,904 578,910 C552,920 472,920 446,910 C442,904 442,894 446,884 Z"/>
<path fill="${p.clothDark}" d="M276,900 C300,884 340,884 366,900 C356,940 330,964 296,966 C284,946 276,922 276,900 Z"/>
<path fill="${p.clothDark}" d="M748,900 C724,884 684,884 658,900 C668,940 694,964 728,966 C740,946 748,922 748,900 Z"/>`);

  add("handwear-l", `
<path fill="${p.clothDark}" d="M302,700 C272,764 258,862 262,962 C266,992 292,1004 316,994 C336,986 342,966 338,944 C328,856 330,772 346,714 Z"/>
<path fill="${p.clothLight}" d="M306,712 C286,768 276,858 280,944 C284,960 294,966 302,962 C296,866 298,776 312,726 Z"/>`);

  add("handwear-r", `
<path fill="${p.clothDark}" d="M722,700 C752,764 766,862 762,962 C758,992 732,1004 708,994 C688,986 682,966 686,944 C696,856 694,772 678,714 Z"/>
<path fill="${p.clothLight}" d="M718,712 C738,768 748,858 744,944 C740,960 730,966 722,962 C728,866 726,776 712,726 Z"/>`);

  add("neckwear", `
${star({ x: 512, y: 664, r: 20, fill: p.berry })}
<circle cx="512" cy="664" r="7" fill="#FFF0B8"/>
<path fill="${p.leaf}" d="M500,644 C506,632 518,632 524,644 C516,650 508,650 500,644 Z"/>`);

  add("face", face({ skin: p.skin, shade: p.shade, rx: 196, ry: 198 }));

  add("facedetail", `
${blush({ x: 358, y: 496, color: "#F79FB4", opacity: 0.55, rx: 40, ry: 20 })}
${blush({ x: 666, y: 496, color: "#F79FB4", opacity: 0.55, rx: 40, ry: 20 })}
${nose({ y: 500, color: "#F2BCB4", opacity: 0.6 })}`);

  add("eyewhite-l", eyeWhite({ x: 436, y: 440, rx: 48, ry: 52 }));
  add("eyewhite-r", eyeWhite({ x: 588, y: 440, rx: 48, ry: 52 }));
  add("irides-l", iris({ x: 436, y: 444, r: 37, spark: 1.15 }));
  add("irides-r", iris({ x: 588, y: 444, r: 37, spark: 1.15 }));
  add("eyelash-l", lash({ x: 436, y: 436, rx: 49, color: "#6B4A5A", w: 11, style: "droop", side: "l" }));
  add("eyelash-r", lash({ x: 588, y: 436, rx: 49, color: "#6B4A5A", w: 11, style: "droop", side: "r" }));
  add("eye close-l", closedEye({ x: 436, y: 440, rx: 44, color: "#6B4A5A", w: 7 }));
  add("eye close-r", closedEye({ x: 588, y: 440, rx: 44, color: "#6B4A5A", w: 7 }));
  add("eyebrow-l", brow({ x: 436, y: 366, rx: 34, color: p.hairDark, w: 8, angle: 4, side: "l" }));
  add("eyebrow-r", brow({ x: 588, y: 366, rx: 34, color: p.hairDark, w: 8, angle: 4, side: "r" }));

  add("mouth close", mouthClose({ y: 528, color: "#D97F92", w: 6, curve: 8 }));
  add("mouth open", mouthOpen({ y: 520, inner: "#B05766", tongue: "#F2A0AE" }));

  add("front hair", bangs({ hair: p.hair, light: p.hairLight, tipY: 350, valleyY: 294, spikes: 5, shine: 0.5 }));

  add("front hair 2", sideLock({ x: 356, dir: -1, bottom: 670, w: 60, hair: p.hair, light: p.hairLight, shine: 0.22 }) +
    sideLock({ x: 668, dir: 1, bottom: 670, w: 60, hair: p.hair, light: p.hairLight, shine: 0.22 }) +
    `<path fill="${p.hair}" d="M636,186 C632,148 650,124 678,116 C698,110 712,122 706,136 C698,124 686,120 674,126 C656,136 652,160 656,190 Z"/>`);

  add("headwear", `
<path fill="${p.panda}" d="M512,140 C650,140 748,232 756,368 C700,330 612,310 512,310 C412,310 324,330 268,368 C276,232 374,140 512,140 Z"/>
<path fill="${p.pandaLight}" opacity="0.45" d="M360,232 C400,182 452,158 512,156 C572,158 624,182 664,232 C614,196 566,182 512,182 C458,182 410,196 360,232 Z"/>
<circle cx="322" cy="204" r="52" fill="${p.panda}"/>
<circle cx="322" cy="204" r="30" fill="${p.pandaLight}"/>
<circle cx="702" cy="204" r="52" fill="${p.panda}"/>
<circle cx="702" cy="204" r="30" fill="${p.pandaLight}"/>
<path fill="${p.white}" d="M276,336 C332,306 414,290 512,290 C610,290 692,306 748,336 C744,352 738,364 730,374 C688,352 614,338 512,338 C410,338 336,352 294,374 C286,364 280,352 276,336 Z"/>
${star({ x: 428, y: 198, r: 13, fill: "#FFE7A8", rot: 14 })}
${star({ x: 596, y: 186, r: 10, fill: "#FFE7A8", rot: -20 })}`);

  add("objects", `
<path fill="${p.berry}" d="M246,616 C282,616 304,640 304,670 C304,708 274,740 246,750 C218,740 188,708 188,670 C188,640 210,616 246,616 Z"/>
<path fill="#FF9BAE" opacity="0.7" d="M208,658 C218,640 238,630 254,632 C232,640 218,654 212,674 Z"/>
<g fill="#FFF3C4">
  <circle cx="230" cy="658" r="3"/><circle cx="250" cy="650" r="3"/><circle cx="264" cy="674" r="3"/>
  <circle cx="234" cy="692" r="3"/><circle cx="258" cy="706" r="3"/><circle cx="278" cy="688" r="3"/>
</g>
<path fill="${p.leaf}" d="M238,618 C246,598 264,590 278,594 C272,612 256,622 242,622 Z"/>
<path fill="${p.leaf}" d="M246,616 C238,596 220,588 206,592 C212,610 228,620 242,620 Z"/>`);

  return { defs: defs(p.iris), layers: L };
}
