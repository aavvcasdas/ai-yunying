#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""呆萌体检：写完文案先跑这个，不合格退回改稿。

用户 2026-10-27 定：台词要**超级呆萌**、节奏快、废话少，开头必须一眼留住人。
这个脚本不看主观感受，只量四件可复核的事：

  1. 第一句：≤ 15 字、不带从句、要有呆萌语气词或反问/悬念；
  2. 句子长度：每句 ≤ 15 字为主，> 18 字的句子超标就报警（就是「废话」）；
  3. 呆萌密度：语气词/口癖出现次数（诶、呜、呀、呢、哦、啦、嘛、嘿嘿、我了雷、行吧…）；
  4. 节奏：总字数 ÷ 语速（默认 4.3 字/秒）≈ 成片秒数，70 秒 ≈ 300 字。

再加两条硬黑名单：
  · 解释腔/AI 味（「社区里都算过」「首先」「综上」「值得注意的是」…）；
  · 违背事实口径的长数字解释（数字只留短句，考据放附录，不进口播）。

用法（读 md 里 ```text 代码块，或 --txt 纯台词文件）：
  python3 tools/剧本/呆萌体检.py --md Day4/Day4文案.md
  python3 tools/剧本/呆萌体检.py --md Day4/Day4文案.md --seconds 70
  python3 tools/剧本/呆萌体检.py --txt /tmp/taici.txt

门禁（退出码 1 = 不合格，必须改稿）：
  · 第一句 > 15 字 / 第一句无任何呆萌信号；
  · 长句（> 18 字）占比 > 12%；
  · 呆萌词覆盖率 < 30% 的句子；
  · 命中解释腔黑名单；
  · 总字数与设定秒数偏差 > 25%。

注意：这是**语气/节奏**门禁，不替代 `开场体检.py`（事件落地秒数、承诺链）。
两道门都要过：`呆萌体检.py` 管「怎么说」，`开场体检.py` 管「说什么/第几秒」。
这套「写稿 → 呆萌体检 → 不合格退回改 → 再体检 → 开场体检」就是写文案的 loop，
规则正文见 `agent.md` 第 16 条与 `00_运营总览/鲸鱼娘人设skill/references/cute_fast_script.md`。
"""
import argparse
import re
import sys

# 呆萌信号：语气词 + 口癖 + 反问/悬念 + 反差
CUTE_WORDS = [
    '诶', '呜', '呀', '呢', '哦', '啦', '嘛', '嘿嘿', '哼', '咕噜',
    '我了雷', '行吧', '才不是', '诶嘿', '哇', '啊', '嘛', '诶？',
]
CUTE_PATTERNS = [
    r'\?', r'？', r'……', r'就一秒', r'真的就', r'嘿嘿', r'哼',
    r'偷偷', r'委屈', r'想通', r'不哭', r'不怕', r'抱抱', r'一口',
]
# 解释腔 / AI 味 / 长篇铺垫 —— 出现即失败
# 注：单字「最后」易误伤口语叙事（如「最后一次他说」），不列入，改用「综上/综上所述」等书面连接词判定。
FILLER_BLACKLIST = [
    '社区里都算过', '首先', '其次', '综上', '总而言之', '综上所述',
    '值得注意的是', '众所周知', '大家可以看到', '接下来我给大家',
    '也就是说', '换句话说', '从某种意义上', '在这个基础上',
    '作为一个', '我无法', '根据您的', '希望这个', '大家一起',
    '差了八十多倍', '要一百多，差', '折合', '换算下来',
]
# 第一句禁止：招呼/前情/内部黑话（新观众 0 秒就走）
FIRST_BAN = [
    '大家好', '哈喽', '本鱼回来了', '本鲸回来了', '先统计', '先复盘',
    '复盘', '结算', '汇报', '上一集', '昨天那集', '更新一下', 'Day',
    'token', 'Claude', '大肥鱼', '账本', '播放', '跳出率',
]


def load_text(md=None, txt=None):
    if txt:
        return open(txt, encoding='utf-8').read()
    s = open(md, encoding='utf-8').read()
    # 取「逐字口播稿」小节后的第一个 ```text 代码块
    m = re.search(r'##\s*四、逐字口播稿.*?```(?:text)?\n(.*?)\n```', s, re.S)
    if not m:
        m = re.search(r'```(?:text)?\n(.*?)\n```', s, re.S)
    if not m:
        sys.exit(f'没在 {md} 里找到 ```text 口播稿代码块')
    return m.group(1)


