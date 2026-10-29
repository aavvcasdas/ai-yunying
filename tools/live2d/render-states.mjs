#!/usr/bin/env node
/* 用与网页预览完全相同的 rig.mjs，把几个典型状态离线渲染成图，用于验收：
   node render-states.mjs  → out/states/*.png
*/
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { drawScene, roleOf, S } from "./web/rig.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "out");
const DIR = path.join(OUT, "states");
fs.mkdirSync(DIR, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
const parts = [];
for (const p of manifest.parts) {
  const img = await loadImage(path.join(OUT, p.file));
  parts.push({ ...p, img, role: roleOf(p.name) });
}

const STATES = [
  { file: "01_idle.png", label: "idle", st: { ax: 0, ay: 0, az: 0, bx: 0, blink: 1, mo: 0, breath: 0, sway: 0 } },
  { file: "02_turn_left.png", label: "turn -22", st: { ax: -22, ay: 10, az: -12, bx: -4, blink: 1, mo: 0, breath: 0.6, sway: 0.8 } },
  { file: "03_blink_mouth.png", label: "blink + mouth", st: { ax: 6, ay: -4, az: 4, bx: 2, blink: 0, mo: 1, breath: -0.5, sway: -0.6 } },
  { file: "04_talk_sway.png", label: "talk + sway", st: { ax: 14, ay: 6, az: 9, bx: 6, blink: 0.75, mo: 0.55, breath: 0.8, sway: 1, sway2: 0.4, talk: 0.55 } },
  { file: "05_eye_half.png", label: "half eye", st: { ax: -8, ay: -12, az: -6, bx: -2, blink: 0.4, mo: 0.2, breath: 0.3, sway: 0.5 } },
];

for (const s of STATES) {
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");
  drawScene(ctx, parts, s.st);
  fs.writeFileSync(path.join(DIR, s.file), canvas.toBuffer("image/png"));
  console.log(`  ✓ ${s.file}  ${s.label}`);
}

// 拼一张对比图（两行：上排 3 张，下排 2 张）
const TH = 512;
const cols = 3, rows = 2;
const sheet = createCanvas(TH * cols, TH * rows);
const sctx = sheet.getContext("2d");
sctx.fillStyle = "#0b1020";
sctx.fillRect(0, 0, sheet.width, sheet.height);
for (let i = 0; i < STATES.length; i++) {
  const img = await loadImage(path.join(DIR, STATES[i].file));
  const x = (i % cols) * TH, y = Math.floor(i / cols) * TH;
  sctx.drawImage(img, x, y, TH, TH);
  sctx.fillStyle = "rgba(11,16,32,.72)";
  sctx.fillRect(x + 8, y + 8, 150, 26);
  sctx.fillStyle = "#9fd0ff";
  sctx.font = "16px sans-serif";
  sctx.fillText(STATES[i].label, x + 14, y + 26);
}
fs.writeFileSync(path.join(OUT, "states_sheet.png"), sheet.toBuffer("image/png"));
console.log("  ✓ states_sheet.png（对比图）");
