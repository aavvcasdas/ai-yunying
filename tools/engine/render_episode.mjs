// render_episode.mjs — 通用单集生产渲染器（1920x1080@30，逻辑 1280x720）
// CLI 与 tools/gate.py 对接：
//   node tools/engine/render_episode.mjs --spec <episode.spec.mjs> \
//     --voice <wav> --alignment <json> --subtitle-file <json> [--out <mp4>|--test|--stills]
// 正式渲染只接受 measured=true 且 SHA256 匹配的实测轴；TITLE_LEN=0，末句后 0.24s 结束。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, loadImage, resolveFfmpeg, W, H, FPS, mix, smooth, seg } from './room_base.mjs';
import { validateSpec, resolveWordTime } from './schema_validator.mjs';
import { openerCamera, drawRolePlates, drawStamp, OPENER_END } from './opener_director.mjs';
import { composeScene, drawComplianceCorner, drawHudBanner } from './scene_compositor.mjs';
import { getProp, assertForegroundWithinStage } from './prop_registry.mjs';
import { loadContactActors, actorAnchors, drawContactActor } from '../互动元素/actor_contacts.mjs';
import { renderCueInteraction, burst, CORE } from '../互动元素/cue_props_engine.mjs';
import { createDay2Subtitle } from '../字幕/day2_style_sub.mjs';

const { reseedBoil } = CORE;
const S = 1.5; // 1280x720 逻辑 -> 1920x1080 输出
export const TITLE_LEN = 0;

function argOf(argv, k) { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null; }
export function gaitAnim(t, start, dur) {
  if (t < start || t > start + dur) return {};
  const phase = Math.floor((t - start) * 10) % 8;
  const a = Math.sin((phase * Math.PI) / 4);
  return { bones: { legL: { rot: a * 0.055, dy: -Math.max(0, a) * 10 }, legR: { rot: -a * 0.055, dy: -Math.max(0, -a) * 10 } } };
}

export async function loadSpec(specPath) {
  const mod = await import(pathToFileURL(path.resolve(specPath)).href);
  const spec = mod.default || mod.SPEC || mod.spec;
  if (!spec) throw new Error('episode.spec.mjs 必须 default 导出 spec 对象');
  return spec;
}

export function validateInputs({ voice, alignment, subdata }) {
  if (alignment.measured !== true || subdata.measured !== true) throw new Error('正式渲染只接受 measured=true 的实测轴与字幕');
  const sha = createHash('sha256').update(fs.readFileSync(voice)).digest('hex');
  if (sha !== alignment.source_sha256) throw new Error('音源 SHA256 与实测轴不匹配');
  const cues = alignment.cues;
  if (!Array.isArray(cues) || !cues.length) throw new Error('实测轴 cues 为空');
  if (subdata.screens.map((s) => s.text).join('') !== cues.map((c) => c.text).join('')) throw new Error('字幕与实测轴台词逐字不一致');
  return { sha, cues };
}

export function buildShots(spec, cues) {
  return spec.shots.map((s) => ({ ...s, start: cues[s.fromLine - 1].start, end: cues[s.toLine - 1].end }));
}

export function buildEvents(spec, shots, cues) {
  const events = [];
  for (const shot of shots) {
    for (const it of shot.interactions || []) {
      const line = it.wordLine ?? it.line ?? shot.fromLine;
      const { time } = resolveWordTime(cues, line, it.wordChar || cues[line - 1].text[0]);
      const startLine = it.startLine ?? line;
      events.push({
        ...it, shotId: shot.id, measured: true, audio_sha256: 'alignment',
        word_id: `L${String(line).padStart(2, '0')}:${it.wordChar || ''}`,
        startFrame: Math.round(cues[startLine - 1].start * FPS),
        contactFrame: Math.round(time * FPS),
        endFrame: Math.round(shot.end * FPS) - 1,
        params: { scale: it.scale ?? 1, land: it.land, text: it.text },
      });
    }
  }
  return events;
}

function resolveActor(plan, t, line) {
  let pose = plan.pose || 'idle';
  for (const p of plan.poses || []) {
    if ((p.line != null && line >= p.line) || (p.at != null && t >= p.at)) pose = p.pose;
  }
  for (const p of plan.poseChanges || []) if (t >= p.at) pose = p.pose;
  let x = plan.x; let anim = plan.anim || {};
  if (plan.walk) {
    const { from, to, start = 0, duration = 1 } = plan.walk;
    const p = smooth((t - start) / duration);
    x = mix(from, to, p);
    anim = gaitAnim(t, start, duration);
  }
  return { pose, x, y: plan.y, u: plan.u ?? 38, flip: !!plan.flip, lean: plan.lean ?? 0, anim };
}

