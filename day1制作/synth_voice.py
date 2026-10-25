#!/usr/bin/env python3
# day1_tools/synth_voice.py — Day1 晓伊批量合成入口（兼容包装）
# 实际合成、真实时长回读与 F0 检查全部走 say.py，避免出现第二套参数。
# 查找顺序: $SAY_PY > ~/tools/say.py > 本目录 say.py > ../ai-yunying/tools/say.py
# 固定规范: Microsoft Edge TTS / zh-CN-XiaoyiNeural / rate=+0% / pitch=+0Hz
# 产出: day1_audio/L01.mp3 .. L27.mp3 + day1_audio/tts_report.json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT_TXT = ROOT.parent / "ai-yunying" / "Day1配音台词.txt"
OUT = ROOT / "day1_audio"


def find_say_py() -> Path:
    candidates = []
    if os.environ.get("SAY_PY"):
        candidates.append(Path(os.environ["SAY_PY"]).expanduser())
    candidates += [
        Path.home() / "tools" / "say.py",
        Path(__file__).resolve().parent / "say.py",
        ROOT.parent / "ai-yunying" / "tools" / "say.py",
    ]
    for p in candidates:
        if p.is_file():
            return p
    raise SystemExit("找不到 say.py；请使用 ~/tools/say.py，或设置环境变量 SAY_PY。")


def main() -> int:
    if not SCRIPT_TXT.is_file():
        raise SystemExit(f"找不到配音稿: {SCRIPT_TXT}")
    lines = [x.strip() for x in SCRIPT_TXT.read_text(encoding="utf-8").splitlines() if x.strip()]
    if len(lines) != 27:
        raise SystemExit(f"Day1配音台词.txt 应为 27 条，实得 {len(lines)} 条")
    say = find_say_py()
    cmd = [sys.executable, str(say), "--batch", str(SCRIPT_TXT), "--outdir", str(OUT)]
    print("运行:", " ".join(cmd), flush=True)
    return subprocess.run(cmd).returncode


if __name__ == "__main__":
    raise SystemExit(main())
