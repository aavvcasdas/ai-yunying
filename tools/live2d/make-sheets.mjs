#!/usr/bin/env node
/* 出预览图：
   out/<id>/sheet.png     每个角色 4 状态拼图（idle / 转头 / 眨眼张嘴 / 说话摆尾）
   out/lineup.png         四个角色定妆排列（带名字）
   依赖 web/rig.mjs，与网页预览共用同一份骨架逻辑。
*/
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { drawScene, roleOf, S } from "./web/rig.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "out");
const chars = JSON.parse(fs.readFileSync(path.join(OUT, "chars.json"), "utf8"));

const STATES = [
  { label: "idle", st: { ax: 0, ay: 0, az: 0, bx: 0, blink: 1, mo: 0, breath: 0, sway: 0 } },
  { label: "turn -22", st: { ax: -22, ay: 10, az: -12, bx: -4, blink: 1, mo: 0, breath: 0.6, sway: 0.8 } },
  { label: "blink + mouth", st: { ax: 6, ay: -4, az: 4, bx: 2, blink: 0, mo: 1, breath: -0.5, sway: -0.6 } },
  { label: "talk + sway", st: { ax: 14, ay: 6, az: 9, bx: 6, blink: 0.75, mo: 0.55, breath: 0.8, sway: 1, sway2: 0.4, talk: 0.55 } },
];

const TH = 620;                 // 每格尺寸
const loadParts = async (id) => {
  const m = JSON.parse(fs.readFileSync(path.join(OUT, id, "manifest.json"), "utf8"));
  const parts = [];
  for (const p of m.parts) {
    parts.push({ ...p, img: await loadImage(path.join(OUT, id, p.file)), role: roleOf(p.name) });
  }
  return parts;
};

const renderState = (parts, st, size = TH) => {
  const c = createCanvas(S, S);
  const ctx = c.getContext("2d");
  drawScene(ctx, parts, st);
  const out = createCanvas(size, size);
  out.getContext("2d").drawImage(c, 0, 0, size, size);
  return out;
};

const bg = (ctx, w, h, color = "#0b1020") => { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); };

// ── 每个角色一张 4 宫格
for (const ch of chars) {
  const parts = await loadParts(ch.id);
  const sheet = createCanvas(TH * 2, TH * 2);
  const ctx = sheet.getContext("2d");
  bg(ctx, sheet.width, sheet.height);
  STATES.forEach((s, i) => {
    const cell = renderState(parts, s.st);
    const x = (i % 2) * TH, y = Math.floor(i / 2) * TH;
    ctx.drawImage(cell, x, y);
    ctx.fillStyle = "rgba(11,16,32,.72)";
    ctx.fillRect(x + 10, y + 10, 168, 30);
    ctx.fillStyle = "#9fd0ff";
    ctx.font = "19px sans-serif";
    ctx.fillText(s.label, x + 18, y + 32);
  });
  fs.writeFileSync(path.join(OUT, ch.id, "sheet.png"), sheet.toBuffer("image/png"));
  console.log(`  ✓ ${ch.id}/sheet.png`);
}

// ── 四角色定妆排列
const CW = 540, CH = 780;
const lineup = createCanvas(CW * chars.length, CH);
const lctx = lineup.getContext("2d");
const grad = lctx.createLinearGradient(0, 0, 0, CH);
grad.addColorStop(0, "#141c33");
grad.addColorStop(1, "#0a0f1d");
lctx.fillStyle = grad;
lctx.fillRect(0, 0, lineup.width, lineup.height);

for (let i = 0; i < chars.length; i++) {
  const ch = chars[i];
  const parts = await loadParts(ch.id);
  const cell = CH - 96;
  const img = renderState(parts, STATES[0].st, cell);
  const x = i * CW;
  const zoom = 1.05;
  const dw = cell * zoom, dh = cell * zoom;
  lctx.drawImage(img, x + (CW - dw) / 2, 8 - cell * (zoom - 1) * 0.1, dw, dh);
  // 名字条
  const pal = ch.palette;
  lctx.fillStyle = pal[0];
  lctx.fillRect(x + 46, CH - 92, 74, 5);
  lctx.fillStyle = "#eef3ff";
  lctx.font = "bold 30px sans-serif";
  lctx.fillText(ch.nameAscii || ch.name, x + 46, CH - 44);
  lctx.fillStyle = "#8fa3c9";
  lctx.font = "19px sans-serif";
  lctx.fillText(ch.themeAscii || ch.theme, x + 46, CH - 16);
  if (i > 0) {
    lctx.strokeStyle = "rgba(120,150,200,.16)";
    lctx.lineWidth = 2;
    lctx.beginPath(); lctx.moveTo(x, 40); lctx.lineTo(x, CH - 40); lctx.stroke();
  }
}
fs.writeFileSync(path.join(OUT, "lineup.png"), lineup.toBuffer("image/png"));
console.log("  ✓ lineup.png");