export async function createEpisodeRenderer({ spec, alignment, subdata }) {
  validateSpec(spec, { cueCount: alignment.cues.length });
  const cues = alignment.cues;
  const shots = buildShots(spec, cues);
  const events = buildEvents(spec, shots, cues);
  const duration = cues[cues.length - 1].end + 0.24;
  const frames = Math.ceil(duration * FPS);
  await loadContactActors({ createCanvas, loadImage });
  const sub = createDay2Subtitle({ fontOf: (n, w) => `${w} ${n}px NotoSansSC`, measureCtx: createCanvas(1, 1).getContext('2d') });
  const stamp = spec.opener.stampWord
    ? { time: resolveWordTime(cues, spec.opener.stampWord.line, spec.opener.stampWord.char).time, text: spec.opener.stampText, at: spec.opener.stampAt || [640, 520] }
    : null;

  const lineAt = (t) => { let n = 1; cues.forEach((c, i) => { if (t >= c.start) n = i + 1; }); return n; };
  const shotAt = (t) => shots.find((s, i) => t >= s.start && t < (shots[i + 1]?.start ?? duration + 0.01)) || shots[0];

  function actorsFor(shot, t, line) {
    const plans = shot === shots[0] ? [spec.opener.actorA, spec.opener.actorB] : (shot.actors || shot.actorsPlan);
    return plans.map((p) => resolveActor(p, t, line));
  }

  function drawProp(ctx, ref, t, pop = 1) {
    const prop = getProp(ref.propId);
    assertForegroundWithinStage(ref.propId, ref.y, ref.scale ?? 1);
    ctx.save();
    ctx.translate(ref.x, ref.y);
    ctx.scale((ref.scale ?? 1) * pop, (ref.scale ?? 1) * pop);
    prop.draw(ctx, t, ref.state || {});
    ctx.restore();
  }

  /** 只画相机空间 L0-L3（供横屏母版与竖屏重排共用同一场景状态）。 */
  function renderScene(ctx, rawTime, { zoomMul = 1 } = {}) {
    const frame = Math.round(rawTime * FPS);
    const t = rawTime;
    const shot = shotAt(t);
    const line = lineAt(t);
    const actors = actorsFor(shot, t, line);
    const anchors = actors.map((a) => { try { return actorAnchors(a); } catch { return null; } });
    const isOpener = shot === shots[0] && t < Math.min(shot.end, OPENER_END);
    const cam = isOpener
      ? openerCamera(t, { stampTime: stamp?.time, end: Math.min(shot.end, OPENER_END) })
      : (shot.camera || { z: 1.06, cx: 640, cy: 375 });
    const camZ = { ...cam, z: cam.z * zoomMul };
    reseedBoil(0);
    composeScene(ctx, {
      t, cam: camZ, mood: shot.mood || 'work_cool', focusX: actors[0]?.x ?? 640,
      layers: {
        back: (g) => {
          for (const ref of (shot.companionProps || []).filter((p) => p.behind)) drawProp(g, ref, t);
        },
        actors: (g) => { for (const a of actors) drawContactActor(g, a); },
        foreground: (g) => {
          // 头顶身份铭牌（场景空间，位于头顶上方，不贴角色本体）
          if (isOpener && spec.opener.rolePlates) {
            const plates = spec.opener.rolePlates.map((text, i) => {
              const an = anchors[i];
              return an?.headTop ? { text, x: an.headTop[0], y: an.headTop[1], dir: i === 0 ? -1 : 1 } : null;
            }).filter(Boolean);
            drawRolePlates(g, plates, t);
          }
          if (isOpener) for (const ref of spec.opener.foregroundProps || []) drawProp(g, ref, t);
          for (const ref of (shot.companionProps || []).filter((p) => !p.behind)) {
            const from = ref.fromLine ? cues[ref.fromLine - 1].start : shot.start;
            if (t < from) continue;
            drawProp(g, ref, t, 0.85 + 0.15 * smooth((t - from) / 0.25));
          }
          for (const ev of events.filter((e) => e.shotId === shot.id)) {
            if (['drop_bonk', 'slap_deflect', 'unroll_scroll'].includes(ev.verb)) {
              const ai = ev.actor ?? (ev.verb === 'slap_deflect' ? 1 : 0);
              if (anchors[ai]) renderCueInteraction(g, frame, ev, { contact: anchors[ai], current: anchors[ai] });
            } else if (ev.at) {
              if (frame >= ev.startFrame && frame <= ev.endFrame) {
                drawProp(g, { propId: ev.propId, x: ev.at[0], y: ev.at[1], scale: ev.scale ?? 1, state: { text: ev.text } }, t);
                if (frame >= ev.contactFrame) burst(g, ev.at[0], ev.at[1] - 20, (frame - ev.contactFrame) / FPS);
              }
            }
          }
          if (isOpener && stamp) drawStamp(g, t, stamp.time, stamp.text, stamp.at[0], stamp.at[1]);
        },
      },
    });
    return { shot: shot.id, line, camera: camZ, isOpener };
  }

  /** L4 固定屏幕 HUD：横幅 + 角标 + Day2 字幕。ctx 须处于逻辑坐标变换下。 */
  function renderHud(ctx, rawTime) {
    if (rawTime < OPENER_END) drawHudBanner(ctx, rawTime, spec.opener);
    drawComplianceCorner(ctx);
    const s = subdata.screens.find((x) => rawTime >= x.start && rawTime < x.end);
    if (s) sub.draw(ctx, { lines: sub.wrap(s.text), speaker: spec.speaker || '本鲸', vis: 1, W, H });
  }

  function renderFrame(ctx, rawTime, opts = {}) {
    const info = renderScene(ctx, rawTime, opts);
    if (!opts.noHud) renderHud(ctx, rawTime);
    return info;
  }

  return { spec, cues, shots, events, duration, frames, stamp, sub, renderScene, renderHud, renderFrame, lineAt, shotAt };
}

