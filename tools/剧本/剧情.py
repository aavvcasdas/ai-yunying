#!/usr/bin/env python3
"""检查连载口播的可识别问题；语义承接、人设与来源仍须人工复检。

Day12 有用户指定的事件链；其他集不强制“找朋友 / 求职梗”模板。
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
FRIEND_ACTION = re.compile(r"(?:找|请|邀|叫|拉).{0,8}(?:朋友|帮手|外援)")
GUEST_ENTRY = re.compile(r"来(?:了|到|帮)|进门|走进|入场|到场|加入|出现|接话|开口")


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
    """提取原句片段供人工检查；没命中也可能是同义改写。"""
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


def first_index(lines, pred, start=0):
    for index in range(start, len(lines)):
        if pred(lines[index]):
            return index
    return None


def _day12_checks(curr, guest):
    """检查用户指定的 Day12 事件链，允许前集事实提前出现。"""
    errors = []
    if guest and guest != "豆包":
        errors.append("Day12 的当日客人应是豆包")
    friend_at = first_index(curr, lambda line: bool(FRIEND_ACTION.search(line)))
    opening = "\n".join(curr[:4])
    if friend_at is None or friend_at > 2 or not re.search(r"帮|分担|搭把手|外援", opening):
        errors.append("Day12 开头未识别到找新朋友来帮忙")
    guest_at = first_index(curr, lambda line: "豆包" in line, friend_at or 0)
    if guest_at is None or guest_at > 5:
        errors.append("Day12 须在找帮手后尽早点出豆包")
    start = guest_at if guest_at is not None else 0
    meme_at = first_index(curr, lambda line: bool(re.search(r"找不到工作|找工作|求职", line)), start)
    if meme_at is None:
        errors.append("Day12 未识别到与豆包相关的求职梗")
    meme_start = meme_at if meme_at is not None else start
    passport_at = first_index(curr, lambda line: "护照" in line, meme_start)
    passport_zone = curr[meme_start:passport_at + 1] if passport_at is not None else []
    if passport_at is None or not any("山姆" in line for line in passport_zone):
        errors.append("Day12 求职梗之后未识别到山姆护照跑偏")
    if passport_at is not None:
        correction_at = first_index(
            curr,
            lambda line: bool(re.search(r"本鲸.{0,10}(?:筛|挑)|没让.{0,8}(?:办证|办护照)|不是.{0,5}逛|跑偏|对题", line)),
            passport_at + 1,
        )
        if correction_at is None:
            errors.append("Day12 护照跑偏后未识别到本鲸纠偏")
        apology_at = first_index(
            curr, lambda line: bool(re.search(r"认错|对不起|抱歉|我错了", line)),
            correction_at + 1 if correction_at is not None else passport_at + 1,
        )
        if apology_at is None:
            errors.append("Day12 纠偏后未识别到豆包认错")
        if apology_at is not None:
            work_at = first_index(
                curr, lambda line: bool(re.search(r"划掉|标出|分到|放左|放右|圈了起来|筛掉|筛出来|筛好了", line)),
                apology_at,
            )
            if work_at is None:
                errors.append("Day12 认错后未识别到继续筛岗位")
    if not any("可能" in line for line in curr):
        errors.append("Day12 缺少老大可能换工作的事实边界")
    opening = "\n".join(curr[:6])
    if re.search(r"(?:来晚了|迟到了)", opening) and re.search(r"对不起.{0,6}(?:写上|写好|写了)", opening):
        errors.append("Day12 不使用无来源的来晚了、先写道歉作为开场原因")
    return errors


def _other_guest_entries(curr, guest):
    """只把明显的入场动作判作另一位客人；历史提及留给人工核对。"""
    found = []
    for name in GUESTS:
        if guest and name.lower() == guest.lower():
            continue
        for line in curr:
            if name.lower() not in line.lower() or not GUEST_ENTRY.search(line):
                continue
            if any(mark in line for mark in ("昨天", "上一集", "上集", "明天", "下一集", "下集")):
                continue
            found.append(name)
            break
    return found


def check(curr, prev, guest=None, day=None):
    """返回 (errors, notes)。可识别规则不代替对剧情语义的判断。"""
    if not curr or not prev:
        raise ValueError("上一集和本集都不能是空稿")
    errors = []
    tail = clauses(prev[-12:])
    head = clauses(prev[:6])
    full = "\n".join(curr)
    tail_hit = hits(full, tail)
    head_hit = hits(full, head)

    if any(re.match(r"(?i)^\s*[（(]?(?:待填|待补|TODO|TBD)(?:[：:，。)）]|\s|$)", line) for line in curr):
        errors.append("口播仍含待填模板，不能作为已完成剧本")
    if day == 12:
        errors.extend(_day12_checks(curr, guest))
    expected_guest = guest or ("豆包" if day == 12 else None)
    if expected_guest and expected_guest.lower() not in full.lower():
        errors.append(f"指定的当日客人没有出现：{expected_guest}")
    others = _other_guest_entries(curr, expected_guest)
    if expected_guest and others:
        errors.append("一天最多一位当日客人；疑似同时上场：" + "、".join([expected_guest] + others))
    elif not expected_guest and len(others) > 1:
        errors.append("一天最多一位当日客人；疑似同时上场：" + "、".join(others))

    errors.extend(text_redlines(curr))
    banned = sorted({word for word in BAN_WORDS for line in curr if word in line})
    if banned:
        errors.append("命中过审黑名单：" + "、".join(banned))
    tailed = [line for line in curr if ends_with_particle(line)]
    if tailed:
        errors.append("句尾语气词：" + " / ".join(tailed[:4]))
    for index, line in enumerate(curr, 1):
        if re.search(r"笨鱼[说问答道叫喊]", line) or re.search(r"笨鱼\s*[：:]", line):
            errors.append(f"L{index} 笨鱼不新增对白")
        if re.search(r"(?:我是|我叫|本鲸是)魔丸|魔丸(?:说|来了|进门)", line):
            errors.append(f"L{index} 魔丸不能成为镜头内人物或自称")
    if day == 12 and re.search(r"老大(?:已经|肯定|一定)(?:换了?|找到|决定换)(?:新)?工作", full):
        errors.append("Day12 把老大可能换工作写成了确定事实")

    longest = max(han_len(line) for line in curr)
    overlap = "、".join(dict.fromkeys(head_hit + tail_hit))
    notes = [
        "上一集开头：" + "、".join(head[:6]),
        "上一集结尾：" + "、".join(tail[:8]),
        "本集命中的前集原句：" + (overlap or "无；可能是同义改写，须人工确认具体承接"),
        "客人名字和入场识别不完整；角色、人设、因果、来源及退出状态须人工复检。",
        f"最长句{longest}字。句长门禁不启用：{'/'.join(str(n) for n in RETIRED_LENGTH_GATES)}",
    ]
    return errors, notes


def day_from_path(path):
    """标准 DayN 目录或文件名可识别目标集数；非标准路径请显式传 --day。"""
    for part in reversed(Path(path).parts):
        match = re.match(r"(?i)^day([0-9]+)(?:$|[^0-9])", part)
        if match:
            return int(match.group(1))
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="检查连载口播可识别的问题，不按字数退稿")
    ap.add_argument("--prev", required=True, help="上一集锁定口播")
    ap.add_argument("--txt", help="本集口播。和 --card 一起用时先印承接，再检查")
    ap.add_argument("--day", type=int, help="目标集数；不指定时尝试从 --txt 标准路径识别")
    ap.add_argument("--guest", help="今天唯一的客人；没有客人可省略")
    ap.add_argument("--card", action="store_true", help="只印上一集的原句供人工承接，不判本集")
    args = ap.parse_args(argv)
    if args.day is not None and args.day < 1:
        ap.error("--day 必须是正整数")
    prev = load_lines(args.prev)
    if args.card and not args.txt:
        head = clauses(prev[:6])
        tail = clauses(prev[-12:])
        print("剧情承接卡")
        print("上一集开头：" + "、".join(head[:6]))
        print("上一集结尾：" + "、".join(tail[:8]))
        print("先读 agent.md，确定未完成的事、当集行动和退出状态；不强制复述原句。")
        print("句长门禁不启用。")
        return 0
    if not args.txt:
        ap.error("检查本集时必须给 --txt")
    curr = load_lines(args.txt)
    day = args.day if args.day is not None else day_from_path(args.txt)
    errors, notes = check(curr, prev, args.guest, day)
    print(f"剧情承接 · {args.txt}")
    for note in notes:
        print("  " + note)
    print()
    if errors:
        print("发现可识别问题（剧情和来源仍须人工复检）：")
        for item in errors:
            print("  - " + item)
        return 1
    print("可识别检查通过；不能代替人工复检。没有用句长退稿。")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError) as exc:
        sys.exit(f"不合格：{exc}")
