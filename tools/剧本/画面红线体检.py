#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""画面红线体检：扫渲染器，抓「粉丝数 / 目标值 / 进度条」这类不许再出现的东西。

红线见 `00_运营总览/画面红线_不要出现的东西_2026-10-29.md`：
  · 画面不写粉丝数、播放量、目标值（`2,108 / 10,000` 这种）；
  · 不画进度条 / 音量条 / 加载条 / 数据曲线 / 账本表；
  · 口播不念阿拉伯数字。

用法：
  python3 tools/剧本/画面红线体检.py            # 有违规 → 退出码 1
  python3 tools/剧本/画面红线体检.py -v         # 连历史留档也列出来
  python3 tools/剧本/画面红线体检.py --file Day5/xxx.mjs

设计原则：**宁可误报，不可漏报**（误报看两眼就能判，漏报会进成片）。
历史留档（Day1–Day4 已交付）只提示不判违规，但清单照样打出来。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

# 只扫「会被拿来出片/出封面」的脚本
TARGETS = [
    *sorted(REPO.glob("tools/day*/**/render_*.mjs")),
    *sorted(REPO.glob("tools/day*/**/make_*cover*.mjs")),
    *sorted(REPO.glob("tools/day*/**/*cover*.mjs")),
]
TARGETS = sorted({p for p in TARGETS if p.is_file()})

# 已交付、不重渲的历史片子：提示，不判违规
LEGACY = re.compile(r"day([1-4](加更)?)制作")

CHECKS = [
    # (名字, 正则, 说明)
    ("粉丝数/目标值", re.compile(r"粉丝\s*[\"']?\s*[,:]?\s*[\d,]+\s*/\s*[\d,]{3,}"),
     "卡片上写了「粉丝 X / Y」：删掉数字和目标值，只留天数与明天的钩子"),
    ("目标值", re.compile(r"[\d,]{3,}\s*/\s*[\d,]{4,}"),
     "出现了 `X / 10,000` 这种目标写法：观众不关心，删"),
    ("粉丝行", re.compile(r"fillText\(\s*['\"]粉丝['\"]"),
     "画面里有「粉丝」字样：整行删掉"),
    ("进度条函数", re.compile(r"progressBar|fanBar|targetCard|ledgerCard|chartCard", re.I),
     "进度条/目标卡/账本卡：这类组件一律不要，组件本身删掉"),
    ("进度条绘制", re.compile(r"/\*\s*进度|进度条绘制|barFill|fillBar", re.I),
     "进度条绘制痕迹：删"),
    ("音量条", re.compile(r"音量条|volumeBar|volBar", re.I),
     "音量条：电视里外都不许有"),
    ("目标卡文案", re.compile(r"月度目标|月目标|新增粉丝"),
     "目标卡文案：删"),
    ("片尾卡", re.compile(r"shotEndCard|ENDCARD|本鯨的 30 天|本鲸的 30 天|非官方同人"),
     "片尾卡整张都不做：最后一句说完就结束（见 00_运营总览/画面红线_…_2026-10-29.md 第二节）"),
]

# 口播数字：只查 LINES 里汉字句中的阿拉伯数字（字幕/卡片里的秒数不算）
LINES_BLOCK = re.compile(r"const LINES = \[(.*?)\n\];", re.S)
ARABIC = re.compile(r"[\u4e00-\u9fff][0-9]|[0-9][\u4e00-\u9fff]")


def scan_file(path: Path) -> list[tuple[str, int, str, str]]:
    out = []
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    for name, rx, hint in CHECKS:
        for i, ln in enumerate(lines, 1):
            code = ln.lstrip()
            if code.startswith(("//", "/*", "*")):
                continue                       # 注释里写「不许画进度条」不算违规
            if rx.search(ln):
                out.append((name, i, ln.strip()[:120], hint))
    m = LINES_BLOCK.search(text)
    if m:
        head_line = text[: m.start()].count("\n") + 1
        for k, ln in enumerate(m.group(1).splitlines()):
            if ARABIC.search(ln):
                out.append(("口播数字", head_line + k + 1, ln.strip()[:120],
                            "口播不许念数字：换成「一大堆」这种口语量词"))
    return out


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", type=Path, action="append", help="只查这些文件")
    ap.add_argument("-v", "--verbose", action="store_true", help="连历史留档的提示也打出来")
    args = ap.parse_args(argv)

    targets = [Path(f) for f in args.file] if args.file else TARGETS
    if not targets:
        print("没找到要查的渲染器（tools/day*/**/render_*.mjs）")
        return

    hard, legacy = [], []
    for p in targets:
        rel = p.relative_to(REPO)
        hits = scan_file(p)
        if not hits:
            continue
        bucket = legacy if LEGACY.search(str(rel)) else hard
        bucket.append((rel, hits))

    print(f"画面红线体检：扫了 {len(targets)} 个脚本\n")
    if hard:
        print("✗ 违规（新片一律不许有）：")
        for rel, hits in hard:
            print(f"\n  {rel}")
            for name, i, ln, hint in hits:
                print(f"    L{i}  [{name}] {ln}")
                print(f"          → {hint}")
    if legacy and (args.verbose or True):
        print("\n· 历史留档（Day2–Day4 已交付，不重渲、不算违规）：")
        for rel, hits in legacy:
            names = sorted({h[0] for h in hits})
            print(f"  {rel}  →  {', '.join(names)}（{len(hits)} 处）")
    if not hard:
        print("\n结论：没有新的违规 ✓")
    else:
        print("\n结论：有违规 ✗ —— 改完再出片")
    sys.exit(1 if hard else 0)


if __name__ == "__main__":
    main()
