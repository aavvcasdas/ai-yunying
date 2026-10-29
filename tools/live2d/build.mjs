#!/usr/bin/env node
/**
 * 鲸鱼娘 Live2D 素材构建器
 *   src/character.svg  ──►  out/parts/*.png   （每个部件一张，2048×2048 对齐）
 *                      ──►  out/whale_girl.psd（分层 PSD，图层名按 psd2live 规范）
 *                      ──►  out/preview.png    （合成预览）
 *                      ──►  out/manifest.json  （网页预览用）
 *
 * 用法：node build.mjs [--size 2048]
 */
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { writePsdBuffer } from "ag-psd";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "src/character.svg");
const OUT = path.join(HERE, "out");
const PARTS_DIR = path.join(OUT, "parts");

const argSize = process.argv.indexOf("--size");
const SIZE = argSize > -1 ? parseInt(process.argv[argSize + 1], 10) : 2048;

const svgText = fs.readFileSync(SRC, "utf8");
const defs = (svgText.match(/<defs>[\s\S]*?<\/defs>/) || [""])[0];

/** 按 <!--PART:name--> ... <!--/PART--> 切层，顺序即 PSD 图层顺序（下→上） */
function parseParts(text) {
  const re = /<!--PART:([^>]+?)-->([\s\S]*?)<!--\/PART-->/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push({ name: m[1].trim(), body: m[2].trim() });
  return out;
}

function renderSvg(body) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${SIZE}" height="${SIZE}">` +
    defs +
    body +
    `</svg>`;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng());
}

/** 裁到 alpha 包围盒，返回 {data,left,top,w,h}（画布坐标） */
function trimRgba(raw, width, height, canvas) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (raw[(y * width + x) * 4 + 3] > 2) {
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
  return { data: dst, left: minX, top: minY, w, h, canvas };
}

async function main() {
  fs.mkdirSync(PARTS_DIR, { recursive: true });
  const parts = parseParts(svgText);
  if (!parts.length) throw new Error("没有解析到任何 PART 块");

  const manifest = [];
  const psdChildren = [];

  for (const part of parts) {
    const png = renderSvg(part.body);
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const trimmed = trimRgba(data, info.width, info.height, SIZE);
    if (!trimmed) { console.warn(`  跳过空图层：${part.name}`); continue; }

    const file = `${part.name.replace(/\s+/g, "_")}.png`;
    await sharp(Buffer.from(trimmed.data.buffer, trimmed.data.byteOffset, trimmed.data.length), {
      raw: { width: trimmed.w, height: trimmed.h, channels: 4 },
    }).png().toFile(path.join(PARTS_DIR, file));

    manifest.push({ name: part.name, file: `parts/${file}`, left: trimmed.left, top: trimmed.top, w: trimmed.w, h: trimmed.h });
    psdChildren.push({
      name: part.name,
      left: trimmed.left,
      top: trimmed.top,
      right: trimmed.left + trimmed.w,
      bottom: trimmed.top + trimmed.h,
      opacity: 255,
      hidden: false,
      imageData: { width: trimmed.w, height: trimmed.h, data: trimmed.data },
    });
    console.log(`  ✓ ${part.name.padEnd(14)} ${String(trimmed.w).padStart(4)}×${String(trimmed.h).padEnd(4)} @ ${trimmed.left},${trimmed.top}`);
  }

  // 分层 PSD（Cubism / psd2live 都可直接导入）
  const psd = { width: SIZE, height: SIZE, children: psdChildren };
  fs.writeFileSync(path.join(OUT, "whale_girl.psd"), writePsdBuffer(psd, { generateThumbnail: false }));
  console.log(`\n  PSD: out/whale_girl.psd  (${(fs.statSync(path.join(OUT, "whale_girl.psd")).size / 1e6).toFixed(1)} MB, ${psdChildren.length} 层, ${SIZE}×${SIZE})`);

  // 合成预览
  const base = sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 22, g: 26, b: 44, alpha: 0 } } });
  const composites = [];
  for (const c of psdChildren) {
    composites.push({
      input: Buffer.from(c.imageData.data.buffer, c.imageData.data.byteOffset, c.imageData.data.length),
      raw: { width: c.imageData.width, height: c.imageData.height, channels: 4 },
      left: c.left, top: c.top,
    });
  }
  await base.composite(composites).png().toFile(path.join(OUT, "preview.png"));
  console.log("  预览: out/preview.png");

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ size: SIZE, parts: manifest }, null, 2));
  console.log("  清单: out/manifest.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
