#!/usr/bin/env python3
# day1_tools/synth_voice.py — 晓伊配音合成(需能访问微软语音服务的网络环境)
# 规范(写死, 不改): Microsoft Edge TTS / zh-CN-XiaoyiNeural / rate=+0% / pitch=+0Hz
# 用法: 在 video-fx 根目录执行  python3 day1_tools/synth_voice.py
# 产出: day1_audio/L01.mp3 .. L21.mp3 ; 之后依次运行:
#        python3 day1_tools/gen_all.py && node render_day1.mjs
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT_TXT = os.path.join(ROOT, "..", "ai-yunying", "Day1配音台词.txt")
OUT = os.path.join(ROOT, "day1_audio")
VOICE, RATE, PITCH = "zh-CN-XiaoyiNeural", "+0%", "+0Hz"

def main():
    os.makedirs(OUT, exist_ok=True)
    lines = [l.strip() for l in open(SCRIPT_TXT, encoding="utf-8") if l.strip()]
    assert len(lines) == 21, f"应为 21 条, 实得 {len(lines)}"
    for i, line in enumerate(lines, 1):
        dst = os.path.join(OUT, f"L{i:02d}.mp3")
        print(f"L{i:02d} {line}")
        r = subprocess.run([sys.executable, "-m", "edge_tts", "--voice", VOICE,
                            f"--rate={RATE}", f"--pitch={PITCH}",
                            "--text", line, "--write-media", dst],
                           capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(dst) or os.path.getsize(dst) < 1000:
            print(r.stdout[-500:], r.stderr[-500:])
            sys.exit(f"L{i:02d} 合成失败(多半是网络无法直连 speech.platform.bing.com)")
    print("21 条全部完成。下一步: python3 day1_tools/gen_all.py && node render_day1.mjs")

if __name__ == "__main__":
    main()
