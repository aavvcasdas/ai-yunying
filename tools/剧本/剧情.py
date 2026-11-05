#!/usr/bin/env python3
"""剧情三拍。

先读 agent.md。开头说找新朋友来帮忙，接着把求职梗说成人话，再接上一集留在桌上的事。
不设句长门禁。12、15、18、20、25、201 这些数字不再用来退稿。
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rules_config import BAN_WORDS, text_redlines

# 只作说明。代码不拿这些数字判失败。
RETIRED_LENGTH_GATES = (12, 15, 18, 20, 25, 201)
GUESTS = ("豆包", "大小姐", "千问", "Kimi", "Gemini", "智谱", "Grok", "龙娘")
PARTICLES = set("呀啦吧嘛诶呜呢哦哇啊哼嘿")
GENERIC = {"本鲸能闲着", "也帮着留意", "这份力", "换它出", "它懂"}
FOLLOW_LINES = 24
JOB_MEME_MARKS = ("录取信", "没经验", "没有身份证", "简历", "面试", "豆包味")


def load_lines(path):
    lines = []
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#"):
            lines.append(line)
    if not lines:
        raise ValueError(f"没有台词：{path}")
    return lines


def clauses(lines):
    """标点切开的原句片段。承接要能对上这些字，不是只写「昨天」。"""
    found = []
    seen = set()
    for line in lines:
        for part in re.split(r"[，。！？、；：\s]+", line):
            part = part.strip("「」“”『』")
            han = re.sub(r"[^\u4e00-\u9fff]", "", part)
            if len(han) < 3 or han in GENERIC or han in seen:
                continue
            seen.add(han)
            found.append(han)
    return found


def hits(text, items):
    return [item for item in items if item and item in text]


def ends_with_particle(line):
    core = re.sub(r"[。！？!?…\s]", "", line)
    return bool(core) and core[-1] in PARTICLES


def han_len(line):
    return len(re.sub(r"[^\u4e00-\u9fff]", "", line))


def first_index(lines, pred):
    for index, line in enumerate(lines):
        if pred(line):
            return index
    return None


def check(curr, prev, guest=None):
    """返回 (errors, notes)。三拍按顺序。不检查句长。"""
    if not curr or not prev:
        raise ValueError("上一集和本集都不能是空稿")
    errors = []
    tail = clauses(prev[-12:])
    head = clauses(prev[:6])
    full = "\n".join(curr)
    opening = "\n".join(curr[:4])
    friend_at = first_index(curr, lambda line: "找新朋友" in line)
    if friend_at is None or friend_at > 2 or "帮忙" not in opening:
        errors.append("开头没有说找新朋友来帮忙")
    if "大肥鱼" not in opening and "本鲸" not in opening:
        errors.append("开头没有这条大肥鱼。人设没进嘴")
    if "不收" not in full:
        errors.append("没有她的判断。移植过来的脾气没进嘴")
    story_marks = tail + head
    story_at = first_index(curr, lambda line: hits(line, story_marks))
    meme_zone = curr[(friend_at + 1 if friend_at is not None else 0):story_at]
    meme_at = first_index(meme_zone, lambda line: any(mark in line for mark in JOB_MEME_MARKS))
    if meme_at is None:
        errors.append("找完朋友之后、接上旧剧情之前，没有说成人话的求职梗")
    else:
        meme_at += friend_at + 1 if friend_at is not None else 0
    present = [name for name in GUESTS if name in full]
    if len(present) > 1:
        errors.append("一天只接一个客人，口播里同时出现：" + "、".join(present))
    if guest and guest not in GUESTS:
        errors.append(f"不认识的客人：{guest}")
    elif guest:
        guest_zone = "\n".join(curr[friend_at:story_at] if friend_at is not None else [])
        if guest not in guest_zone:
            errors.append(f"{guest}要出现在找朋友和求职梗里，不要埋到旧剧情后面")
    follow_from = (meme_at + 1) if meme_at is not None else len(curr)
    follow = "\n".join(curr[follow_from:follow_from + FOLLOW_LINES])
    tail_hit = hits(follow, tail)
    head_hit = hits(follow, head)
    if len(tail_hit) < 2:
        show = "、".join(tail_hit) if tail_hit else "无"
        errors.append(
            "求职梗之后，没有接上一日结尾留在桌上的事。"
            f"命中：{show}。可接：{'、'.join(tail[:8]) or '无'}"
        )
    if not head_hit:
        errors.append(
            "求职梗之后，没有接上一日开头没做完的事。"
            f"可接：{'、'.join(head[:6]) or '无'}"
        )
    errors.extend(text_redlines(curr))
    banned = sorted({word for word in BAN_WORDS for line in curr if word in line})
    if banned:
        errors.append("命中过审黑名单：" + "、".join(banned))
    tailed = [line for line in curr if ends_with_particle(line)]
    if tailed:
        errors.append("句尾语气词：" + " / ".join(tailed[:4]))
    for index, line in enumerate(curr, 1):
        if re.search(r"笨鱼[说问答道叫喊]", line) or "笨鱼：「" in line or "笨鱼:" in line:
            errors.append(f"L{index} 笨鱼不新增对白")
    longest = max(han_len(line) for line in curr)
    notes = [
        "上一集开头还没做完：" + "、".join(head[:6]),
        "上一集结尾留在桌上：" + "、".join(tail[:8]),
        "求职梗之后接上：" + ("、".join(dict.fromkeys(head_hit + tail_hit)) or "无"),
        f"最长句{longest}字。句长门禁不启用：{'/'.join(str(n) for n in RETIRED_LENGTH_GATES)}",
    ]
    return errors, notes


def main(argv=None):
    ap = argparse.ArgumentParser(description="检查新集是否接上一日，不按字数退稿")
    ap.add_argument("--prev", required=True, help="上一集锁定口播")
    ap.add_argument("--txt", help="本集口播。和 --card 一起用时先印承接，再检查")
    ap.add_argument("--guest", help="今天只允许这一位客人")
    ap.add_argument("--card", action="store_true", help="只印上一集留在桌上的原句，不判本集")
    args = ap.parse_args(argv)
    prev = load_lines(args.prev)
    if args.card and not args.txt:
        head = clauses(prev[:6])
        tail = clauses(prev[-12:])
        print("剧情承接卡")
        print("开头没做完：" + "、".join(head[:6]))
        print("结尾留在桌上：" + "、".join(tail[:8]))
        print("三拍：找新朋友来帮忙，再写求职梗，再接这些事。先读 agent.md。")
        print("句长门禁不启用。")
        return 0
    if not args.txt:
        ap.error("检查本集时必须给 --txt")
    curr = load_lines(args.txt)
    errors, notes = check(curr, prev, args.guest)
    print(f"剧情承接 · {args.txt}")
    for note in notes:
        print("  " + note)
    print()
    if errors:
        print("不合格。缺的是承接，不是字数：")
        for item in errors:
            print("  - " + item)
        return 1
    print("通过。没有用句长退稿。")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError) as exc:
        sys.exit(f"不合格：{exc}")
