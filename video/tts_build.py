#!/usr/bin/env python3
"""tts_build.py — Day 1 配音构建器（微软 Edge TTS / zh-CN-XiaoyiNeural）

规则（不可改）：
  voice = zh-CN-XiaoyiNeural
  rate  = 不传（= +0%）
  pitch = 不传（= +0Hz）
  → 任何“为了压时长而调 rate”的做法都算违规，只能改文案。

用法：
  python3 video/tts_build.py --calibrate                # 先标定语速（推荐第一步）
  python3 video/tts_build.py --tier 2                   # 生成标准版
  python3 video/tts_build.py --tier 2 --target 78       # 目标 78 秒，自动裁掉可裁的句子
  python3 video/tts_build.py --dry-run --assume-rate 3.2  # 不联网，只算时长和排期

产物：
  assets/day1.mp3              配音成品（含句间停顿）
  build/tts/day1_timings.json  每句起止时间（给分镜和字幕用）
  build/tts/lyrics_day1.js     可直接替换 video-fx 的 src/lyrics.js 里的 LY
  build/tts/report.txt         时长报告
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT_JSON = ROOT / "video" / "day1_script.json"
WORK = ROOT / "build" / "tts"
OUT_MP3 = ROOT / "assets" / "day1.mp3"

VOICE = "zh-CN-XiaoyiNeural"
RATE = None   # 必须为 None：不加偏移
PITCH = None  # 必须为 None：不加偏移

PUNCT = re.compile(r"[\s，。！？：；、—…,.!?\"'（）()]")


def spoken_len(text: str) -> int:
    """按“念出来的音节”估算字数：中文 1 字 = 1，英文缩写按字母数算。"""
    return len(PUNCT.sub("", text))


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg") or "ffmpeg"


def probe_duration(path: Path) -> float:
    ff = ffmpeg_bin()
    out = subprocess.run([ff, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        raise RuntimeError(f"无法读出时长: {path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


async def synth(text: str, out: Path) -> None:
    import edge_tts  # 延迟导入，--dry-run 不需要

    kwargs = {"voice": VOICE}
    if RATE:
        kwargs["rate"] = RATE
    if PITCH:
        kwargs["pitch"] = PITCH
    comm = edge_tts.Communicate(text, **kwargs)
    await comm.save(str(out))


def build_silence(seconds: float, out: Path) -> None:
    ff = ffmpeg_bin()
    subprocess.run(
        [
            ff, "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
            "-t", f"{seconds:.3f}", "-c:a", "libmp3lame", "-b:a", "96k", str(out),
        ],
        check=True,
    )


def concat(parts: list[Path], out: Path) -> None:
    ff = ffmpeg_bin()
    listing = WORK / "concat.txt"
    listing.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    subprocess.run(
        [
            ff, "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(listing),
            "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", str(out),
        ],
        check=True,
    )


def load_lines(tier: int) -> list[dict]:
    data = json.loads(SCRIPT_JSON.read_text(encoding="utf-8"))
    lines = [l for l in data["lines"] if l["tier"] <= tier]
    return lines


def estimate(lines: list[dict], rate: float) -> list[dict]:
    t = 0.0
    out = []
    for l in lines:
        dur = spoken_len(l["tts"]) / rate
        out.append({**l, "est_start": round(t, 3), "est_end": round(t + dur, 3), "est_dur": round(dur, 3)})
        t += dur + l["pause"]
    return out


def report(rows: list[dict], rate: float, tier: int) -> str:
    total = rows[-1]["est_end"] + rows[-1]["pause"] if rows else 0
    chars = sum(spoken_len(r["tts"]) for r in rows)
    lines = [
        f"tier={tier}  句数={len(rows)}  字数={chars}  假设语速={rate} 字/秒",
        f"预计总时长 = {total:.1f} 秒（发声 {chars/rate:.1f}s + 停顿 {sum(r['pause'] for r in rows):.1f}s）",
        "",
        f"{'ID':<5}{'tier':<5}{'字数':<5}{'估算起':<9}{'估算止':<9}文本",
    ]
    for r in rows:
        lines.append(
            f"{r['id']:<5}{r['tier']:<5}{spoken_len(r['tts']):<5}{r['est_start']:<9.2f}{r['est_end']:<9.2f}{r['tts']}"
        )
    return "\n".join(lines)


def check_target(rows: list[dict], target: float) -> str | None:
    """只提示、不自动裁剪——砍句子会破坏叙事连贯（比如砍掉五类里的两句，
    后面「前五类让我干活」就落空了）。要更短请改用 --tier 1。"""
    total = rows[-1]["est_end"] + rows[-1]["pause"] if rows else 0.0
    if total <= target:
        return None
    excess = total - target
    return (
        f"⚠ 预计 {total:.1f}s，超出目标 {target:.0f}s 共 {excess:.1f}s。\n"
        f"  当前 tier={rows[0]['tier'] if rows else '?'}（{len(rows)} 句）。"
        f"请改用更小的 --tier，或改写文案，不要靠调 rate 压时长。"
    )


async def real_synth(rows: list[dict], tier: int) -> tuple[list[dict], float]:
    WORK.mkdir(parents=True, exist_ok=True)
    parts: list[Path] = []
    t = 0.0
    out_rows = []
    for r in rows:
        voice_mp3 = WORK / f"{r['id']}.mp3"
        if not voice_mp3.exists():
            print(f"  合成 {r['id']} …", flush=True)
            await synth(r["tts"], voice_mp3)
        dur = probe_duration(voice_mp3)
        out_rows.append({**r, "start": round(t, 3), "end": round(t + dur, 3), "dur": round(dur, 3)})
        parts.append(voice_mp3)
        t += dur
        if r["pause"] > 0:
            gap = WORK / f"gap_{r['id']}.mp3"
            if not gap.exists():
                build_silence(r["pause"], gap)
            parts.append(gap)
            t += r["pause"]
    OUT_MP3.parent.mkdir(parents=True, exist_ok=True)
    concat(parts, OUT_MP3)
    return out_rows, probe_duration(OUT_MP3)


def emit_lyrics(rows: list[dict], total: float, out: Path) -> None:
    body = ",\n".join(
        f"    [{r['start']:.2f}, {r['end']:.2f}, {json.dumps(r['caption'], ensure_ascii=False)}, {json.dumps(r['speaker'], ensure_ascii=False)}]"
        for r in rows
    )
    out.write_text(
        "// 由 video/tts_build.py 生成，勿手改。\n"
        "// 用法：把 LY 整体替换 video-fx/src/lyrics.js 里的 LY，并同步 core.js 的 DURATION。\n"
        f"// DURATION = {total:.2f}\n"
        f"const LY = [\n{body}\n];\n",
        encoding="utf-8",
    )


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", type=int, default=2, choices=[1, 2, 3])
    ap.add_argument("--target", type=float, default=None, help="目标秒数，超出则自动裁剪 tier3→tier2")
    ap.add_argument("--calibrate", action="store_true", help="只跑一句标定语速")
    ap.add_argument("--dry-run", action="store_true", help="不联网，只按假设语速算时长")
    ap.add_argument("--assume-rate", type=float, default=3.2, help="dry-run 用的语速（默认 day0 实测 3.2 字/秒）")
    args = ap.parse_args()

    if args.calibrate:
        WORK.mkdir(parents=True, exist_ok=True)
        sample = "先交账本。播放七万四，涨粉九百零七，收藏两百三十二。"
        p = WORK / "calib.mp3"
        await synth(sample, p)
        dur = probe_duration(p)
        n = spoken_len(sample)
        print(f"标定句 {n} 字 → {dur:.2f}s → {n/dur:.2f} 字/秒")
        print(f"换算：90 秒可装 {n/dur*90:.0f} 字；70 秒可装 {n/dur*70:.0f} 字")
        (WORK / "calibration.json").write_text(
            json.dumps({"voice": VOICE, "rate": RATE, "pitch": PITCH, "sample": sample,
                        "chars": n, "seconds": dur, "chars_per_sec": n / dur}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return 0

    rows = load_lines(args.tier)

    if args.dry_run:
        rows = estimate(rows, args.assume_rate)
        text = report(rows, args.assume_rate, args.tier)
        print(text)
        if args.target:
            warn = check_target(rows, args.target)
            if warn:
                print("\n" + warn)
        WORK.mkdir(parents=True, exist_ok=True)
        (WORK / "report.txt").write_text(text, encoding="utf-8")
        return 0

    # 真实合成：逐句测时长后再做一次裁剪决策
    rows, total = await real_synth(rows, args.tier)
    WORK.mkdir(parents=True, exist_ok=True)
    text = report_from_real(rows, total, args.tier)
    print(text)
    (WORK / "report.txt").write_text(text, encoding="utf-8")
    if args.target:
        warn = check_target([{**r, "est_end": r["end"], "pause": 0} for r in rows], args.target)
        if warn:
            print("\n" + warn)
    (WORK / "day1_timings.json").write_text(json.dumps({"voice": VOICE, "duration": total, "lines": rows},
                                                        ensure_ascii=False, indent=2), encoding="utf-8")
    emit_lyrics(rows, total, WORK / "lyrics_day1.js")
    print(f"\n✓ {OUT_MP3} ({total:.2f}s)\n✓ build/tts/day1_timings.json\n✓ build/tts/lyrics_day1.js")
    return 0


def report_from_real(rows: list[dict], total: float, tier: int) -> str:
    chars = sum(spoken_len(r["tts"]) for r in rows)
    speech = sum(r["dur"] for r in rows)
    head = [
        f"voice={VOICE}  rate=+0%  pitch=+0Hz（均未加偏移）",
        f"tier={tier}  句数={len(rows)}  字数={chars}",
        f"成品总时长 {total:.2f}s ｜ 发声 {speech:.2f}s ｜ 停顿 {total - speech:.2f}s ｜ 实测语速 {chars/speech:.2f} 字/秒",
        "",
        f"{'ID':<5}{'起':<8}{'止':<8}{'时长':<7}文本",
    ]
    body = [f"{r['id']:<5}{r['start']:<8.2f}{r['end']:<8.2f}{r['dur']:<7.2f}{r['tts']}" for r in rows]
    return "\n".join(head + body)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
