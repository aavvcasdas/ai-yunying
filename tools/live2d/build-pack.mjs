#!/usr/bin/env node
/**
 * 把现成的分层素材包（FAYER-0610/dafeiyu-vtuber · whale-maid）转成 Live2D 可用素材
 *
 *   assets/whale-maid/*.png + rig.json
 *     ─► out/dafeiyu/dafeiyu.psd     分层 PSD（图层名按 psd2live 语义，1024×1536 / RGB 8bit）
 *     ─► out/dafeiyu/preview.png     中立姿态定妆图
 *     ─► out/dafeiyu/sheet.png       4 状态验收图
 *     ─► out/dafeiyu/manifest.json   网页预览用（rig + 图片尺寸）
 *
 * 用法：node build-pack.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import sharp from "sharp";
import { writePsdBuffer } from "ag-psd";
import { createPack, createState, CANVAS, SEMANTIC } from "./src/pack.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "assets/whale-maid");
const OUT = path.join(HERE, "out/dafeiyu");
const ID = "dafeiyu";

fs.mkdirSync(OUT, { recursive: true });

const rig = JSON.parse(fs.readFileSync(path.join(SRC, "rig.json"), "utf8"));
const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png"));
const images = {};
for (const f of files) images[f] = await loadImage(fs.readFileSync(path.join(SRC, f)));

const pack = createPack(rig, images);
console.log(`素材：${files.length} 张 PNG · ${rig.parts.length} 个部件 · 画布 ${CANVAS.w}×${CANVAS.h}`);

/* ── 1. 定妆图 ─────────────────────────────── */
function renderState(patch) {
  const st = { ...createState(), ...patch };
  const cv = createCanvas(CANVAS.w, CANVAS.h);
  const ctx = cv.getContext("2d");
  // 先迭代几步物理，避免第一帧抖动
  for (let i = 0; i < 40; i++) pack.draw(ctx, st, 1 / 60);
  pack.draw(ctx, st, 1 / 60);
  return cv;
}

const neutral = renderState({});
fs.writeFileSync(path.join(OUT, "preview.png"), neutral.toBuffer("image/png"));

/* ── 2. 4 状态验收图 ───────────────────────── */
const STATES = [
  { label: "idle", st: {} },
  { label: "turn + blink", st: { yaw: -0.85, pitch: 0.25, roll: -0.055, blink: 0 } },
  { label: "talk + body sway", st: { yaw: 0.45, roll: 0.04, mouth: 0.95, bodyX: 0.35, bodyRoll: 0.04 } },
  { label: "half eye + shy", st: { mood: "shy", yaw: 0.35, roll: 0.03, blink: 0.45, blush: 1 } },
];

const CW = 620, CH = 900, PAD = 26, LBL = 34;
const sheet = createCanvas(CW * 2 + PAD * 3, (CH + LBL) * 2 + PAD * 3);
const sctx = sheet.getContext("2d");
sctx.fillStyle = "#101827";
sctx.fillRect(0, 0, sheet.width, sheet.height);
STATES.forEach((s, i) => {
  const cv = renderState(s.st);
  const x = PAD + (i % 2) * (CW + PAD);
  const y = PAD + Math.floor(i / 2) * (CH + LBL + PAD);
  sctx.fillStyle = "#9fb4d8";
  sctx.font = "26px sans-serif";
  sctx.fillText(s.label, x + 4, y + 26);
  sctx.drawImage(cv, x, y + LBL, CW, CH);
});
fs.writeFileSync(path.join(OUT, "sheet.png"), sheet.toBuffer("image/png"));

/* ── 3. 分层 PSD ───────────────────────────── */
/** 取某个部件该用哪张图（PSD 用中立姿态的那一张） */
function variantFile(id) {
  const p = rig.parts.find((q) => q.id === id);
  const base = p.image.replace(/\.png$/, "").split("-")[0];
  if (id === "eyelidLeft" || id === "eyelidRight") return `${base}-open.png`;
  if (id === "eyeWhiteLeft" || id === "eyeWhiteRight") return `${base}-open.png`;
  if (id === "browLeft" || id === "browRight") return `${base}-neutral.png`;
  if (id === "mouth") return "mouth-N.png";
  return p.image;
}

const psdLayers = [];
for (const p of [...rig.parts].sort((a, b) => a.z - b.z)) {
  const [left, top, w, h] = p.rect;
  const decode = async (file) => {
    const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, info };
  };

  if (p.id === "mouth") {
    const close = await decode("mouth-N.png");
    psdLayers.push({ name: "mouth close", left, top, imageData: { width: w, height: h, data: new Uint8ClampedArray(close.data) } });
    const open = await decode("mouth-A.png");
    psdLayers.push({ name: "mouth open", left, top, imageData: { width: w, height: h, data: new Uint8ClampedArray(open.data) } });
    continue;
  }

  const file = variantFile(p.id);
  const { data } = await decode(file);
  const name = SEMANTIC[p.id] || p.id;
  psdLayers.push({ name, left, top, imageData: { width: w, height: h, data: new Uint8ClampedArray(data) } });

  if (p.id === "eyelidLeft" || p.id === "eyelidRight") {
    const side = p.id.endsWith("Left") ? "l" : "r";
    const closed = await decode(`${p.image.replace(/\.png$/, "").split("-")[0]}-closed.png`);
    psdLayers.push({ name: `eye close-${side}`, left, top, imageData: { width: w, height: h, data: new Uint8ClampedArray(closed.data) } });
  }
}

const psd = writePsdBuffer(
  { width: CANVAS.w, height: CANVAS.h, children: psdLayers },
  { generateThumbnail: false }
);
fs.writeFileSync(path.join(OUT, `${ID}.psd`), psd);
console.log(`  ✓ ${ID}.psd  ${(psd.length / 1e6).toFixed(1)}MB  ${psdLayers.length} 层`);

/* ── 4. 网页清单 ───────────────────────────── */
fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify(
    {
      size: CANVAS,
      source: "FAYER-0610/dafeiyu-vtuber · overlay/avatar/packs/whale-maid",
      credit: rig.credit,
      layers: psdLayers.map((l) => ({ name: l.name, left: l.left, top: l.top, w: l.imageData.width, h: l.imageData.height })),
    },
    null,
    2
  )
);

console.log(`\n完成 → out/${ID}/  preview.png · sheet.png · ${ID}.psd · manifest.json`);
