#!/usr/bin/env python3
"""Microsoft Edge TTS wrapper fixed to zh-CN-XiaoyiNeural, rate +0%, pitch +0Hz.

Single:
    say.py "大家好，本鱼回来了。" out.mp3
Batch:
    say.py --batch Day1配音台词.txt --outdir day1_audio

Every generated MP3 is read back for duration and F0 statistics. A JSON report
is printed to stdout; in batch mode it is also written to <outdir>/tts_report.json.
No timing in this tool is estimated from character count.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

VOICE = "zh-CN-XiaoyiNeural"
RATE = "+0%"
PITCH = "+0Hz"
F0_RANGE = (290.0, 330.0)


def find_ffmpeg() -> str | None:
    p = shutil.which("ffmpeg")
    if p:
        return p
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def edge_command(text: str, output: Path) -> list[str]:
    exe = shutil.which("edge-tts")
    base = [exe] if exe else [sys.executable, "-m", "edge_tts"]
    return base + [
        "--voice", VOICE,
        f"--rate={RATE}",
        f"--pitch={PITCH}",
        "--text", text,
        "--write-media", str(output),
    ]


def clean_text(text: str) -> str:
    text = " ".join(text.strip().split())
    if not text:
        raise ValueError("台词不能为空")
    if "\n" in text or "\r" in text:
        raise ValueError("一次只允许合成一句（单行）台词")
    return text


def read_duration(path: Path) -> float:
    ffprobe = shutil.which("ffprobe")
    if ffprobe:
        r = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "json", str(path)],
            text=True, capture_output=True, check=True,
        )
        return float(json.loads(r.stdout)["format"]["duration"])
    try:
        from mutagen.mp3 import MP3  # type: ignore

        audio = MP3(str(path))
        if audio.info and audio.info.length:
            return float(audio.info.length)
    except Exception:
        pass
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("无法回读时长：未发现 ffprobe、mutagen 或 ffmpeg")
    r = subprocess.run([ffmpeg, "-i", str(path)], text=True, capture_output=True)
    import re

    m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", r.stderr)
    if not m:
        raise RuntimeError(f"无法从 ffmpeg 输出解析时长：{path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def decode_pcm(path: Path, sample_rate: int = 16000):
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("无法解码做 F0 检查：未发现 ffmpeg")
    import numpy as np

    r = subprocess.run(
        [ffmpeg, "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sample_rate),
         "-f", "f32le", "-"],
        capture_output=True, check=True,
    )
    return np.frombuffer(r.stdout, dtype=np.float32), sample_rate


def f0_stats(path: Path) -> dict:
    """Autocorrelation F0 estimate over voiced 40 ms frames (20 ms hop)."""
    import numpy as np

    x, sr = decode_pcm(path)
    if x.size == 0:
        raise RuntimeError("音频为空，无法做 F0 检查")
    frame = int(0.040 * sr)
    hop = int(0.020 * sr)
    min_lag = int(sr / 500)   # search 100-500 Hz to avoid octave lock where possible
    max_lag = int(sr / 100)
    vals: list[float] = []
    voiced = 0
    total = 0
    for start in range(0, max(0, len(x) - frame), hop):
        seg = x[start:start + frame].astype(np.float64)
        seg -= np.mean(seg)
        rms = float(np.sqrt(np.mean(seg * seg)))
        total += 1
        if rms < 0.015:
            continue
        corr = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
        if corr[0] <= 0:
            continue
        window = corr[min_lag:max_lag + 1]
        lag_rel = int(np.argmax(window))
        lag = min_lag + lag_rel
        strength = float(window[lag_rel] / corr[0])
        # Periodic voiced frames usually have a clear autocorrelation peak.
        if strength < 0.35:
            continue
        # Parabolic interpolation around the discrete peak.
        if 0 < lag_rel < len(window) - 1:
            a, b, c = window[lag_rel - 1], window[lag_rel], window[lag_rel + 1]
            denom = a - 2 * b + c
            shift = 0.5 * (a - c) / denom if denom != 0 else 0.0
        else:
            shift = 0.0
        f0 = sr / (lag + shift)
        if 100 <= f0 <= 500:
            vals.append(float(f0))
            voiced += 1
    if not vals:
        raise RuntimeError("没有检测到足够的有声帧，无法给出 F0 中位数")
    arr = np.array(vals, dtype=np.float64)
    med = float(np.median(arr))
    return {
        "f0_median_hz": round(med, 2),
        "f0_p25_hz": round(float(np.percentile(arr, 25)), 2),
        "f0_p75_hz": round(float(np.percentile(arr, 75)), 2),
        "voiced_frames": int(voiced),
        "analyzed_frames": int(total),
        "f0_in_290_330_hz": bool(F0_RANGE[0] <= med <= F0_RANGE[1]),
    }


def synthesize_one(text: str, output: Path) -> dict:
    text = clean_text(text)
    output.parent.mkdir(parents=True, exist_ok=True)
    cmd = edge_command(text, output)
    r = subprocess.run(cmd, text=True, capture_output=True)
    if r.returncode != 0:
        if output.exists() and output.stat().st_size < 100:
            output.unlink()  # edge-tts may create a 0-byte file before connecting
        tail = (r.stderr or r.stdout or "edge-tts failed without output")[-2000:]
        raise RuntimeError(f"Edge TTS 合成失败（exit {r.returncode}）：\n{tail}")
    if not output.exists() or output.stat().st_size < 100:
        raise RuntimeError(f"Edge TTS 未生成有效文件：{output}")
    duration = read_duration(output)
    stats = f0_stats(output)
    return {
        "file": str(output),
        "text": text,
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
        "duration_sec_measured": round(duration, 3),
        **stats,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Edge TTS 晓伊固定参数合成 + 时长/F0回读")
    ap.add_argument("text", nargs="?", help="单句台词")
    ap.add_argument("output", nargs="?", help="输出 MP3")
    ap.add_argument("--batch", metavar="TXT", help="按行批量合成的台词文件")
    ap.add_argument("--outdir", metavar="DIR", help="批量输出目录（L01.mp3 起）")
    ap.add_argument("--check", metavar="MP3", help="只回读检查已有 MP3 的时长与 F0（不合成）")
    args = ap.parse_args()

    try:
        if args.check:
            path = Path(args.check)
            item = {"file": str(path), "duration_sec_measured": round(read_duration(path), 3), **f0_stats(path)}
            print(json.dumps(item, ensure_ascii=False, indent=2))
            return 0 if item["f0_in_290_330_hz"] else 3
        if args.batch:
            if not args.outdir:
                ap.error("--batch 需要同时给出 --outdir")
            lines = [clean_text(x) for x in Path(args.batch).read_text(encoding="utf-8").splitlines() if x.strip()]
            outdir = Path(args.outdir)
            report = []
            for i, line in enumerate(lines, 1):
                item = synthesize_one(line, outdir / f"L{i:02d}.mp3")
                item["cue"] = i
                report.append(item)
                print(
                    f"L{i:02d} duration={item['duration_sec_measured']:.3f}s "
                    f"F0median={item['f0_median_hz']:.2f}Hz "
                    f"in_range={item['f0_in_290_330_hz']} file={item['file']}",
                    flush=True,
                )
            report_path = outdir / "tts_report.json"
            ok = all(x["f0_in_290_330_hz"] for x in report)
            payload = {
                "voice": VOICE,
                "rate": RATE,
                "pitch": PITCH,
                "f0_target_hz": list(F0_RANGE),
                "count": len(report),
                "ok": ok,
                "items": report,
            }
            report_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps({"ok": ok, "count": len(report), "report": str(report_path)}, ensure_ascii=False))
            return 0 if all(x["f0_in_290_330_hz"] for x in report) else 3

        if not args.text or not args.output:
            ap.error('单句模式需要：say.py "台词" 输出.mp3')
        item = synthesize_one(args.text, Path(args.output))
        print(json.dumps(item, ensure_ascii=False, indent=2))
        return 0 if item["f0_in_290_330_hz"] else 3
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "voice": VOICE, "rate": RATE, "pitch": PITCH},
                         ensure_ascii=False, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
