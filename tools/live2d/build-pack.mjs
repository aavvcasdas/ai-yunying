#!/usr/bin/env node
/**
 * 大肥鱼 · 分层素材 → Live2D 素材（含配色变体）
 *
 *   assets/whale-maid/*.png + rig.json
 *     ─► out/dafeiyu/<variant>/<variant>.psd    分层 PSD（psd2live 语义图层名，1024×1536 / RGB 8bit）
 *     ─► out/dafeiyu/<variant>/preview.png      中立姿态定妆图
 *     ─► out/dafeiyu/<variant>/sheet.png        4 状态验收图
 *     ─► out/dafeiyu/<variant>/manifest.json    图层清单
 *     ─► out/dafeiyu/variants.json              配色索引（预览页用）
 *
 * 用法：
 *   node build-pack.mjs                     # 全部配色
 *   node build-pack.mjs --only teal         # 只做一套
 *   node build-pack.mjs --only original,wine
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import sharp from "sharp";
import { writePsdBuffer } from "ag-psd";
import { createPack, createState, CANVAS, SEMANTIC } from "./src/pack.mjs";
import { clothMask, recolorWithMask, PALETTES, LAYER_SLOT } from "./src/recolor.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "assets/whale-maid");
const OUT = path.join(HERE, "out/dafeiyu");

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const ONLY = arg("--only", "") ? arg("--only", "").split(",").map((s) => s.trim()) : null;

const rig = JSON.parse(fs.readFileSync(path.join(SRC, "rig.json"), "utf8"));

/* ── 1. 配色处理：只处理 6 个布料/头饰图层 ───────────── */
const CLOTH_FILES = Object.keys(LAYER_SLOT);

