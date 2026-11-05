#!/usr/bin/env python3
"""新集脚手架：一键初始化 DayN/ 与 tools/dayN制作/（仅允许尚不存在的集数）。

生成后流程见 tools/engine/README.md：
  填台词 -> gate script -> 导入配音生成实测轴 -> 填 episode.spec.mjs
  -> render_dayN.mjs 出干声母版 -> mix_episode_bgm.py 出 BGM 成片
  -> export_vertical.mjs 出竖屏版 -> gate final。
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SPEC_TEMPLATE = """// Day{day}《{title}》声明式单集配置（通用引擎驱动，勿手写渲染循环）
// 姿态只能用已校准的 8 种；开场双人不得同姿/双 idle，姿态变化落在 0.65-1.10s。
const actorA = {{
  pose: 'shock', poses: [{{ at: 0.8, pose: 'point' }}],
  x: 430, y: 600, u: 40,
}};
const actorB = {{
  pose: 'confident_hips',
  x: 830, y: 600, u: 38,
}};

export default {{
  day: {day},
  title: '{title}',
  speaker: '本鲸',
  opener: {{
    badge: '先看这里',
    headlinePrefix: '把本集冲突写成大白话，',
    headlineHighlight: '亮出笑点！',
    stampText: '就这样！',
    stampWord: {{ line: 1, char: '诶' }},
    stampAt: [640, 520],
    actorA, actorB,
    rolePlates: ['本鲸 · 当事人', '笨鱼 · 对手戏'],
    foregroundProps: [
      {{ propId: 'name_plate', x: 640, y: 520, scale: 1, state: {{ text: '监工位' }} }},
    ],
  }},
  verticalTitle: ['把本集冲突写成大白话，', '亮出笑点！'],
  shots: [
    {{
      id: 'C01', fromLine: 1, toLine: 1, mood: 'work_cool',
      actors: [actorA, actorB],
      interactions: [],
      companionProps: [
        {{ propId: 'empty_bowl', x: 760, y: 540, scale: 1 }},
      ],
    }},
  ],
}};
"""

PROXY_TEMPLATE = """// Day{day} 薄封装入口：仅绑定当集 spec，透传其余全部 CLI 参数给通用引擎。
import {{ spawnSync }} from 'node:child_process';
import path from 'node:path';
import {{ fileURLToPath }} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '../engine/render_episode.mjs');
const spec = path.join(here, 'episode.spec.mjs');
const r = spawnSync('node', [engine, '--spec', spec, ...process.argv.slice(2)], {{ stdio: 'inherit' }});
process.exit(r.status ?? 1);
"""

SCRIPT_TEMPLATE = "（待填。先读 agent.md 和 day-series-writer Skill；承接上集状态，写当集行动、局部结果与下一步。）\n"
COPY_TEMPLATE = """# Day{day} 文案：{title}

先读 `agent.md` 和 `.claude/skills/day-series-writer/SKILL.md`。不读不写。

**状态：待填、未锁字、未配音。`measured=false`。**

## 状态与事实边界

待填。先核对上一集锁定口播与当日客人梗的来源。

## 当集承接卡

待填：进入状态、未完成的事、当集目标、客人（如有）、冲突、纠偏、退出状态、下一步。

## 口播正文

待填。与 `Day{day}配音台词.txt` 一致。

## 标题、封面字与简介

待填。
"""


def main(argv=None):
    ap = argparse.ArgumentParser(description='初始化新一集目录骨架')
    ap.add_argument('--day', type=int, required=True)
    ap.add_argument('--title', required=True)
    args = ap.parse_args(argv)
    if args.day < 1:
        raise SystemExit('day 必须为正整数')
    if any(ch.isdigit() for ch in args.title):
        raise SystemExit('标题不得含阿拉伯数字（画面/口播红线）')
    day_dir = ROOT / f'Day{args.day}'
    make_dir = ROOT / 'tools' / f'day{args.day}制作'
    if day_dir.exists() or make_dir.exists():
        raise SystemExit(f'Day{args.day} 已存在，拒绝覆盖历史内容')
    (day_dir / '配音').mkdir(parents=True)
    (day_dir / '成片').mkdir(parents=True)
    (day_dir / '字幕').mkdir(parents=True)
    make_dir.mkdir(parents=True)
    (day_dir / f'Day{args.day}配音台词.txt').write_text(SCRIPT_TEMPLATE, encoding='utf-8')
    (day_dir / f'Day{args.day}文案.md').write_text(
        COPY_TEMPLATE.format(day=args.day, title=args.title), encoding='utf-8')
    (make_dir / 'episode.spec.mjs').write_text(
        SPEC_TEMPLATE.format(day=args.day, title=args.title), encoding='utf-8')
    (make_dir / f'render_day{args.day}.mjs').write_text(
        PROXY_TEMPLATE.format(day=args.day), encoding='utf-8')
    config = {
        'script': f'Day{args.day}/Day{args.day}配音台词.txt',
        'voice': f'Day{args.day}/配音/Day{args.day}配音.wav',
        'alignment': f'tools/day{args.day}制作/voice_alignment.json',
        'subs': f'tools/day{args.day}制作/subtitle_timing.json',
        'renderer': f'tools/day{args.day}制作/render_day{args.day}.mjs',
        'video': f'Day{args.day}/成片/Day{args.day}_配音对齐版.mp4',
        'tests': ['tools/engine/engine.test.mjs'],
        'rate': 3.35, 'seconds': 60, 'event_cue': 'L01',
        'use_unified_engine': True,
        'note': '通用引擎新集：干声母版过 verify_episode，BGM 成片另由 mix_episode_bgm.py 验收，竖屏版为渠道附加交付物。',
    }
    (make_dir / 'gate_config.json').write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'已初始化 Day{args.day}《{args.title}》：')
    print(f'  {day_dir}/（配音台词模板、配音/、成片/、字幕/）')
    print(f'  {make_dir}/（episode.spec.mjs、render_day{args.day}.mjs、gate_config.json）')
    print('下一步：先读 agent.md，再填台词 -> python3 tools/gate.py '
          f'--day {args.day} --stage script（详见 tools/engine/README.md）')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
