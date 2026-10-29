/* 原创 Live2D 素材 · 参数化预览
   渲染逻辑在 rig.mjs（与离线出图共用同一份）；这里只负责角色切换与交互。 */
import { drawScene, roleOf, S } from "./rig.mjs";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const state = {
  ax: 0, ay: 0, az: 0, bx: 0, eo: 1, mo: 0,
  auto: { blink: true, breath: true, sway: true, talk: false },
};

let chars = [];          // chars.json
let current = null;      // 当前角色
let parts = [];
let blinkValue = 1, blinkTimer = 2 + Math.random() * 3;

/* ── 加载 ─────────────────────────────────────────── */
async function loadChar(ch) {
  current = ch;
  const manifest = await (await fetch(`../${ch.manifest}`)).json();
  parts = await Promise.all(
    manifest.parts.map(async (p) => {
      const img = new Image();
      img.src = `../${ch.id}/${p.file}`;
      await img.decode();
      return { ...p, img, role: roleOf(p.name) };
    })
  );

  document.getElementById("badge").textContent = `${ch.nameAscii || ch.name} · ${parts.length} 层 · ${manifest.size}²`;
  document.getElementById("meta").textContent = `${chars.length} 个原创角色 · ${parts.length} 层`;
  document.getElementById("desc").textContent = ch.desc || "";

  const list = document.getElementById("layers");
  list.innerHTML = "";
  for (const p of [...parts].reverse()) {
    const d = document.createElement("div");
    d.className = "layer";
    d.innerHTML = `<span><span class="sw" style="background:${ch.palette[2] || "#6fb3e8"}"></span>${p.name}</span><em>${p.w}×${p.h}</em>`;
    list.appendChild(d);
  }

  [...document.querySelectorAll(".char")].forEach((b) =>
    b.classList.toggle("on", b.dataset.id === ch.id)
  );
}

/* ── 渲染循环 ─────────────────────────────────────── */
let t0 = performance.now();
function frame(now) {
  const t = (now - t0) / 1000;

  if (state.auto.blink) {
    blinkTimer -= 1 / 60;
    if (blinkTimer <= 0) blinkTimer = 2 + Math.random() * 3.5;
    const phase = blinkTimer < 0.16 ? blinkTimer / 0.16 : -1;
    blinkValue = phase >= 0 ? Math.abs(phase - 0.5) * 2 : 1;
  } else blinkValue = 1;

  drawScene(ctx, parts, {
    ax: state.ax + (state.auto.sway ? Math.sin(t * 0.7) * 3 : 0),
    ay: state.ay,
    az: state.az,
    bx: state.bx,
    blink: blinkValue,
    eo: state.eo,
    mo: state.mo,
    breath: state.auto.breath ? Math.sin(t * 1.6) : 0,
    sway: state.auto.sway ? Math.sin(t * 1.15) : 0,
    sway2: state.auto.sway ? Math.sin(t * 1.15 + 0.6) : 0,
    talk: state.auto.talk ? Math.sin(t * 9) * 0.5 + 0.5 : 0,
  });

  requestAnimationFrame(frame);
}

/* ── 控件 ─────────────────────────────────────────── */
const bind = (id, key, fmt) => {
  const el = document.getElementById(id);
  const out = document.getElementById("v-" + id);
  const apply = () => {
    const v = +el.value;
    state[key] = key === "eo" || key === "mo" ? v / 100 : v;
    out.textContent = fmt ? fmt(state[key]) : el.value;
  };
  el.addEventListener("input", apply);
  apply();
};
bind("ax", "ax"); bind("ay", "ay"); bind("az", "az"); bind("bx", "bx");
bind("eo", "eo", (v) => v.toFixed(2));
bind("mo", "mo", (v) => v.toFixed(2));

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const k = chip.dataset.auto;
    state.auto[k] = !state.auto[k];
    chip.classList.toggle("on", state.auto[k]);
  });
});

/* ── 启动 ─────────────────────────────────────────── */
async function boot() {
  chars = await (await fetch("../chars.json")).json();
  const box = document.getElementById("chars");
  box.innerHTML = "";
  for (const ch of chars) {
    const b = document.createElement("button");
    b.className = "char";
    b.dataset.id = ch.id;
    b.innerHTML = `<b>${ch.name}</b><span>「${ch.theme}」</span>
      <div class="dots">${(ch.palette || []).map((c) => `<i style="background:${c}"></i>`).join("")}</div>`;
    b.addEventListener("click", () => loadChar(ch));
    box.appendChild(b);
  }
  await loadChar(chars[0]);
  requestAnimationFrame(frame);
}

boot().catch((e) => {
  document.getElementById("meta").textContent = "加载失败：" + e.message;
  console.error(e);
});
