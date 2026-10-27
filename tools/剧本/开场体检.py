#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""开场体检：把「这一集的事件落在第几秒」量出来。

为什么要有这个：账号最近三条 2 秒跳出率 40%+，复盘时最容易吵的就是
「我觉得开头还行」。这个脚本不看主观感受，只读**实测过的 cue 时间**，
把前 N 秒逐句摊开，标出：哪几句是招呼/前情，第一句真正的「事件」在第几秒。

数据从哪来（必须是有实测时间的文件，不许按字数估）：
  · Day3：Day3/day3_voice_alignment.json（Vosk 词时 + 5ms RMS 边界）
  · Day1/Day2：tools/day1制作/最终配音对齐验收表.md、tools/day2制作/Day2指定配音对齐验收表.md
  · 加更：tools/day2加更制作/video-fx源码快照/day2_bonus_timing_piper_measured.js（Piper 占位，仅参考）

用法：
  python3 tools/剧本/开场体检.py --json Day3/day3_voice_alignment.json
  python3 tools/剧本/开场体检.py --md tools/day2制作/Day2指定配音对齐验收表.md
  python3 tools/剧本/开场体检.py --json X.json --event-cue L03 --window 20

门禁（退出码 1 = 不合格，建议改稿再录）：
  1. 事件落地 > 5.0s；
  2. 前 5 秒命中招呼/前情黑名单；
  3. 结尾没有「下一个承诺」（下一集/明天/关注/评论区征集/投票 之类）。

注意：事件位置是**半自动**判的。--event-cue 手动指定永远优先；
没指定时只按黑名单粗筛，输出里会标「自动」，结论要人再确认一遍。
"""
import argparse
import json
import re
import sys

# 招呼 / 前情 / 结算类开场词：这些句子对**没看过前几集的人**是零信息
OPENER_BLACKLIST = [
    '大家好', '哈喽', '本鱼回来了', '本鲸回来了', '又见面',
    '先统计', '先复盘', '复盘', '结算', '汇报', '上一集', '昨天那集',
    '更新一下', '说个事', '今天给大家', '先说一下',
]
# 承诺 / 追更信号：结尾出现这些，观众才有理由看下一集
PROMISE_WORDS = [
    '明天', '下一集', '下期', '关注', '评论区', '留言', '投票', '点菜',
    '帮我选', '你们说', '听你们的', '接着', '未完',
]
# 事件感：出现这些才像「发生了一件事」，而不是「交代一下现状」
EVENT_HINTS = ['没', '不', '被', '抢', '摔', '翻车', '错', '忘', '扣', '超', '炸',
               '迟到', '失败', '成功', '发现', '结果', '居然', '竟然', '才']


def load_json(path):
    d = json.load(open(path, encoding='utf-8'))
    cues = d.get('cues') or []
    out = []
    for i, c in enumerate(cues):
        out.append({
            'id': c.get('id') or f'L{i+1:02d}',
            'start': float(c.get('start', 0)),
            'end': float(c.get('end', 0)),
            'text': c.get('text') or c.get('sub') or c.get('tts') or '',
        })
    meta = {
        'source': path,
        'engine': d.get('engine'),
        'engine_known': d.get('synthesis_engine_known'),
        'word_level': d.get('word_level'),
        'duration': d.get('source_duration_seconds'),
    }
    return out, meta


def load_md(path):
    """读验收表里的逐 cue 表：| L01 | 2.430–8.580 | 0.000–6.150 | 6.150 | ... | 台词 |"""
    cues = []
    for line in open(path, encoding='utf-8'):
        if not line.strip().startswith('|'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 4 or not re.fullmatch(r'[LB]\d+', cells[0]):
            continue
        m = re.search(r'([\d.]+)\s*[–-]\s*([\d.]+)', cells[2])   # 成片时间在第 3 列
        if not m:
            continue
        text = cells[-1]
        cues.append({'id': cells[0], 'start': float(m.group(1)),
                     'end': float(m.group(2)), 'text': text})
    cues.sort(key=lambda c: c['start'])
    return cues, {'source': path, 'engine': '见验收表', 'duration': None}


def first_event(cues, declared=None):
    if declared:
        for i, c in enumerate(cues):
            if c['id'] == declared:
                return c, i, '手动指定'
    for i, c in enumerate(cues):
        if not any(w in c['text'] for w in OPENER_BLACKLIST):
            return c, i, '自动（黑名单粗筛）'
    return cues[-1], len(cues) - 1, '自动（兜底）'


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--json', help='alignment json（cues[{id,start,end,text}]）')
    g.add_argument('--md', help='验收表 md（逐 cue 表）')
    ap.add_argument('--event-cue', help='手动指定「事件句」的 cue id，例如 L03')
    ap.add_argument('--window', type=float, default=20.0, help='展开前多少秒（默认 20）')
    ap.add_argument('--event-limit', type=float, default=5.0, help='事件落地容忍上限（默认 5s）')
    a = ap.parse_args()

    cues, meta = (load_json(a.json) if a.json else load_md(a.md))
    if not cues:
        sys.exit(f'没读到 cue：{a.path if hasattr(a, "path") else a.json or a.md}')

    print(f'开场体检 · {a.json or a.md}')
    if meta.get('engine'):
        print(f'  配音口径：{meta["engine"]}（word_level={meta.get("word_level")}）')
    print()

    head = [c for c in cues if c['start'] < a.window]
    ev, ev_i, how = first_event(cues, a.event_cue)
    print(f'前 {a.window:g} 秒逐句：')
    for c in head:
        tag = ''
        if any(w in c['text'] for w in OPENER_BLACKLIST):
            tag = '  ← 招呼/前情'
        if c['id'] == ev['id']:
            tag += '  ← 事件（%s）' % how
        print(f'  {c["id"]}  {c["start"]:6.3f}–{c["end"]:6.3f}  {c["text"]}{tag}')
    print()

    first5 = ''.join(c['text'] for c in cues if c['start'] < 5.0)
    chars5 = len(re.sub(r'[^\u4e00-\u9fff]', '', first5))
    hits = sorted({w for w in OPENER_BLACKLIST for c in cues[:2] if w in c['text']})
    tail = cues[-1]['text']
    promise = [w for w in PROMISE_WORDS if w in tail or w in cues[-2]['text']]

    print('结论：')
    print(f'  事件落地：{ev["start"]:.3f}s（{ev["id"]}，{how}）  上限 {a.event_limit:g}s →',
          '通过' if ev['start'] <= a.event_limit else '不通过')
    print(f'  前 5 秒字数：{chars5} 字（{chars5/5:.1f} 字/秒），前两句黑名单命中：{hits or "无"}')
    print(f'  结尾承诺句：{"、".join(promise) if promise else "没有"}')
    if meta.get('duration'):
        print(f'  全长：{meta["duration"]}s')

    bad = []
    if ev['start'] > a.event_limit:
        bad.append(f'事件在 {ev["start"]:.1f}s 才出现（> {a.event_limit:g}s）')
    if hits:
        bad.append(f'前两句是招呼/前情：{hits}')
    if not promise:
        bad.append('结尾没有下一个承诺')
    print()
    if bad:
        print('不合格，先改稿再录：')
        for b in bad:
            print('  -', b)
        return 1
    print('通过。注意「事件位置」若是自动判的，再人工确认一遍。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