async function buildVariantImages(variant) {
  const pal = PALETTES[variant];
  const images = {};
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png"));
  for (const f of files) {
    const buf = fs.readFileSync(path.join(SRC, f));
    const spec = pal[LAYER_SLOT[f]];
    if (!spec) { images[f] = await loadImage(buf); continue; }

    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = clothMask(data, info.width, info.height);
    recolorWithMask(data, mask, spec);
    const png = await sharp(Buffer.from(data.buffer, data.byteOffset, data.length), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer();
    images[f] = await loadImage(png);
    images[`__raw__${f}`] = png;
  }
  return images;
}

/* ── 2. 渲染：定妆图 + 4 状态验收图 ─────────────────── */
const STATES = [
  { label: "idle", st: {} },
  { label: "turn + blink", st: { yaw: -0.85, pitch: 0.25, roll: -0.055, blink: 0 } },
  { label: "talk + body sway", st: { yaw: 0.45, roll: 0.04, mouth: 0.95, bodyX: 0.35, bodyRoll: 0.04 } },
  { label: "happy + blush", st: { mood: "happy", yaw: 0.2, roll: 0.03, blush: 1 } },
  { label: "half eye + shy", st: { mood: "shy", yaw: 0.35, roll: 0.03, blink: 0.45, blush: 1 } },
  { label: "sad", st: { mood: "sad", pitch: 0.3, roll: -0.03, blink: 0.5 } },
];

function renderState(pack, patch) {
  const st = { ...createState(), ...patch };
  const cv = createCanvas(CANVAS.w, CANVAS.h);
  const ctx = cv.getContext("2d");
  for (let i = 0; i < 30; i++) pack.draw(ctx, st, 1 / 60);
  pack.draw(ctx, st, 1 / 60);
  return cv;
}

const SH_W = 460, SH_H = 690, PAD = 20, LBL = 30;

function buildSheet(pack) {
  const cols = 3, rows = 2;
  const cv = createCanvas(cols * SH_W + PAD * (cols + 1), rows * (SH_H + LBL) + PAD * (rows + 1));
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#101827";
  ctx.fillRect(0, 0, cv.width, cv.height);
  STATES.forEach((s, i) => {
    const x = PAD + (i % cols) * (SH_W + PAD);
    const y = PAD + Math.floor(i / cols) * (SH_H + LBL + PAD);
    ctx.fillStyle = "#9fb4d8";
    ctx.font = "22px sans-serif";
    ctx.fillText(s.label, x + 4, y + 22);
    const img = renderState(pack, s.st);
    ctx.drawImage(img, x, y + LBL, SH_W, SH_H);
  });
  return cv;
}

/* ── 3. 分层 PSD ───────────────────────────────────── */
function variantFile(id) {
  const p = rig.parts.find((q) => q.id === id);
  const base = p.image.replace(/\.png$/, "").split("-")[0];
  if (id === "eyelidLeft" || id === "eyelidRight") return `${base}-open.png`;
  if (id === "eyeWhiteLeft" || id === "eyeWhiteRight") return `${base}-open.png`;
  if (id === "browLeft" || id === "browRight") return `${base}-neutral.png`;
  if (id === "mouth") return "mouth-N.png";
  return p.image;
}

async function pngToLayerImage(pngBuf, w, h) {
  const { data } = await sharp(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: w, height: h, data: new Uint8ClampedArray(data) };
}

async function buildPsd(images) {
  const layers = [];
  for (const p of [...rig.parts].sort((a, b) => a.z - b.z)) {
    const [left, top, w, h] = p.rect;

    if (p.id === "mouth") {
      const pair = [["mouth close", "mouth-N.png"], ["mouth open", "mouth-A.png"]];
      for (const [name, f] of pair) {
        layers.push({ name, left, top, imageData: await pngToLayerImage(images[`__raw__${f}`] || fs.readFileSync(path.join(SRC, f)), w, h) });
      }
      continue;
    }

    const raw = (f) => images[`__raw__${f}`] || fs.readFileSync(path.join(SRC, f));
    layers.push({ name: SEMANTIC[p.id] || p.id, left, top, imageData: await pngToLayerImage(raw(variantFile(p.id)), w, h) });

    if (p.id === "eyelidLeft" || p.id === "eyelidRight") {
      const side = p.id.endsWith("Left") ? "l" : "r";
      const base = p.image.replace(/\.png$/, "").split("-")[0];
      layers.push({ name: `eye close-${side}`, left, top, imageData: await pngToLayerImage(raw(`${base}-closed.png`), w, h) });
    }
  }
  return writePsdBuffer({ width: CANVAS.w, height: CANVAS.h, children: layers }, { generateThumbnail: false });
}

/* ── 主流程 ────────────────────────────────────────── */
const index = [];
for (const variant of Object.keys(PALETTES)) {
  if (ONLY && !ONLY.includes(variant)) continue;
  const pal = PALETTES[variant];
  const dir = path.join(OUT, variant);
  fs.mkdirSync(dir, { recursive: true });

  const images = await buildVariantImages(variant);
  const pack = createPack(rig, images);

  // 换色后的布料层落盘：网页按 variant 直接取这几张，不做浏览器端像素运算
  const partsDir = path.join(dir, "parts");
  fs.mkdirSync(partsDir, { recursive: true });
  let partCount = 0;
  for (const f of CLOTH_FILES) {
    const buf = images[`__raw__${f}`];
    if (!buf) continue;
    fs.writeFileSync(path.join(partsDir, f), buf);
    partCount++;
  }

  fs.writeFileSync(path.join(dir, "preview.png"), renderState(pack, {}).toBuffer("image/png"));
  fs.writeFileSync(path.join(dir, "sheet.png"), buildSheet(pack).toBuffer("image/png"));

  const psd = await buildPsd(images);
  fs.writeFileSync(path.join(dir, `${variant}.psd`), psd);

  const manifest = {
    variant, label: pal.label, labelAscii: pal.labelAscii,
    size: CANVAS,
    source: "FAYER-0610/dafeiyu-vtuber · overlay/avatar/packs/whale-maid",
    credit: rig.credit,
    partsDir: partCount ? "parts/" : null,
    recolored: CLOTH_FILES.filter((f) => pal[LAYER_SLOT[f]] && images[`__raw__${f}`]).map((f) => f),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));

  index.push({
    id: variant, label: pal.label, labelAscii: pal.labelAscii,
    psd: `${variant}/${variant}.psd`, preview: `${variant}/preview.png`, sheet: `${variant}/sheet.png`,
    parts: partCount ? `${variant}/parts/` : null,
    recolored: manifest.recolored,
  });
  console.log(`  ✓ ${variant.padEnd(9)} ${pal.labelAscii.padEnd(15)} PSD ${(psd.length / 1e6).toFixed(1)}MB`);
}

fs.writeFileSync(path.join(OUT, "variants.json"), JSON.stringify(index, null, 2));
console.log(`\n完成 → out/dafeiyu/  ${index.length} 套配色（含原色）`);