def split_lines(raw):
    out = []
    for ln in raw.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith('#'):
            continue
        # 一行可能有多句，按句末标点切（省略号是句中气口，不切分，避免把「……」拆成多个假短句）
        for seg in re.split(r'(?<=[。！？!?])', ln):
            seg = seg.strip()
            if seg:
                out.append(seg)
    # 全篇第一声若是短语气词疑问（「诶？」「呜……」等 ≤3 字），并入第二句，
    # 否则「诶？」会被当成第一句，导致开头判定失真。
    if len(out) >= 2:
        first = out[0]
        core = re.sub(r'[。！？!?…\s]', '', first)
        if len(core) <= 3 and first.endswith(('？', '?', '！', '!', '…')):
            out[1] = first + out[1]
            del out[0]
    return out


def han_len(s):
    return len(re.sub(r'[^\u4e00-\u9fff]', '', s))


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--md', help='含 ```text 口播稿的 md 文件')
    g.add_argument('--txt', help='纯台词 txt 文件')
    ap.add_argument('--seconds', type=float, default=70.0, help='预计成片秒数（默认 70）')
    ap.add_argument('--rate', type=float, default=4.3, help='语速 字/秒（默认 4.3，呆萌快节奏）')
    a = ap.parse_args()

    raw = load_text(a.md, a.txt)
    lines = split_lines(raw)
    if not lines:
        sys.exit('没有读到台词')

    total = sum(han_len(x) for x in lines)
    lens = [han_len(x) for x in lines]
    long_lines = [(i + 1, l, x) for i, (l, x) in enumerate(zip(lens, lines)) if l > 18]
    first = lines[0]
    first_len = han_len(first)

    # 呆萌覆盖：整句里出现语气词/口癖/反问即算「有萌点」
    cute_hits = []
    for i, x in enumerate(lines):
        hit = any(w in x for w in CUTE_WORDS) or any(re.search(p, x) for p in CUTE_PATTERNS)
        cute_hits.append(hit)
    cute_ratio = sum(cute_hits) / len(lines)

    first_cute = (any(w in first for w in CUTE_WORDS)
                  or any(re.search(p, first) for p in CUTE_PATTERNS))
    first_ban = [w for w in FIRST_BAN if w in first]
    fillers = sorted({w for w in FILLER_BLACKLIST for x in lines if w in x})

    est_sec = total / a.rate
    dev = abs(est_sec - a.seconds) / a.seconds

    print(f'呆萌体检 · {a.md or a.txt}')
    print(f'  共 {len(lines)} 句 / {total} 字；按 {a.rate:g} 字/秒 ≈ {est_sec:.1f}s（目标 {a.seconds:g}s）')
    print(f'  第一句（{first_len} 字）：{first}')
    print(f'  句长：最短 {min(lens)} / 最长 {max(lens)} / 均值 {sum(lens)/len(lines):.1f} 字')
    print(f'  >18 字长句：{len(long_lines)} 句（{len(long_lines)/len(lines)*100:.0f}%）')
    print(f'  呆萌覆盖率：{cute_ratio*100:.0f}% 的句子有语气词/口癖/反问')
    print(f'  第一句呆萌信号：{"有" if first_cute else "无"}；第一句黑话/招呼命中：{first_ban or "无"}')
    print(f'  解释腔黑名单命中：{fillers or "无"}')
    print()
    for i, l, x in long_lines[:6]:
        print(f'  ⚠ 长句 L{i}（{l} 字）：{x}')
    print()

    bad = []
    if first_len > 15:
        bad.append(f'第一句 {first_len} 字 > 15 字，太长，不呆萌')
    if not first_cute:
        bad.append('第一句没有呆萌信号（语气词/反问/反差），留不住人')
    if first_ban:
        bad.append(f'第一句有招呼/前情/内部黑话：{first_ban}')
    if len(long_lines) / len(lines) > 0.12:
        bad.append(f'>18 字长句占 {len(long_lines)/len(lines)*100:.0f}%（>12%），废话太多')
    if fillers:
        bad.append(f'命中解释腔黑名单：{fillers}')
    if cute_ratio < 0.30:
        bad.append(f'呆萌覆盖率 {cute_ratio*100:.0f}% < 30%，台词太干')
    if dev > 0.25:
        bad.append(f'字数与秒数偏差 {dev*100:.0f}%（>25%）：{"太多字，要删" if est_sec > a.seconds else "太少字，要补"}')

    if bad:
        print('不合格，按「呆萌快节奏」规则改稿：')
        for b in bad:
            print('  -', b)
        return 1
    print('通过。再跑一遍 `开场体检.py` 查事件秒数/承诺链，两道门都过才算定稿。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
