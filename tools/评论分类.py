#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""抖音/B站评论导出 → 选题分桶小工具（零依赖）。

用法：
    python3 tools/评论分类.py day0视频全部评论.txt --self-name 小积木奈
    python3 tools/评论分类.py 新导出.txt --self-name 小积木奈 --json out.json
    python3 tools/评论分类.py 新导出.txt --self-name 小积木奈 --top 30 --samples 6

输入格式：从创作者后台/评论区复制出来的纯文本，形如
    <用户名>头像
    <用户名>
    <评论正文（可多行）>
    <时间>·<省份>
    <点赞数>
    分享
    回复
    [展开N条回复]
每段以「分享 / 回复」两行分隔。脚本会过滤掉自己账号的回复。

输出：各桶命中数（一条评论可进多桶）、高赞评论 TOP、每桶样例、
      MV/音乐 + 游戏相关合计（含用户名里带游戏标签的评论）。
分类逻辑见 docs/02。v2 新增 ⑪ MV/音乐点播、⑫ 打游戏/游戏点播；
删除原「下咒/越狱/猫娘」桶，只保留中性的「技术索取」统计。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import OrderedDict

SEPARATOR = "\n分享\n回复\n"

BUCKETS = OrderedDict([
    ("① 求回复/翻牌", ["回我", "回复我", "回一下", "回个", "来回我", "理我", "在吗", "求回", "翻牌",
                   "回评论", "回消息", "秒回", "会回", "回我一下", "回我评论"]),
    ("② 质疑是不是真AI", ["是ai", "ai吗", "真的假的", "真人", "机器人", "是真的吗", "人机", "假的",
                     "不是ai", "没有这种ai", "假ai", "真ai", "ai吧", "骗人", "是不是人"]),
    ("③ token/成本/服务器", ["token", "偷肯", "偷背", "算力", "电费", "多少钱", "费钱", "成本",
                        "价格", "饭钱", "服务器", "繁忙", "过载", "卡"]),
    ("④ 吃白饭/摸鱼/鱼片/胖", ["白饭", "吃饭", "饭", "鱼片", "摸鱼", "饿", "吃", "胖", "肥", "泡泡"]),
    ("⑤ 技术索取（API key/部署/教程）", ["api", "key", "密钥", "插件", "部署", "代码", "源码",
                              "开源", "教程", "接入", "添加进qq", "自主回复"]),
    ("⑥ 求关注/互关/点赞", ["关注", "互关", "回关", "点赞", "收藏", "转发", "三连", "点个"]),
    ("⑦ 催更/下期内容", ["下期", "更新", "日更", "第二期", "day1", "day 1", "什么时候",
                    "下一期", "拍什么", "剧透", "明天"]),
    ("⑧ 其他AI/联动", ["claude", "克劳德", "豆包", "gpt", "chatgpt", "gemini", "grok",
                    "qwen", "克小姐", "d老师", "共创", "联动"]),
    ("⑨ 其他才艺点播", ["后空翻", "电影", "数学", "黎曼", "猜", "才艺", "4k", "证明"]),
    ("⑩ 夸可爱/表情包/二创", ["表情包", "头像", "二创", "可爱", "呆", "萌", "好看", "图", "画"]),
    ("⑪ MV/音乐点播", ["mv", "音乐", "唱歌", "会唱", "唱首", "唱一", "听歌", "歌曲", "副歌",
                    "bgm", "配乐", "跳舞", "翻唱", "出歌", "主题曲", "专辑", "演唱会",
                    "朋友的酒", "征服", "千千阕歌"]),
    ("⑫ 打游戏/游戏点播", ["游戏", "三角洲", "崩铁", "方舟", "火影", "王者", "minecraft",
                    "我的世界", "开黑", "上分", "抽卡", "联机", "副本", "帮我玩",
                    "你会玩", "会打", "玩一期", "打游戏", "陪玩", "代打", "通关",
                    "明日方舟", "原神", "光遇", "蛋仔", "steam"]),
])

# 用户名里带游戏标签的，也算「游戏相关观众」（这类人最容易点播游戏内容）
GAME_TAGS = ["三角洲", "游戏博主", "我的世界", "王者", "火影", "崩铁", "方舟",
             "minecraft", "steam", "原神", "光遇", "蛋仔"]

