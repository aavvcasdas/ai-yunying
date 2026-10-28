#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Day5 屏级字幕：一屏一句分句，起止取 **ASR 认出来的逐字时间**。

数据来源
--------
`Day5/day5_voice_alignment.json`（`asr_align_day5.py` 产出）里每句带 `chars_timed`：
每个汉字/字母都有 ASR 实测的 start/end。分句的第一字几点开口，字幕就几点上屏；
下一分句的第一字什么时候开口，上一屏就停在哪。

规则
----
1. 按标点把每句切成「分句」（，。！？…—；：、）；
2. 每个分句一屏，`start` = 该分句首字的时间，`end` = 下一分句首字的时间（句末则到句尾）；
3. 短于 `--min-screen`（默认 0.55s）的屏并到相邻分句，避免一闪而过；
4. 句与句之间的气口由渲染器把上一屏挂到下一屏上屏（不空屏）。

用法
  python3 tools/day5制作/build_subtitle_timing.py
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

CLAUSE_END = "，。！？；：、"          # 省略号/破折号不单独切屏（"呜…" 要跟后半句一起）
KEEP = re.compile(r"[^\u4e00-\u9fffA-Za-z0-9]")


def is_timed(ch: str) -> bool:
    return bool(re.match(r"[\u4e00-\u9fffA-Za-z0-9]", ch))


MIN_SCREEN = 0.80          # 一屏至少挂 0.8s，否则并到相邻分句


def split_screens(text: str, timed: list[dict], cue_start: float, cue_end: float) -> list[dict]:
    """把一句话按标点切屏，每屏的首字时间来自 ASR。"""
    chars = list(text)
    t_idx = 0
    starts: list[float] = []
    for ch in chars:
        if is_timed(ch):
            starts.append(timed[t_idx]["start"] if t_idx < len(timed) else cue_end)
            t_idx += 1
        else:
            starts.append(None)                      # 标点没有自己的时间

    # 标点归前一个分句；记录每个分句的起始字符下标
    clauses: list[tuple[int, int]] = []
    begin = 0
    for i, ch in enumerate(chars):
        if ch in CLAUSE_END:
            if any(is_timed(c) for c in chars[begin:i + 1]):
                clauses.append((begin, i + 1))
                begin = i + 1
    if begin < len(chars) and any(is_timed(c) for c in chars[begin:]):
        clauses.append((begin, len(chars)))
    if not clauses:
        clauses = [(0, len(chars))]

    def first_time(a: int) -> float:
        for k in range(a, len(chars)):
            if starts[k] is not None:
                return starts[k]
        return cue_end

    screens = []
    for n, (a, b) in enumerate(clauses):
        s = cue_start if n == 0 else first_time(a)
        e = first_time(clauses[n + 1][0]) if n + 1 < len(clauses) else cue_end
        screens.append({"text": "".join(chars[a:b]).strip(), "start": s, "end": e})

    # 太短并进相邻屏（宁可少一屏，也不要闪一下）
    changed = True
    while changed and len(screens) > 1:
        changed = False
        for n, sc in enumerate(screens):
            if sc["end"] - sc["start"] >= MIN_SCREEN:
                continue
            if n + 1 < len(screens):
                screens[n + 1]["text"] = sc["text"] + screens[n + 1]["text"]
                screens[n + 1]["start"] = sc["start"]
            else:
                screens[n - 1]["text"] = screens[n - 1]["text"] + sc["text"]
                screens[n - 1]["end"] = sc["end"]
            screens.pop(n)
            changed = True
            break
    for sc in screens:
        sc["start"] = round(max(cue_start, sc["start"]), 3)
        sc["end"] = round(min(cue_end, max(sc["end"], sc["start"] + 0.2)), 3)
    return screens


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alignment", type=Path, default=REPO_ROOT / "Day5" / "day5_voice_alignment.json")
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "Day5" / "day5_subtitle_timing.json")
    args = ap.parse_args(argv)

    al = json.loads(args.alignment.read_text(encoding="utf-8"))
    screens = []
    for c in al["cues"]:
        for sc in split_screens(c["text"], c.get("chars_timed") or [], c["start"], c["end"]):
            screens.append({
                "line": c["index"],
                "id": c["id"],
                "text": sc["text"],
                "start": sc["start"],
                "end": sc["end"],
                "duration_seconds": round(sc["end"] - sc["start"], 3),
                "cue_start": c["start"],
                "cue_end": c["end"],
                "chars": len(KEEP.sub("", sc["text"])),
            })

    durs = [s["duration_seconds"] for s in screens]
    payload = {
        "schema": 3,
        "kind": "day5_subtitle_screens",
        "measured": True,
        "source": args.alignment.name,
        "method": (
            "屏=分句。每屏起点=该分句首字的 ASR 实测时间，终点=下一分句首字时间；"
            "句间气口由渲染器把上一屏挂到下一屏上屏为止（不空屏）。"
        ),
        "screen_count": len(screens),
        "line_count": al["cue_count"],
        "screen_duration_min": round(min(durs), 3),
        "screen_duration_median": round(sorted(durs)[len(durs) // 2], 3),
        "screen_duration_max": round(max(durs), 3),
        "screens": screens,
    }
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"{al['cue_count']} 句 → {len(screens)} 屏  →  {args.out}")
    print(f"  屏长 min/median/max = {payload['screen_duration_min']:.2f} / "
          f"{payload['screen_duration_median']:.2f} / {payload['screen_duration_max']:.2f}s")
    for s in screens:
        print(f"  {s['start']:7.2f}-{s['end']:7.2f} ({s['duration_seconds']:4.2f}s) {s['chars']:2d}字 "
              f"{s['id']}  {s['text']}")


if __name__ == "__main__":
    main()
