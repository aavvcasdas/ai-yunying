#!/usr/bin/env node
/**
 * 原创 Live2D 素材构建器（多角色）
 *   src/chars/<id>.mjs  ──►  out/<id>/parts/*.png   （每个部件一张，2048² 对齐）
 *                       ──►  out/<id>/<id>.psd     （分层 PSD，图层名按 psd2live 规范）
 *                       ──►  out/<id>/preview.png  （合成定妆图）
 *                       ──►  out/chars.json        （角色索引，预览页用）
 *
 * 用法：node build.mjs [--size 2048] [--only lumi,nelly]
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { writePsdBuffer } from "ag-psd";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "src/chars");
const OUT = path.join(HERE, "out");

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const SIZE = parseInt(arg("--size", "2048"), 10);
const ONLY = arg("--only", "") ? arg("--only", "").split(",") : null;

function svgDoc(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${SIZE}" height="${SIZE}">${defs}${body}</svg>`;
}

function render(body, defs) {
  return Buffer.from(new Resvg(svgDoc(defs, body), { fitTo: { mode: "width", value: SIZE } }).render().asPng());
}

function trimRgba(raw, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (raw[row + x * 4 + 3] > 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const dst = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const from = ((minY + y) * width + minX) * 4;
    dst.set(raw.subarray(from, from + w * 4), y * w * 4);
  }
  return { data: dst, left: minX, top: minY, w, h };
}

async function buildChar(file) {
  const mod = await import(pathToFileURL(path.join(SRC, file)).href);
  const { meta, render: make } = mod;
  if (ONLY && !ONLY.includes(meta.id)) return null;

  const { defs, layers } = make();
  const dir = path.join(OUT, meta.id);
  const partsDir = path.join(dir, "parts");
  fs.mkdirSync(partsDir, { recursive: true });

  console.log(`\n▸ ${meta.id}  「${meta.theme}」 ${meta.name}`);
  const manifest = [];
  const psdChildren = [];

  for (const layer of layers) {
    const png = render(layer.body, defs);
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const t = trimRgba(data, info.width, info.height);
    if (!t) { console.warn(`  跳过空图层：${layer.name}`); continue; }

    const f = `${layer.name.replace(/\s+/g, "_")}.png`;
    await sharp(Buffer.from(t.data.buffer, t.data.byteOffset, t.data.length), {
      raw: { width: t.w, height: t.h, channels: 4 },
    }).png().toFile(path.join(partsDir, f));

    manifest.push({ name: layer.name, file: `parts/${f}`, left: t.left, top: t.top, w: t.w, h: t.h });
    psdChildren.push({
      name: layer.name, left: t.left, top: t.top, right: t.left + t.w, bottom: t.top + t.h,
      opacity: 255, hidden: false, imageData: { width: t.w, height: t.h, data: t.data },
    });
  }

  fs.writeFileSync(path.join(dir, `${meta.id}.psd`), writePsdBuffer({ width: SIZE, height: SIZE, children: psdChildren }, { generateThumbnail: false }));

  const base = sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  await base.composite(psdChildren.map((c) => ({
    input: Buffer.from(c.imageData.data.buffer, c.imageData.data.byteOffset, c.imageData.data.length),
    raw: { width: c.imageData.width, height: c.imageData.height, channels: 4 },
    left: c.left, top: c.top,
  }))).png().toFile(path.join(dir, "preview.png"));

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ size: SIZE, parts: manifest }, null, 2));
  console.log(`  ${psdChildren.length} 层 · PSD ${(fs.statSync(path.join(dir, `${meta.id}.psd`)).size / 1e6).toFixed(1)}MB · 预览已出`);

  return { id: meta.id, name: meta.name, theme: meta.theme, nameAscii: meta.nameAscii, themeAscii: meta.themeAscii, desc: meta.desc, palette: meta.palette,
           manifest: `${meta.id}/manifest.json`, preview: `${meta.id}/preview.png` };
}

const chars = [];
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith(".mjs")).sort()) {
  const r = await buildChar(f);
  if (r) chars.push(r);
}
fs.writeFileSync(path.join(OUT, "chars.json"), JSON.stringify(chars, null, 2));
console.log(`\n完成：${chars.length} 个角色 → out/chars.json`);