export async function main(argv = process.argv.slice(2)) {
  const specPath = argOf(argv, '--spec');
  if (!specPath) throw new Error('用法：--spec <episode.spec.mjs> --voice <wav> --alignment <json> --subtitle-file <json> [--out|--test|--stills]');
  const voice = argOf(argv, '--voice');
  const alignmentPath = argOf(argv, '--alignment');
  const subsPath = argOf(argv, '--subtitle-file');
  if (!voice || !alignmentPath || !subsPath) throw new Error('缺少 --voice/--alignment/--subtitle-file');
  const spec = await loadSpec(specPath);
  const alignment = JSON.parse(fs.readFileSync(alignmentPath, 'utf8'));
  const subdata = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
  validateInputs({ voice, alignment, subdata });
  const r = await createEpisodeRenderer({ spec, alignment, subdata });
  const specDir = path.dirname(path.resolve(specPath));

  if (argv.includes('--test') || argv.includes('--stills')) {
    const canvas = createCanvas(W * S, H * S);
    const g = canvas.getContext('2d');
    const times = [0, 0.35, 0.72, 1.0, 1.6, 2.2, ...r.shots.map((s) => (s.start + s.end) / 2), ...(r.stamp ? [r.stamp.time] : [])]
      .filter((x) => x < r.duration);
    const samples = [];
    const dir = path.join(specDir, 'engine_stills');
    if (argv.includes('--stills')) fs.mkdirSync(dir, { recursive: true });
    for (const t of times) {
      g.setTransform(S, 0, 0, S, 0, 0);
      g.clearRect(0, 0, W, H);
      samples.push({ time: t, ...r.renderFrame(g, t) });
      if (argv.includes('--stills')) fs.writeFileSync(path.join(dir, `t_${t.toFixed(3)}.jpg`), canvas.toBuffer('image/jpeg'));
    }
    const report = { measured: true, title_len: TITLE_LEN, frames: r.frames, duration: r.duration, samples, events: r.events.map((e) => ({ id: e.id || e.propId, verb: e.verb, word_id: e.word_id, contactFrame: e.contactFrame })) };
    fs.writeFileSync(path.join(specDir, 'engine_render_test.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('PASS', samples.length, 'samples', r.frames, 'frames');
    return report;
  }

  const out = argOf(argv, '--out') || path.join(specDir, `Day${spec.day}_通用引擎干声版.mp4`);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const canvas = createCanvas(W * S, H * S);
  const g = canvas.getContext('2d');
  const ff = spawn(resolveFfmpeg(), ['-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W * S}x${H * S}`, '-r', String(FPS), '-i', '-', '-i', voice, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-crf', '19', '-preset', 'veryfast', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '160k', '-af', 'apad', '-t', String(r.frames / FPS), '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  ff.stderr.on('data', (d) => { err += d; });
  ff.stdin.on('error', () => {});
  const done = new Promise((res, rej) => { ff.on('error', rej); ff.on('close', (c) => (c === 0 ? res() : rej(new Error(err.slice(-2000))))); });
  for (let f = 0; f < r.frames; f++) {
    g.setTransform(S, 0, 0, S, 0, 0);
    g.clearRect(0, 0, W, H);
    r.renderFrame(g, f / FPS);
    const b = canvas.data();
    if (!ff.stdin.write(Buffer.from(b.buffer, b.byteOffset, b.byteLength))) await Promise.race([new Promise((res) => ff.stdin.once('drain', res)), done]);
    if (f % 150 === 0) console.log(`${f}/${r.frames}`);
  }
  ff.stdin.end();
  await done;
  console.log('DONE', out);
  return { out, frames: r.frames, duration: r.duration };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
