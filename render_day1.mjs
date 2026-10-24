// render_day1.mjs — Render the 150.4s (4512 frames @ 30fps) Day 1 Whale Girl video with Paimon voiceover (`assets/day1_paimon_audio.mp3`)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load @napi-rs/canvas
const { createCanvas, GlobalFonts } = require('/tmp/node_render/node_modules/@napi-rs/canvas');

// Register project fonts (exact filenames from assets/fonts/)
GlobalFonts.registerFromPath(path.resolve('assets/fonts/ZCOOLKuaiLe-Regular.ttf'), 'ZCOOLKuaiLe');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/NotoSansSC-Bold.ttf'), 'NotoSansSC');
GlobalFonts.registerFromPath(path.resolve('assets/fonts/Silkscreen-Regular.ttf'), 'Silkscreen');

// Setup browser-like globals for UMD modules
globalThis.window = globalThis;

// Load Day 1 audio envelope & wire globalThis.AUDIO_DATA for mouth sync (`CORE.voiceAt(t)`)
const DAY1_AUDIO = require('./assets/day1_audio_envelope.js');
globalThis.DAY1_AUDIO = DAY1_AUDIO;
globalThis.AUDIO_DATA = {
  fps: DAY1_AUDIO.fps,
  duration: DAY1_AUDIO.duration,
  n_frames: DAY1_AUDIO.voice.length,
  beats: DAY1_AUDIO.beats,
  hits: DAY1_AUDIO.hits,
  energy: DAY1_AUDIO.voice,
  voice: DAY1_AUDIO.voice
};

// Load character & studio modules (all MV modules excluded)
require('./src/core.js');
require('./src/whale_girl_rig_data.js');
require('./src/whale_girl_actions.js');
require('./src/whale_girl.js');
require('./src/clawd.js');
require('./src/cast.js');
require('./src/props.js');
require('./src/day1_story.js');

const { W, H, FPS } = globalThis.CORE;
const { renderDay1Frame } = globalThis.DAY1_STORY;

const DURATION = DAY1_AUDIO.duration; // 150.4s
const TOTAL_FRAMES = Math.round(DURATION * FPS); // 4512 frames
const outFile = process.argv[2] || path.join(__dirname, 'day1_whale_girl.mp4');
const audioPath = path.join(__dirname, 'assets/day1_paimon_audio.mp3');

const ffmpegBin = fs.existsSync('/tmp/ffmpeg')
  ? '/tmp/ffmpeg'
  : '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';

console.log(`Rendering Day 1 video (${TOTAL_FRAMES} frames, ${DURATION}s @ ${FPS}fps, ${W}x${H}) -> ${outFile}`);

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const ffArgs = [
  '-y',
  '-f', 'rawvideo',
  '-vcodec', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', `${W}x${H}`,
  '-r', String(FPS),
  '-i', '-',
  '-i', audioPath,
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '19',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  '-movflags', '+faststart',
  outFile
];

const ff = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < TOTAL_FRAMES; f++) {
  const t = f / FPS;
  renderDay1Frame(ctx, t, 'director');
  const buf = canvas.data();
  const ok = ff.stdin.write(buf);
  if (!ok) {
    await new Promise(res => ff.stdin.once('drain', res));
  }
  if ((f + 1) % 300 === 0 || f === TOTAL_FRAMES - 1) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const fpsRate = ((f + 1) / Math.max(0.1, (Date.now() - t0) / 1000)).toFixed(1);
    console.log(`  Frame ${f + 1}/${TOTAL_FRAMES} (t=${t.toFixed(1)}s) — ${elapsed}s elapsed (${fpsRate} fps)`);
  }
}

ff.stdin.end();
await new Promise((resolve, reject) => {
  ff.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
});

console.log(`Done! Saved Day 1 video to ${outFile}`);
