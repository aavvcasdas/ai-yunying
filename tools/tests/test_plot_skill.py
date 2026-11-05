"""连载承接回归：Day12 专项因果、通用集数和可识别的文本红线。"""

import importlib.util
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "tools" / "剧本")]
import 剧情 as plot


PREV = """老大可能换新工作。
岗位先扒出来再说。
敲代码的，先划掉。
太远的，标出来。
太熬人的，也标出来。
先吃一口饭。
本鲸绝不摸鱼
"""

HOOKED = """笨鱼带回昨天的岗位。
评论拿不准，先艾特豆包。
老大可能换新工作。
本鲸问没相关经验，能投吗？
这是一句故意写得很长的话，用来证明剧情生成不再因为超过二十个字就退稿，不能为了门禁把这件事切碎。
豆包给了录取通知。
面试还没去。
本鲸追问。
她道歉。
本鲸筛岗位，敲代码的先划掉。
不确定的圈出来。
拿不准的留给明天的新朋友。
"""


class PlotSkillTests(unittest.TestCase):
    def test_retired_lengths_are_not_failures(self):
        errors, notes = plot.check(HOOKED.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertFalse(errors, errors)
        self.assertTrue(any("句长门禁不启用" in note for note in notes))
        self.assertGreater(max(plot.han_len(line) for line in HOOKED.splitlines()), 20)

    def test_cold_open_fails_without_mentioning_length(self):
        cold = ["门响了。", "只有豆包。", "她来晚了。对不起，已经写上。"]
        errors, _notes = plot.check(cold, PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("笨鱼带回" in item for item in errors), errors)
        self.assertTrue(any("无来源" in item for item in errors), errors)
        self.assertFalse(any("字" in item and "超过" in item for item in errors))

    def test_day12_requires_causal_order(self):
        # 通知放在提问之前，不应误认为提问之后发生了跑偏。
        reversed_order = HOOKED.replace("本鲸问没相关经验，能投吗？", "豆包给了录取通知。\n本鲸问没相关经验，能投吗？")
        reversed_order = reversed_order.replace("豆包给了录取通知。\n面试还没去。", "面试还没去。")
        errors, _notes = plot.check(reversed_order.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("提问后录取通知" in item for item in errors), errors)
        no_correction = HOOKED.replace("本鲸追问。\n", "")
        errors, _notes = plot.check(no_correction.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("追问或纠偏" in item for item in errors), errors)
        no_apology = HOOKED.replace("她道歉。\n", "")
        errors, _notes = plot.check(no_apology.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("追问后" in item and "道歉" in item for item in errors), errors)
        early_apology = HOOKED.replace("本鲸追问。\n她道歉。", "她道歉。\n本鲸追问。")
        errors, _notes = plot.check(early_apology.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("追问后" in item and "道歉" in item for item in errors), errors)
        no_work = HOOKED.replace("本鲸筛岗位，敲代码的先划掉。\n", "")
        no_work = no_work.replace("不确定的圈出来。\n", "")
        errors, _notes = plot.check(no_work.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertTrue(any("岗位筛选" in item for item in errors), errors)
        self.assertTrue(any("圈出不确定" in item for item in errors), errors)

    def test_day12_same_line_events_keep_their_order(self):
        # 用户原稿允许一句内有多个动作，检查不依赖固定行数。
        one_line = "".join(HOOKED.strip().splitlines())
        errors, _notes = plot.check([one_line], PREV.strip().splitlines(), "豆包", day=12)
        self.assertFalse(errors, errors)

    def test_earlier_continuity_can_precede_offer(self):
        errors, notes = plot.check(HOOKED.strip().splitlines(), PREV.strip().splitlines(), "豆包", day=12)
        self.assertFalse(errors, errors)
        self.assertIn("老大可能换新工作", "\n".join(notes))

    def test_particle_digit_and_second_guest(self):
        base = HOOKED.strip().splitlines()
        particle = plot.check(base + ["本鲸不收呀。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("语气词" in item for item in particle))
        digit = plot.check(base + ["护照办了100张。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("数字" in item for item in digit))
        extra = plot.check(base + ["大小姐也进门。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("一位当日客人" in item for item in extra))
        fish = plot.check(base + ["笨鱼：我去。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("笨鱼不新增对白" in item for item in fish))
        mowan = plot.check(base + ["魔丸来了。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("魔丸" in item for item in mowan))
        false_promise = plot.check(base + ["老大已经换新工作。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("确定事实" in item for item in false_promise))
        false_offer = plot.check(base + ["老大已经录取了。"], PREV.strip().splitlines(), "豆包", day=12)[0]
        self.assertTrue(any("确定事实" in item for item in false_offer))

    def test_other_days_do_not_require_day12_guest_or_meme(self):
        next_day = [
            "那张纸上的可能还没有划掉。",
            "豆包昨天留下的岗位仍在桌上。",
            "大小姐接过纸。",
            "本鲸不让她替老大决定。",
            "明天再把岗位拿回来。",
        ]
        errors, _ = plot.check(next_day, PREV.strip().splitlines(), "大小姐", day=13)
        self.assertFalse(errors, errors)
        no_guest = ["老大还没有决定。", "本鲸把那张纸收好。", "明天接着挑。"]
        errors, notes = plot.check(no_guest, PREV.strip().splitlines(), day=13)
        self.assertFalse(errors, errors)
        self.assertTrue(any("同义改写" in note for note in notes))
        unknown = ["小云接过纸。", "本鲸指出没有定下来。", "明天继续整理。"]
        errors, _ = plot.check(unknown, PREV.strip().splitlines(), "小云", day=13)
        self.assertFalse(errors, errors)

    def test_day12_hooks_day11(self):
        prev = plot.load_lines(ROOT / "Day11/Day11配音台词.txt")
        curr = plot.load_lines(ROOT / "Day12/Day12配音台词.txt")
        errors, notes = plot.check(curr, prev, "豆包", day=12)
        self.assertFalse(errors, errors)
        joined = "\n".join(notes)
        self.assertIn("老大可能换新工作", joined)
        self.assertIn("敲代码的", joined)

    def test_day12_script_and_publication_copy_match(self):
        doc = (ROOT / "Day12/Day12文案.md").read_text(encoding="utf-8")
        script = (ROOT / "Day12/Day12配音台词.txt").read_text(encoding="utf-8").strip()
        section = doc.split("## 口播正文", 1)[1]
        copy = section.split("```text\n", 1)[1].split("\n```", 1)[0].strip()
        self.assertEqual(copy, script)
        for marker in ("measured=false", "当集承接卡", "口播正文", "标题、封面字与简介", "未验证"):
            self.assertIn(marker, doc)

    def test_day12_user_draft_remains_unlocked_and_unverified(self):
        doc = (ROOT / "Day12/Day12文案.md").read_text(encoding="utf-8")
        script = (ROOT / "Day12/Day12配音台词.txt").read_text(encoding="utf-8")
        status = "\n".join(doc.splitlines()[:8])
        for marker in ("未锁字", "未配音", "未渲染", "measured=false"):
            self.assertIn(marker, status)
        self.assertIn("本次未核实真实权限是否恢复", doc)
        self.assertIn("不等于真实服务免费", doc)
        self.assertIn("用户本轮提供", doc)
        self.assertNotIn("山姆超市护照", script)
        prev = plot.load_lines(ROOT / "Day11/Day11配音台词.txt")
        _errors, notes = plot.check(script.strip().splitlines(), prev, "豆包", day=12)
        self.assertTrue(any("权限是否恢复" in note for note in notes), notes)
        self.assertTrue(any("既有风格口径有冲突" in note for note in notes), notes)
        self.assertTrue(any("真实费用" in note for note in notes), notes)

    def test_skill_is_discoverable_and_old_skill_is_retired(self):
        path = ROOT / ".claude/skills/day-series-writer/SKILL.md"
        text = path.read_text(encoding="utf-8")
        self.assertTrue(text.startswith("---\n"))
        header = text.split("---\n", 2)[1]
        self.assertRegex(header, r"(?m)^name: day-series-writer$")
        self.assertRegex(header, r"(?m)^description:")
        for word in ("Day", "下一集", "口播", "人设", "剧情"):
            self.assertIn(word, header)
        self.assertRegex(path.parent.name, r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        old = (ROOT / "00_运营总览/skills/剧情生成/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("已废弃", old)
        self.assertIn("day-series-writer", old)
        self.assertNotIn("name: 剧情生成", old)

    def test_gate_script_uses_plot_not_cute(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = Path(tmp) / "gate_script_report.json"
            result = subprocess.run(
                [sys.executable, ROOT / "tools/gate.py", "--day", "12", "--stage", "script", "--report", str(report)],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("剧情承接", result.stdout)
        self.assertNotIn("呆萌体检", result.stdout)

    def test_card_does_not_need_a_draft(self):
        with tempfile.TemporaryDirectory() as tmp:
            prev = Path(tmp) / "prev.txt"
            prev.write_text(PREV, encoding="utf-8")
            result = subprocess.run(
                [sys.executable, ROOT / "tools/剧本/剧情.py", "--prev", str(prev), "--card"],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("老大可能换新工作", result.stdout)
            self.assertIn("句长门禁不启用", result.stdout)

    def test_new_episode_template_does_not_restore_old_three_beats(self):
        spec = importlib.util.spec_from_file_location("init_episode_test", ROOT / "tools/init_episode.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            module.ROOT = Path(tmp)
            self.assertEqual(module.main(["--day", "15", "--title", "继续挑岗位"]), 0)
            copy = (Path(tmp) / "Day15/Day15文案.md").read_text(encoding="utf-8")
            script = (Path(tmp) / "Day15/Day15配音台词.txt").read_text(encoding="utf-8")
        self.assertIn("day-series-writer", copy)
        self.assertIn("measured=false", copy)
        self.assertIn("退出状态", copy)
        self.assertNotIn("开头说找新朋友", script)
        errors, _ = plot.check(script.strip().splitlines(), PREV.strip().splitlines(), day=15)
        self.assertTrue(any("待填模板" in item for item in errors), errors)


if __name__ == "__main__":
    unittest.main()
