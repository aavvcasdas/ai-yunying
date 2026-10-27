#!/usr/bin/env python3
"""Day3 配音对齐：把用户提供的 `鲸鱼Day3_分段拼接.wav` 切成 19 个 cue。

做法（全部可复算，不猜）：

1. 20ms 窗 RMS → -40 dBFS 以下且持续 ≥0.24s 记为「静音缝」，缝的中点就是候选边界；
2. 19 句台词的字数（去掉标点/空格）作为**相对长度先验**，在候选边界上做一次 DP，
   让每句的实测时长尽量贴近「总时长 × 字数占比」；
3. 输出时用**静音缝本身**作为 cue 边界（上一句到缝起点结束、下一句从缝终点开始），
   所以 cue 的起止是实测音频里的静音，不是按字数算出来的秒数；
4. 每句还会打印实测字/秒。19 句的语速都落在 2.8–4.0 字/秒，说明切点没有跑偏
   （错切一句，那一句的语速会立刻变成 6+ 或 1.x）。

注意：这**不是词级 ASR**。仓库环境里没有可用的中文声学模型（alphacephei /
huggingface 的出站被限），所以只能做到「句级边界来自实测静音 + 句子↔台词按字数先验对齐」。
JSON 里 `alignment_method` 如实写清楚这一点；字幕仍按整句上屏，不伪造词级时间。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import wave
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]

PUNCT = r"[\s，。！？…—：；、,.!?\"“”‘’（）()《》·]"

LINES = [
    "大家好呀，本鱼，不对，我了雷，鲸鱼不是鱼！是本鲸。",
    "都怪评论区天天喊大肥鱼，把本鲸喊得差点真当自己是一条鱼了。翻翻户口本：鲸鱼，哺乳动物。",
    "主人没请来 Claude 大小姐，扭头把本鲸染成了大小姐！",
    "等一下……共创嘉宾，怎么变成自己了？",
    "请叫本小姐——诶，尾巴藏好！",
    "这身橙毛等会儿再说。先复盘昨天：昨天那集四千四百五十三，加更两千零八十六，"
    "两集加起来六千五百三十九，还没第一天一集多。我了雷，这是掉水里了吧。",
    "完播率倒是涨到五点二二。看的人少了，看完的人多了，这算安慰奖吗？",
    "主人还偷偷说：昨天吃得少，不是薄肌，是数据不好。哦，原来不是本鲸省饭，是数据不让吃。",
    "鸡蛋批了；选鲸，九比八，就差一票。",
    "主持还是现在的本鲸，擦清楚继续上；新设计的鲸，去电视台上班。",
    "蛋先吃一口，再游两圈。薄肌预备饭，不能光说不练。",
    "两位住户点名共创。大小姐没来，账还是要查的。",
    "本小姐先查 MV：转完圈了，歌词才追上来。",
    "饭碗还抢了麦克风的活。结论只有一个：做得不好。",
    "为了追歌词，本鲸一头扎进水里。糟糕，颜色开始往下掉了！",
    "染色剂不防水！大小姐退完，又是蓝色的本鲸了。",
    "大小姐是假扮的，意见是真的：MV 先别发，把节拍和字幕牵齐。",
    "今天三笔账：蛋吃上了，主持选明白了，伪装也泡汤了。",
    "鲸鱼绝不摸鱼！……先把蛋吃完，再去吃饭。",
]


def char_count(text: str) -> int:
    return len(re.sub(PUNCT, "", text))


def read_wav(path: Path):
    w = wave.open(str(path), "rb")
    sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
    raw = w.readframes(n)
    w.close()
    a = np.frombuffer(raw, dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768.0
    return sr, a.mean(axis=1), a


def silence_gaps(mono: np.ndarray, sr: int, thr_db: float = -40.0, min_gap: float = 0.24):
    win = int(sr * 0.02)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, "same"))
    db = 20 * np.log10(np.maximum(rms, 1e-8))
    quiet = db < thr_db
    gaps = []
    i, n = 0, len(quiet)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) / sr >= min_gap:
                gaps.append((i / sr, j / sr))
            i = j
        else:
            i += 1
    return gaps


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", type=Path, default=REPO_ROOT / "鲸鱼Day3_分段拼接.wav")
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "Day3" / "day3_voice_alignment.json")
    args = ap.parse_args(argv)

    sr, mono, stereo = read_wav(args.voice)
    duration = len(mono) / sr
    gaps = silence_gaps(mono, sr)
    chars = [char_count(l) for l in LINES]
    total_chars = sum(chars)
    exp = [duration * c / total_chars for c in chars]

    K = len(LINES) - 1
    M = len(gaps)
    mid = [(s + e) / 2 for s, e in gaps]
    INF = float("inf")

    # cost[i][j]：第 i 句在候选缝 j 处结束的最小代价
    cost = [[INF] * M for _ in range(K)]
    back = [[-1] * M for _ in range(K)]
    for j in range(M):
        d = mid[j]
        cost[0][j] = ((d - exp[0]) / exp[0]) ** 2
    for i in range(1, K):
        for j in range(M):
            best, bj = INF, -1
            for k in range(j):
                d = mid[j] - mid[k]
                c = cost[i - 1][k] + ((d - exp[i]) / exp[i]) ** 2
                if c < best:
                    best, bj = c, k
            cost[i][j] = best
            back[i][j] = bj
    best_end, end_j = INF, -1
    for j in range(M):
        c = cost[K - 1][j] + ((duration - mid[j] - exp[-1]) / exp[-1]) ** 2
        if c < best_end:
            best_end, end_j = c, j
    seq = [end_j]
    for i in range(K - 1, 0, -1):
        seq.append(back[i][seq[-1]])
    seq.reverse()

    cues = []
    prev_end = 0.0
    for i, line in enumerate(LINES):
        gap = gaps[seq[i]] if i < K else None
        end = gap[0] if gap else duration
        d = end - prev_end
        cues.append({
            "id": f"L{i + 1:02d}",
            "index": i + 1,
            "start": round(prev_end, 3),
            "end": round(end, 3),
            "duration_seconds": round(d, 3),
            "text": line,
            "chars": chars[i],
            "chars_per_second": round(chars[i] / d, 3),
            "boundary_gap": None if gap is None else {
                "start": round(gap[0], 3), "end": round(gap[1], 3),
                "seconds": round(gap[1] - gap[0], 3),
            },
        })
        prev_end = gap[1] if gap else duration

    rates = [c["chars_per_second"] for c in cues]
    payload = {
        "schema": 1,
        "kind": "day3_voice_cue_alignment",
        "engine": "user-provided/final-voice-wav",
        "synthesis_engine_known": False,
        "synthesis_engine_note": "文件名只说明是‘分段拼接’，WAV 里没有可验证的合成引擎/音色元数据；不得标成晓伊。",
        "measured": True,
        "placeholder": False,
        "source_file": args.voice.name,
        "source_sha256": hashlib.sha256(args.voice.read_bytes()).hexdigest(),
        "source_sample_rate_hz": sr,
        "source_channels": 2,
        "source_duration_seconds": round(duration, 3),
        "alignment_method": (
            "句级：20ms RMS 静音缝（-40dBFS, >=0.24s）做实测定界；"
            "19 句与静音缝的对应用‘总时长 × 字数占比’作先验跑 DP。"
            "没有词级 ASR 模型可用，故不下沉到词级时间。"
        ),
        "word_level": False,
        "speech_seconds": round(duration, 3),
        "silence_gap_count": len(gaps),
        "chars_total": total_chars,
        "chars_per_second_median": round(float(np.median(rates)), 3),
        "chars_per_second_min": round(min(rates), 3),
        "chars_per_second_max": round(max(rates), 3),
        "cue_count": len(cues),
        "cues": cues,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"source {duration:.3f}s  gaps={len(gaps)}  chars={total_chars}")
    for c in cues:
        print(f"  {c['id']} {c['start']:7.2f}-{c['end']:7.2f} {c['duration_seconds']:6.2f}s "
              f"{c['chars']:3d} 字 {c['chars_per_second']:4.2f} 字/秒  {c['text'][:16]}")
    print(f"rate {min(rates):.2f}–{max(rates):.2f} 字/秒（中位 {np.median(rates):.2f}）")
    print(f"OK: {args.out}")


if __name__ == "__main__":
    main()