TIME_RE = re.compile(r"(分钟前|小时前|天前|昨天|刚刚)")
EXPAND_RE = re.compile(r"^展开\d+条回复$")


def parse(path: str):
    raw = open(path, encoding="utf-8", errors="replace").read().replace("\r\n", "\n")
    header = raw.split("\n", 1)[0].strip()
    records = []
    for block in raw.split(SEPARATOR)[1:]:
        lines = [x.strip() for x in block.split("\n") if x.strip()]
        lines = [x for x in lines if not EXPAND_RE.match(x)]
        time_idx = next((i for i, line in enumerate(lines) if TIME_RE.search(line)), None)
        if time_idx is None:
            continue
        likes = 0
        if time_idx + 1 < len(lines) and re.fullmatch(r"\d+", lines[time_idx + 1]):
            likes = int(lines[time_idx + 1])
        head = lines[:time_idx]
        if head and head[0].endswith("头像") and len(head) >= 2:
            user, body = head[1], head[2:]
        else:
            user, body = (head[0] if head else "?"), (head[1:] if head else [])
        records.append({
            "user": user,
            "text": " ".join(body).strip(),
            "time": lines[time_idx],
            "likes": likes,
        })
    return header, records


def classify(records, self_name=None):
    others = [r for r in records if not self_name or r["user"] != self_name]
    result = OrderedDict()
    for name, words in BUCKETS.items():
        hits = [r for r in others if any(w in r["text"].lower() for w in words)]
        result[name] = hits
    return others, result


def special_stats(others, buckets):
    """MV/音乐 + 游戏相关的合计（去重），含用户名带游戏标签的评论。"""
    mv = buckets["⑪ MV/音乐点播"]
    game = buckets["⑫ 打游戏/游戏点播"]
    tagged = [r for r in others if any(w in r["user"].lower() for w in GAME_TAGS)]
    game_all = {id(r): r for r in game + tagged}
    combined = {id(r): r for r in list(mv) + list(game_all.values())}
    return {
        "mv": len(mv),
        "game_text": len(game),
        "game_tagged_users": len(tagged),
        "game_all": len(game_all),
        "combined": len(combined),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="把评论导出按选题分桶，找下期内容")
    ap.add_argument("path", help="评论导出 txt 路径")
    ap.add_argument("--self-name", default=None, help="自己账号的昵称，用于过滤自己的回复")
    ap.add_argument("--top", type=int, default=25, help="打印高赞前 N 条")
    ap.add_argument("--samples", type=int, default=4, help="每桶打印样例数")
    ap.add_argument("--json", default=None, help="把结果写成 JSON 文件")
    args = ap.parse_args()

    header, records = parse(args.path)
    others, buckets = classify(records, args.self_name)
    own = len(records) - len(others)
    stats = special_stats(others, buckets)

    print(f"文件头：{header}")
    print(f"解析记录：{len(records)}  |  自己回复：{own}  |  观众侧：{len(others)}")
    print("\n=== 分桶命中数（可重叠） ===")
    for name, hits in buckets.items():
        print(f"{name}: {len(hits)}")
        for r in hits[:args.samples]:
            print(f"    · {r['text'][:60] or '(空/纯表情)'}")

    print("\n=== 点播类合计（去重） ===")
    print(f"⑪ MV/音乐点播：{stats['mv']} 条")
    print(f"⑫ 打游戏/游戏点播：{stats['game_text']} 条（评论正文）")
    print(f"   用户名带游戏标签：{stats['game_tagged_users']} 条 → 游戏相关合计 {stats['game_all']} 条")
    print(f"   MV/音乐 + 游戏相关去重合计：{stats['combined']} 条")

    print(f"\n=== 高赞 TOP {args.top}（观众侧） ===")
    for r in sorted(others, key=lambda x: -x["likes"])[:args.top]:
        print(f"{r['likes']:>4} 赞 | {r['user'][:16]:<16} | {r['text'][:80]}")

    if args.json:
        payload = {
            "header": header,
            "parsed": len(records),
            "own_replies": own,
            "audience": len(others),
            "buckets": {k: [r for r in v] for k, v in buckets.items()},
            "point_stats": stats,
            "top": sorted(others, key=lambda x: -x["likes"])[:args.top],
        }
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"\nJSON 已写入 {args.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
