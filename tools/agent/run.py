#!/usr/bin/env python3
"""魔丸 Agent 的用户入口。不后台抓取，不自动发布。

配置真实模型时设置：
  MOWAN_PROVIDER=openai
  MOWAN_API_BASE=https://你的兼容端点/v1
  MOWAN_API_KEY=从环境注入，不要写进文件
  MOWAN_MODEL=模型名

未设置 MOWAN_PROVIDER 时只返回 unconfigured，不会编一条假回复。
测试链路时才显式设置 MOWAN_PROVIDER=mock。
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(Path(__file__).resolve().parent)]

from runtime import run


def main(argv=None):
    parser = argparse.ArgumentParser(description="魔丸 Agent")
    parser.add_argument("--message", required=True, help="用户消息")
    parser.add_argument("--content-file", type=Path, help="可选，待分析的本地文件")
    parser.add_argument("--day", type=int, help="目标 Day 集数；自动模式下启用创作上下文")
    parser.add_argument("--mode", choices=("auto", "creative", "work", "support", "chat"), default="auto", help="可显式选择模式；支持/停止请求优先")
    parser.add_argument("--cancel", action="store_true")
    args = parser.parse_args(argv)
    content = ""
    if args.content_file:
        content = args.content_file.read_text(encoding="utf-8")
    result = run(ROOT, args.message, content=content, cancelled=args.cancel,
                 requested_mode=args.mode, day=args.day)
    public = {
        "ok": result["ok"],
        "code": result["code"],
        "agent_id": result["agent_id"],
        "persona_id": result["persona_id"],
        "memory_unchanged": result["memory_unchanged"],
        "memory_count": result["memory_count"],
    }
    if result["ok"]:
        public["reply"] = result["reply"]
        public["mode"] = result["mode"]
        public["interest"] = result["interest"]
        public["provider"] = result["provider"]
        public["model_configured"] = result["model_configured"]
        if "context_files" in result:
            public["target_day"] = result["target_day"]
            public["context_files"] = result["context_files"]
        if "context_warning" in result:
            public["context_warning"] = result["context_warning"]
    else:
        public["error"] = result["error"]
        if result.get("mode"):
            public["mode"] = result["mode"]
    json.dump(public, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
