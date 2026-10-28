#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Day5 字幕「屏级」时间轴：一屏 = 一段连续发声。

上一版的问题（已废弃，不要再回去）
--------------------------------
`day5_voice_alignment.json` 的 `chars_timed` 是「句内按字数比例铺 + 吸到能量谷」的
启发式结果。拿它切屏，平均首字晚 0.166s、最坏 0.99s（L19「读一次，等一次。」整句晚 1 秒），
采样 2006 帧里 6.8% 的帧挂的是上一句 —— 这就是用户说的「字幕没有对上」。

这一版的做法
------------
1. 真源是**发声段**（`align_day5_segments.py` 用 10ms RMS 量出来的 51 段）：
   人只在发声段里说话，也只可能在发声段里换字幕；
2. 一屏 = 一段发声。段内不管有多少字，都算这一屏；
3. 一屏的字幕文本 = 按标点切出来的分句按顺序铺进这个句子的各段
   （分句多就并、分句少就拆到字数最接近的位置，保证**绝不改字**、只改切分）；
4. 于是：屏起点 = 发声段起点（开口就有字幕），屏终点 = 发声段终点（说完就换），
   句与句之间的气口由渲染器把上一屏一直挂着 —— **气口里不会空屏，也不会提前上下一句**。

用法：
  python3 tools/day5制作/build_subtitle_timing.py
  python3 tools/day5制作/build_subtitle_timing.py --alignment Day5/day5_voice_alignment.json \
      --out Day5/day5_subtitle_timing.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SPLIT_PUNCT = "，。！？…—；：、,.!?"
KEEP_TAIL = "，。！？…—；：、,.!?）)」』”’"


