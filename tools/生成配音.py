#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""统一配音生成器：微软 Edge TTS · zh-CN-XiaoyiNeural（晓伊），rate/pitch 不加任何偏移。

规范见 config/tts.json 与 docs/06_出片工具链与配音规范.md。

用法：
    pip install edge-tts
    python3 tools/生成配音.py --print-config
    python3 tools/生成配音.py --text-file day1_配音稿.txt --output audio/day1.mp3
    python3 tools/生成配音.py --text "大家好，我是鲸鱼娘" --output audio/demo.mp3

注意：脚本永远不向 Edge TTS 传 --rate / --pitch，保证零偏移。
若 config/tts.json 被人改成非零偏移，脚本会直接报错拒绝出声。
需要访问微软 Edge TTS 服务，请在能联网的本机运行。
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config" / "tts.json"


def load_config() -> dict:
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    if cfg.get("voice") != "zh-CN-XiaoyiNeural":
        raise SystemExit(f"配音规范被改动：voice 必须是 zh-CN-XiaoyiNeural，当前为 {cfg.get('voice')!r}")
    if cfg.get("rate_offset") not in (None, "+0%", "0%", "") or cfg.get("pitch_offset") not in (None, "+0Hz", "0Hz", ""):
        raise SystemExit("配音规范被改动：rate/pitch 必须为 +0% / +0Hz（不加偏移）")
    if cfg.get("rate_offset_applied") or cfg.get("pitch_offset_applied"):
        raise SystemExit("配音规范被改动：禁止启用 rate/pitch 偏移")
    return cfg


def synthesize(text: str, voice: str, output: Path) -> None:
    """只传 text 与 voice；绝不传 rate / pitch / volume。"""
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        import edge_tts  # type: ignore
    except ImportError:
        # 回退到 edge-tts 命令行，同样不传 --rate / --pitch
        tmp = output.with_suffix(".txt")
        tmp.write_text(text, encoding="utf-8")
        try:
            subprocess.run(
                ["edge-tts", "--voice", voice, "--file", str(tmp), "--write-media", str(output)],
                check=True,
            )
        except FileNotFoundError:
            raise SystemExit("未找到 edge-tts，请先运行：pip install edge-tts")
        except subprocess.CalledProcessError as e:
            raise SystemExit(f"edge-tts 合成失败（通常需要联网访问微软服务）：{e}")
        finally:
            tmp.unlink(missing_ok=True)
        return

    import asyncio

    async def _run() -> None:
        # 关键：Communicate 只接收 text 与 voice，不带 rate / pitch 参数
        comm = edge_tts.Communicate(text, voice)
        await comm.save(str(output))

    try:
        asyncio.run(_run())
    except Exception as e:  # noqa: BLE001 - 网络/服务错误需要给出可读提示
        raise SystemExit(f"edge-tts 合成失败（请检查网络与微软服务可用性）：{e}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Edge TTS 统一配音（晓伊，零偏移）")
    ap.add_argument("--text-file", help="纯文本口播稿路径（UTF-8）")
    ap.add_argument("--text", help="直接给出口播文本（与 --text-file 二选一）")
    ap.add_argument("--output", default="audio/output.mp3", help="输出 mp3 路径")
    ap.add_argument("--print-config", action="store_true", help="只打印当前配音规范")
    args = ap.parse_args()

    cfg = load_config()
    if args.print_config or not (args.text_file or args.text):
        print(json.dumps({
            "voice": cfg["voice"],
            "voice_display_name": cfg["voice_display_name"],
            "rate": "未传（等价 +0%）",
            "pitch": "未传（等价 +0Hz）",
            "engine": cfg["engine"],
            "config": str(CONFIG.relative_to(ROOT)),
        }, ensure_ascii=False, indent=2))
        return 0

    if args.text_file and args.text:
        raise SystemExit("--text-file 与 --text 只能选一个")
    text = Path(args.text_file).read_text(encoding="utf-8") if args.text_file else args.text
    if not text.strip():
        raise SystemExit("口播文本为空")

    out = Path(args.output)
    if not out.is_absolute():
        out = ROOT / out
    print(f"配音：{cfg['voice']}（{cfg['voice_display_name']}） | rate/pitch：零偏移 | 字数：{len(text.strip())}")
    synthesize(text, cfg["voice"], out)
    print(f"已写出：{out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
