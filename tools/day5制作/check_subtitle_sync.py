#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验收字幕是否真的对上：**从成片自身**抽字幕条，逐帧找换屏点，跟时间轴对着比。

不看渲染日志、不信脚本自检，直接拿 mp4 说话。三件事：

1. 换屏时刻：把字幕条区域按 30fps 抽成灰度小图，逐帧差分，阈值以上算换屏；
   再和 `--subs` 里的 `screens[].start` 逐个比，允许 1–3 帧量化误差；
2. 空屏：和「肯定没有字幕」的参照帧（片尾卡中段）比，差异小于阈值就算空屏；
3. 静音弹字：抽成片音轨的 10ms 能量，看上屏点前 100ms 是否有静音、上屏瞬间是否有声。

用法：
  python3 tools/day5制作/check_subtitle_sync.py "Day5/成片/样片/day5_配音对齐_v3_字幕对齐.mp4" \
      --subs Day5/day5_subtitle_timing.json
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[2]
FF_CANDIDATES = [
    "/tmp/node_render/node_modules/@ffmpeg-installer/linux-x64/ffmpeg",
    "ffmpeg",
]


def find_ffmpeg() -> str:
    for c in FF_CANDIDATES:
        if c == "ffmpeg" or Path(c).exists():
            return c
    raise SystemExit("找不到 ffmpeg（先 npm i @ffmpeg-installer/ffmpeg 到 /tmp/node_render）")


# 字幕框在 1920×1080 里大致 y≈980–1120、x≈320–1620（Day2 加更版字幕）
CROP = "crop=1300:140:320:975"
SMALL = (260, 28)


def band_frames(ff: str, video: Path, fps: int, out_raw: Path) -> np.ndarray:
    cmd = [
        ff, "-v", "error", "-i", str(video),
        "-vf", f"{CROP},scale={SMALL[0]}:{SMALL[1]},format=gray",
        "-f", "rawvideo", "-y", str(out_raw),
    ]
    subprocess.run(cmd, check=True)
    a = np.fromfile(out_raw, dtype=np.uint8)
    fs = SMALL[0] * SMALL[1]
    n = a.size // fs
    return a[: n * fs].reshape(n, SMALL[1], SMALL[0]).astype(np.int16)


