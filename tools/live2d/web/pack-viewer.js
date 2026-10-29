/* 现成分层素材包预览：加载 out/dafeiyu/manifest.json + assets 里的 PNG，用 share/pack 逻辑渲染。
   渲染代码在 src/pack.mjs（与 build-pack.mjs 出图共用同一份），这里只管交互。 */
import { createPack, createState } from "../src/pack.mjs";

const BASE = "../assets/whale-maid/";
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const st = { ...createState(), auto: { blink: true, breath: true, physics: true, talk: false, gaze: true } };
let pack = null;
let blinkTimer = 2 + Math.random() * 3;
let blinkPhase = -1;
let gazeTimer = 2, gazeTarget = { x: 0, y: 0 }, gazeNow = { x: 0, y: 0 };

async function loadImage(name) {
  const img = new Image();
  img.src = BASE + name;
  await img.decode();
  return img;
}

async function boot() {
  const rig = await (await fetch(`${BASE}rig.json`)).json();

  // 只加载实际会用到的图（中立 + 各个差分）
  const needed = new Set();
  for (const p of rig.parts) {
    const base = p.image.replace(/\.png$/, "").split("-")[0];
    if (/^(eyelid)/.test(p.id)) ["open", "half", "closed"].forEach((v) => needed.add(`${base}-${v}.png`));
    else if (/^(eyeWhite)/.test(p.id)) ["open", "half", "closed"].forEach((v) => needed.add(`${base}-${v}.png`));
    else if (/^brow/.test(p.id)) ["neutral", "happy", "sad", "angry", "surprised", "excited"].forEach((v) => needed.add(`${base}-${v}.png`));
    else if (p.id === "mouth") ["N", "A", "half", "happy-N", "happy-A", "sad-N", "sad-A", "angry-N", "angry-A", "O"].forEach((v) => needed.add(`mouth-${v}.png`));
    else needed.add(p.image);
  }

  const images = {};
  let bytes = 0;
  await Promise.all(
    [...needed].map(async (n) => {
      const r = await fetch(BASE + n);
      if (!r.ok) return;
      const buf = await r.arrayBuffer();
      bytes += buf.byteLength;
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([buf], { type: "image/png" }));
      await img.decode();
      images[n] = img;
    })
  );

  pack = createPack(rig, images);
  document.getElementById("badge").textContent =
    `${Object.keys(images).length} 张图 / ${(bytes / 1e6).toFixed(2)}MB · ${pack.parts.length} 个部件`;
  document.getElementById("meta").textContent = `${rig.title} · ${rig.credit}`;

  buildLayerList(pack);
  requestAnimationFrame(loop);
}

function buildLayerList(p) {
  const box = document.getElementById("layers");
  box.innerHTML = "";
  for (const q of [...p.parts].reverse()) {
    const d = document.createElement("div");
    d.className = "layer";
    d.innerHTML = `<span>${q.id}</span><em>z${q.z} · ${q.rect[2]}×${q.rect[3]}</em>`;
    box.appendChild(d);
  }
}

/* ── 控件 ── */
const bind = (id, key, scale = 100, fmt = (v) => v.toFixed(2)) => {
  const el = document.getElementById(id), out = document.getElementById("v-" + key);
  const apply = () => {
    st[key] = +el.value / scale;
    if (out) out.textContent = fmt(st[key]);
  };
  el.addEventListener("input", apply);
  apply();
};
bind("yaw", "yaw"); bind("pitch", "pitch"); bind("roll", "roll");
bind("bodyX", "bodyX"); bind("eye", "blink"); bind("mouth", "mouth"); bind("blush", "blush");

document.getElementById("mood").addEventListener("change", (e) => { st.mood = e.target.value; });

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const k = chip.dataset.auto;
    st.auto[k] = !st.auto[k];
    chip.classList.toggle("on", st.auto[k]);
  });
});

/* ── 循环 ── */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (st.auto.blink) {
    blinkTimer -= dt;
    if (blinkPhase >= 0) {
      blinkPhase += dt / 0.16;
      if (blinkPhase >= 1) { blinkPhase = -1; blinkTimer = 2.4 + Math.random() * 3.4; }
    } else if (blinkTimer <= 0) blinkPhase = 0;
    st.blink = blinkPhase >= 0 ? Math.abs(blinkPhase - 0.5) * 2 : 1;
  }

  if (st.auto.gaze) {
    gazeTimer -= dt;
    if (gazeTimer <= 0) {
      gazeTimer = 2.2 + Math.random() * 3.6;
      gazeTarget = { x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.5) * 1.2 };
    }
    gazeNow.x += (gazeTarget.x - gazeNow.x) * Math.min(1, dt * 3.2);
    gazeNow.y += (gazeTarget.y - gazeNow.y) * Math.min(1, dt * 3.2);
  } else { gazeNow.x *= 0.94; gazeNow.y *= 0.94; }
  st.gazeX = gazeNow.x; st.gazeY = gazeNow.y;

  if (st.auto.talk) st.mouth = 0.35 + Math.abs(Math.sin(now / 120)) * 0.6;
  else if (document.getElementById("mouth").value === "0") st.mouth = 0;

  if (st.auto.physics === false) st.yaw = st.yaw * 0.999; // 物理仍跑，只是不额外驱动

  pack && pack.draw(ctx, st, dt);
  requestAnimationFrame(loop);
}

boot().catch((e) => {
  document.getElementById("meta").textContent = "加载失败：" + e.message;
  console.error(e);
});