def han(s: str) -> int:
    return len(re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", s))


def split_clauses(text: str) -> list[str]:
    """按标点切分句，标点跟着前一段走（字幕要保留逗号句号）。"""
    out, buf = [], ""
    for ch in text:
        buf += ch
        if ch in SPLIT_PUNCT and ch not in "…—":
            out.append(buf)
            buf = ""
        elif ch in "…—" and not buf.endswith(ch):
            continue
    if buf.strip():
        out.append(buf)
    parts = [p.strip() for p in out if p.strip()]
    # 太短的分句（<3 字）并到前一段，避免「诶，」单独闪一帧
    merged: list[str] = []
    for p in parts:
        if merged and han(p) < 3:
            merged[-1] += p
        else:
            merged.append(p)
    if len(merged) > 1 and han(merged[0]) < 3:
        merged[1] = merged[0] + merged[1]
        merged.pop(0)
    return merged


def tokenize(text: str) -> list[str]:
    """切成「字幕可切点」的单元：中文一字一个单元，连续英文/数字算一个单元。"""
    toks, buf = [], ""
    for ch in text:
        if ch.isascii() and (ch.isalnum()):
            buf += ch
            continue
        if buf:
            toks.append(buf)
            buf = ""
        toks.append(ch)
    if buf:
        toks.append(buf)
    return toks


def distribute(text: str, k: int) -> list[str]:
    """把一句话切成 k 屏，**一个字都不改、不丢**。

    · 优先在标点（分句末尾）处切；
    · 分句数不够时允许在字间切，但要在尽量均分的位置；
    · 代价 = Σ(本屏字数 − 平均字数)² + 8×（在非标点处切的次数）。
    """
    toks = tokenize(text)
    n = len(toks)
    if k <= 1:
        return [text]
    if k >= n:
        return [t for t in toks]
    is_end = [t in SPLIT_PUNCT or t in "…—" for t in toks]
    total = han(text) or n
    target = total / k
    INF = float("inf")
    cost = [[INF] * (n + 1) for _ in range(k + 1)]
    back = [[-1] * (n + 1) for _ in range(k + 1)]
    cost[0][0] = 0.0
    for j in range(1, k + 1):
        for end in range(j, n - (k - j) + 1):
            for start in range(j - 1, end):
                if cost[j - 1][start] == INF:
                    continue
                seg = "".join(toks[start:end])
                c = cost[j - 1][start] + (han(seg) - target) ** 2
                if not is_end[end - 1]:
                    c += 8.0
                if c < cost[j][end]:
                    cost[j][end] = c
                    back[j][end] = start
    if cost[k][n] == INF:                       # 兜底：均分
        step = n / k
        cuts = [0] + [round(step * i) for i in range(1, k)] + [n]
        return ["".join(toks[cuts[i]:cuts[i + 1]]) for i in range(k)]
    cuts, end = [], n
    for j in range(k, 0, -1):
        start = back[j][end]
        cuts.append((start, end))
        end = start
    cuts.reverse()
    return ["".join(toks[a:t]).strip() for a, t in cuts]


def assign_segments(segs, clauses):
    """分句比发声段少：把连续发声段按字数比例分给各分句，一屏可跨气口。"""
    n, k = len(segs), len(clauses)
    total = sum(han(c) for c in clauses) or 1
    counts, acc = [], 0
    for i, cl in enumerate(clauses):
        acc += han(cl)
        need = round(acc / total * n)
        counts.append(need)
        _ = i
    # 保证严格递增、每句至少一段
    counts = [max(i + 1, min(c, n - (k - i) + 1 + i)) for i, c in enumerate(counts)]
    counts[-1] = n
    out, cur = [], 0
    for i, cl in enumerate(clauses):
        end = counts[i] if i < k - 1 else n
        end = max(end, cur + 1)
        span = (segs[cur][0], segs[end - 1][1])
        out.append((span, cl))
        cur = end
    return out


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alignment", type=Path, default=REPO_ROOT / "Day5" / "day5_voice_alignment.json")
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "Day5" / "day5_subtitle_timing.json")
    args = ap.parse_args(argv)

    al = json.loads(args.alignment.read_text(encoding="utf-8"))
    screens, cursor = [], 0.0

    for c in al["cues"]:
        segs = c.get("segments") or [[c["start"], c["end"]]]
        clauses = split_clauses(c["text"])
        if len(clauses) >= len(segs):
            # 分句 ≥ 发声段：按分句切，切点只能落在标点上
            texts = distribute(c["text"], len(segs))
        else:
            # 分句 < 发声段：说明停顿落在句子中间（换气），**不切字**，
            # 一屏跨过这个气口（人还在说话，观众看不出来）
            texts = None
        if texts is None:
            spans = assign_segments(segs, clauses)
        else:
            spans = [(seg, t) for seg, t in zip(segs, texts)]
        for i, (span, text) in enumerate(spans):
            s, e = span
            screens.append({
                "line": c["index"],
                "id": c["id"],
                "text": text.strip(),
                "start": round(s, 3),
                "end": round(e, 3),
                "duration_seconds": round(e - s, 3),
                "cue_start": c["start"],
                "cue_end": c["end"],
                "clause_index": i,
                "clause_count": len(spans),
                "chars": han(text),
            })
        cursor = max(cursor, c["end"])

    # 屏与屏之间：本屏一直挂到下一屏上屏（渲染器 hold-until-next）；这里只做连续性自检
    overlap = [(a["id"], a["end"], b["start"]) for a, b in zip(screens, screens[1:]) if a["end"] > b["start"] + 1e-6]
    gaps = [b["start"] - a["end"] for a, b in zip(screens, screens[1:])]
    durs = [s["duration_seconds"] for s in screens]

    payload = {
        "schema": 2,
        "kind": "day5_subtitle_screens",
        "measured": True,
        "source": args.alignment.name,
        "method": (
            "一屏=一段连续发声（10ms RMS 发声段）。屏起点=发声段起点，屏终点=发声段终点；"
            "分句只用来决定这一段显示哪几个字，不参与计时。句间气口由渲染器把上一屏挂到下一屏上屏为止。"
        ),
        "screen_count": len(screens),
        "line_count": al["cue_count"],
        "duration_last_end": round(screens[-1]["end"], 3),
        "screen_duration_min": round(min(durs), 3),
        "screen_duration_median": round(sorted(durs)[len(durs) // 2], 3),
        "screen_duration_max": round(max(durs), 3),
        "gap_between_screens_min": round(min(gaps), 3) if gaps else 0.0,
        "gap_between_screens_max": round(max(gaps), 3) if gaps else 0.0,
        "overlap_count": len(overlap),
        "screens": screens,
    }
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"{al['cue_count']} 句 → {len(screens)} 屏字幕  →  {args.out}")
    print(f"  屏长 min/median/max = {payload['screen_duration_min']:.2f} / "
          f"{payload['screen_duration_median']:.2f} / {payload['screen_duration_max']:.2f}s")
    print(f"  屏间空白（渲染时由上一屏填掉）min {payload['gap_between_screens_min']:.2f}s / "
          f"max {payload['gap_between_screens_max']:.2f}s；重叠 {len(overlap)} 处")
    print(f"  末屏结尾 {payload['duration_last_end']:.2f}s")
    for s in screens:
        print(f"  {s['start']:7.2f}-{s['end']:7.2f} ({s['duration_seconds']:4.2f}s) "
              f"{s['chars']:2d}字 {s['id']}  {s['text']}")


if __name__ == "__main__":
    main()