def audio_db(ff: str, video: Path, out_wav: Path, hop_s: float = 0.01) -> np.ndarray:
    subprocess.run([ff, "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
                    "-y", str(out_wav)], check=True)
    w = wave.open(str(out_wav))
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    hop = max(1, int(hop_s * sr))
    m = len(x) // hop
    rms = np.sqrt((x[: m * hop].reshape(m, hop) ** 2).mean(axis=1) + 1e-12)
    return 20 * np.log10(rms), hop / sr


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--subs", type=Path, default=REPO_ROOT / "Day5" / "day5_subtitle_timing.json")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--change-thr", type=float, default=0.6, help="逐帧平均灰度差阈值")
    ap.add_argument("--quiet-thr", type=float, default=-45.0, help="算静音的 dB 阈值")
    args = ap.parse_args(argv)

    ff = find_ffmpeg()
    subs = json.loads(args.subs.read_text(encoding="utf-8"))
    screens = subs["screens"]
    tmp = Path(tempfile.mkdtemp())

    # ── 1. 换屏点 ────────────────────────────────────────────────
    frames = band_frames(ff, args.video, args.fps, tmp / "band.raw")
    n = len(frames)
    diff = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    changed, i = [], 0
    while i < len(diff):
        if diff[i] > args.change_thr:
            j = i
            while j + 1 < len(diff) and diff[j + 1] > args.change_thr:
                j += 1
            changed.append((i + 1) / args.fps)
            i = j + 1
        else:
            i += 1

    # 去掉「片尾卡出现」和「字幕撤下」这类合理变化（末屏之后）
    last_start = screens[-1]["start"]
    screen_changes = [c for c in changed if c <= screens[-1]["end"] + 0.2]

    print(f"成片 {args.video.name}：{n} 帧 / {n / args.fps:.2f}s")
    print(f"检出变化 {len(changed)} 处；其中落在正片字幕区间内 {len(screen_changes)} 处")
    print(f"时间轴屏数 {len(screens)}（首屏 {screens[0]['start']:.2f}s 起，不需要换屏动画）")

    starts = [s["start"] for s in screens]
    matched, worst = 0, 0.0
    for t in screen_changes:
        near = min(starts, key=lambda x: abs(x - t))
        d = abs(near - t)
        worst = max(worst, d)
        if d <= 3.0 / args.fps + 1e-6:
            matched += 1
        else:
            print(f"   ✗ 换屏 {t:.2f}s 对不上任何屏起点（最近 {near:.2f}s，差 {d:.2f}s）")
    missing = [s for s in screens[1:] if not any(abs(s["start"] - t) <= 3.0 / args.fps for t in screen_changes)]
    print(f"   换屏点匹配 {matched}/{len(screen_changes)}；最大偏差 {worst * 1000:.0f}ms（30fps 一帧=33ms）")
    if missing:
        print("   ✗ 这些屏上屏时刻没在画面上检到：", [f"{m['id']}@{m['start']:.2f}" for m in missing])

    # ── 2. 空屏 ──────────────────────────────────────────────────
    # 参照「无字幕」帧：片尾卡中段
    ref_t = screens[-1]["end"] + 1.6
    ref = frames[min(n - 1, int(ref_t * args.fps))]
    blank = np.abs(frames - ref).mean(axis=(1, 2)) < 0.35
    win = (frames_start := int(screens[0]["start"] * args.fps), int(screens[-1]["end"] * args.fps))
    holes = [t / args.fps for t, b in enumerate(blank) if b and win[0] <= t <= win[1]]
    merged = []
    for t in holes:
        if merged and t - merged[-1][-1] <= 0.12:
            merged[-1].append(t)
        else:
            merged.append([t])
    long_holes = [m for m in merged if m[-1] - m[0] >= 0.10]
    print(f"   空屏：正片区间内空白帧 {len(holes)} 帧；连续 ≥0.10s 的空屏段 {len(long_holes)} 处")
    for m in long_holes[:12]:
        print(f"      {m[0]:.2f}–{m[-1]:.2f}s")

    # ── 3. 静音弹字 ──────────────────────────────────────────────
    db, hop = audio_db(ff, args.video, tmp / "mux.wav")
    strong = soft = silent = 0
    silent_list = []
    for s in screens:
        i = int(round(s["start"] / hop))
        pre = db[max(0, i - 10):i]
        pre_min = float(pre.min()) if pre.size else -180.0
        at = float(db[i:i + int(0.15 / hop)].max())     # 起音有 30–100ms 的爬升，给 0.15s
        if at < args.quiet_thr:
            silent += 1
            silent_list.append((s["id"], s["start"]))
        elif pre_min < -50:
            strong += 1
        else:
            soft += 1
    print(f"   上屏瞬间：强边界（前静音+即刻有声）{strong}；软起音 {soft}；起在静音里 {silent}")
    for sid, t in silent_list:
        print(f"      ✗ {sid} @ {t:.2f}s 上屏时没声音")

    silent = [x for x in silent_list if x[1] > 0.0]      # 第一屏贴在片头，允许淡入
    silent_list = [x for x in silent_list if x[1] > 0.0]
    # ── 4. 内容参考（只作参考，不计入结论：小模型错字多）：这屏的字，在这个时间窗里 ASR 是不是也在说 ──
    asr_path = REPO_ROOT / "Day5" / "day5_asr_tokens.json"
    content = []
    if asr_path.exists():
        toks = json.loads(asr_path.read_text(encoding="utf-8"))
        for sc in screens:
            win = "".join(t["word"] for t in toks
                          if sc["start"] - 0.12 <= t["start"] <= sc["end"] + 0.05)
            txt = "".join(c for c in sc["text"] if re.match(r"[\u4e00-\u9fffA-Za-z0-9]", c))
            if not txt:
                continue
            common = sum(min(txt.count(c), win.count(c)) for c in set(txt))
            content.append((sc["id"], sc["start"], round(common / len(txt), 2), txt, win))
        good = [c for c in content if c[2] >= 0.6]
        print(f"   内容参考：{len(good)}/{len(content)} 屏的窗口里，ASR 吐的字覆盖这屏 ≥60%"
              "（小模型错字多，此项只作参考，不进结论）")
        for c in content:
            if c[2] < 0.6:
                print(f"      · {c[0]}@{c[1]:.2f} 覆盖 {c[2]:.0%}  屏={c[3]}  ASR={c[4]}")
    ok = (matched == len(screen_changes)) and not missing and not long_holes and not silent
    first = np.argmax(db > -40) * hop
    last = (len(db) - np.argmax(db[::-1] > -40)) * hop
    print(f"   成片音轨发声区间 {first:.2f}–{last:.2f}s（末屏 {screens[-1]['start']:.2f}–{screens[-1]['end']:.2f}s）")
    print("结论：" + ("字幕与配音对齐 ✓" if ok else "有问题 ✗ 见上面 ✗ 行"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
