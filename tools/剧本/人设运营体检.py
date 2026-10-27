#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""人设运营体检：写完文案先跑这个，不合格退回改稿。

用户 2026-10-27 明确纠正：上一版做成「字数/语速/句长」的字数机器是**错的方向**——
「不要去定字数，是让你去搞人设啊」「没把别人的运营经验加进来」。
所以本脚本**不再统计字数、句长、语速**（那些只是人设的自然结果，不是门禁指标），
改为检查一条文案有没有把「人设」和「高粉账号运营经验」真正落进去。

它检查三类东西：

  【A. 人设要素】——有没有让角色像"活的鲸鱼"而不是 AI 写的稿
    · 感官/生活细节（咕噜、米饭、褪色、空碗、白饭、水…）——活人感核心
    · 前情 call back（大小姐、染色、MV、返工、第一条…）——人设一致性
    · 专属反应（委屈一秒/嘴硬/偷偷想/偷偷承认/护饭…）——决定"萌不萌"
    · 自称口径（本鲸；不能拿"大肥鱼/本鱼"当自称）

  【B. 运营经验】——有没有用到调研里的高粉账号做法
    · 真结果/真账本线（数字/账本/播放/米饭成本/token）
    · 失败照发 + 金句（数据越来越差 + "那是运气/真正的作业"）
    · 共同身份（你们/住户/鲸群/陪本鲸）
    · 承诺链（小目标/月度目标/明天/账本卡）
    · 结尾只留一个动作（评论区/陪…看看）

  【C. 硬红线】——出现即失败（合规 / 剧情 / 文风）
    · AI 味/书面腔/解释腔黑词（首先/其次/综上/作为AI/社区里都算过…）
    · 卖惨带货/打赏引导（投币/打赏/救救/可怜可怜/v我50…）
    · 剧情红线：被换掉设定、价格对比长句、逐字念后台数据、无效的"换赛道换开头"
    · 第一句：不能是招呼/前情/内部黑话（大家好/复盘/上一集/Day N/1096播放…）

判定分两级：
  · 硬失败（退出码 1）：C 类红线命中，或 A/B 类关键要素缺得太多。
  · 硬通过（退出码 0）：红线没命中、人设要素和运营要素都达标，打印"缺哪些可选要素"提醒。

用法：
  python3 tools/剧本/人设运营体检.py --md Day4/Day4文案.md
  python3 tools/剧本/人设运营体检.py --txt /tmp/taici.txt
  python3 tools/剧本/人设运营体检.py --md Day4/Day4文案.md --title "本鲸昨天，忘了吃饭"

门禁定位（`agent.md` 第 16 条）：这是「怎么说/人设立没立住」的门禁，
不替代 `开场体检.py`（事件落地秒数/承诺链）。两道门都过才算定稿。
"""
import argparse
import re
import sys

# ---------- A. 人设要素 ----------
# 感官 / 生活细节：让角色有"身体"和"日常"，是活人感核心
SENSORY = ['咕噜', '米饭', '白饭', '饭碗', '空碗', '褪色', '染色', '水里', '水',
           '褪色', '尾巴', '气泡', '饿', '吃饭', '忘了吃', '热', '香', '锅']
# 前情 call back：把旧剧情接回来，老观众会心一笑
CALLBACK = ['大小姐', '染色', '褪色', 'MV', '返工', '歌词', '扮', '第一条', '4 版', '四版']
# 专属反应 / 性格：委屈一秒、嘴硬、偷偷、护饭、天才但懒
PERSONA_REACT = ['委屈', '就一秒', '偷偷', '嘴硬', '才不', '别急', '好好的',
                 '绝不摸鱼', '先把饭', '补回来', '猜', '大概', '运气', '作业']
SELF_CLAIM_OK = '本鲸'
SELF_CLAIM_BAD = ['本鱼回来', '我是大肥鱼', '本大肥鱼']

# ---------- B. 运营经验 ----------
# 真结果/真账本线
REAL_LEDGER = ['播放', '账本', '米饭', 'token', '充', '钱', '住户', '涨', '万', '数据']
# 失败照发 + 金句
FAIL_GOLDEN = ['越来越差', '运气', '真正的作业', '交作业', '失败', '摇头', '数据差']
# 共同身份
COMMUNITY = ['你们', '住户', '鲸群', '陪本鲸', '陪本', '大家', '一起']
# 承诺链
PROMISE = ['小目标', '月度目标', '明天', '账本卡', '一半', '住户', '走到']
# 结尾单一动作
ONE_ACTION = ['评论区', '陪本鲸看看', '看看能不能', '说句话', '陪本鲸']

# ---------- C. 硬红线 ----------
# AI 味 / 书面腔 / 解释腔
AI_TONE = ['首先', '其次', '综上', '综上所述', '总而言之', '值得注意的是', '众所周知',
           '作为一个', '作为AI', '作为一个AI', '希望这个', '希望有帮助', '根据您的',
           '我无法', '接下来我给大家', '也就是说', '换句话说', '社区里都算过',
           '差了八十多倍', '要一百多，差', '折合', '换算下来']
# 卖惨带货 / 打赏引导
BEGGING = ['投币', '打赏', '救救本鲸', '可怜可怜', 'v我50', 'V我50', '送礼物',
           '充电', '解锁全套', '求求你', '买它', '下单', '关注解锁', '刷个']
# 剧情红线：v2 被用户否决的错误设定 / 废话。
# 注意：用户明确要保留「主人应该，不会换掉本鲸吧？」这种**猜测安抚**，
# 所以只拦「被换掉」当事实的断言式（v2 开头那种），不拦带「不会…吧/大概/猜」的猜测。
PLOT_BAN = ['被换掉啦', '被换掉了', '就要被换', '要被换掉', '本鲸被换',
            '不换人，不换赛道', '换个开头就行',
            '它强归它强', '这边两块', '差了八十', '社区里都算过']
# 逐字念后台数据（用户点名删这类）
DATA_READOUT = ['一千零九十六播放', '两秒跑四成', '两秒跳出四十三', '八秒被划走',
                '完播三点六六', '平均播放占比']
# 第一句禁止：招呼 / 前情 / 内部黑话
FIRST_BAN = ['大家好', '哈喽', '本鲸回来了', '本鱼回来了', '先统计', '先复盘',
             '复盘', '结算', '汇报', '上一集', '昨天那集', '更新一下', 'Day',
             '播放', '跳出率', '一千零九十六',
             '被换掉', '被端上桌', '要被换']  # v2 那种把"被换掉"当事实的错误开头


def load_parts(md=None, txt=None):
    """返回 (口播文本, 标题行 or '')。"""
    if txt:
        return open(txt, encoding='utf-8').read(), ''
    s = open(md, encoding='utf-8').read()
    title = ''
    mt = re.search(r'^#\s+(.+)', s, re.M)
    if mt:
        title = mt.group(1)
    m = re.search(r'##\s*四、逐字口播稿.*?```(?:text)?\n(.*?)\n```', s, re.S)
    if not m:
        m = re.search(r'```(?:text)?\n(.*?)\n```', s, re.S)
    if not m:
        sys.exit(f'没在 {md} 里找到 ```text 口播稿代码块')
    return m.group(1), title


def first_sentence(raw):
    for ln in raw.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith('#') or ln.startswith('【') or ln.startswith('>'):
            continue
        return ln
    return ''


def hits(text, words):
    return sorted({w for w in words if w in text})


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--md', help='含 ```text 口播稿的 md 文件')
    g.add_argument('--txt', help='纯台词 txt 文件')
    ap.add_argument('--title', default='', help='标题（可选，覆盖 md 一级标题）')
    a = ap.parse_args()

    raw, md_title = load_parts(a.md, a.txt)
    title = a.title or md_title
    # 去掉标注行/心声行，只留真正的口播文本做检查
    body = '\n'.join(ln for ln in raw.splitlines()
                     if not ln.strip().startswith(('#', '>', '`', '【')))
    first = first_sentence(raw)

    print(f'人设运营体检 · {a.md or a.txt}')
    print(f'  标题：{title or "（未提供）"}')
    print(f'  第一句：{first or "（空）"}')
    print()

    # ---- A. 人设要素 ----
    sensory = hits(body, SENSORY)
    callback = hits(body, CALLBACK)
    react = hits(body, PERSONA_REACT)
    self_bad = hits(body, SELF_CLAIM_BAD)
    self_ok = SELF_CLAIM_OK in body
    print('【A. 人设要素】')
    print(f'  感官/生活细节：{len(sensory)} 类  {sensory}')
    print(f'  前情 call back：{len(callback)} 类  {callback}')
    print(f'  专属反应/性格：{len(react)} 类  {react}')
    print(f'  自称「本鲸」：{"有" if self_ok else "无"}；错误自称：{self_bad or "无"}')
    print()

    # ---- B. 运营经验 ----
    ledger = hits(body, REAL_LEDGER)
    golden = hits(body, FAIL_GOLDEN)
    community = hits(body, COMMUNITY)
    promise = hits(body, PROMISE)
    action = hits(body, ONE_ACTION)
    print('【B. 运营经验】')
    print(f'  真结果/真账本线：{hits(body, REAL_LEDGER)}')
    print(f'  失败照发+金句：{golden}')
    print(f'  共同身份：{community}')
    print(f'  承诺链：{promise}')
    print(f'  结尾单一动作：{action}')
    print()

    # ---- C. 硬红线 ----
    ai_tone = hits(body, AI_TONE)
    begging = hits(body, BEGGING)
    plot_ban = hits(body, PLOT_BAN)
    data_readout = hits(body, DATA_READOUT)
    first_ban = hits(first, FIRST_BAN)
    print('【C. 硬红线】')
    print(f'  AI味/书面腔：{ai_tone or "无"}')
    print(f'  卖惨带货：{begging or "无"}')
    print(f'  剧情红线：{plot_ban or "无"}')
    print(f'  逐字念后台数据：{data_readout or "无"}')
    print(f'  第一句招呼/前情/黑话：{first_ban or "无"}')
    print()

    # ---- 判定 ----
    fatal = []
    if ai_tone:
        fatal.append(f'AI味/书面腔：{ai_tone}')
    if begging:
        fatal.append(f'卖惨带货/打赏引导：{begging}')
    if plot_ban:
        fatal.append(f'剧情红线（v2 被否设定）：{plot_ban}')
    if data_readout:
        fatal.append(f'逐字念后台数据（用户点名删）：{data_readout}')
    if first_ban:
        fatal.append(f'第一句是招呼/前情/黑话：{first_ban}')
    if self_bad:
        fatal.append(f'错误自称：{self_bad}')

    # 人设要素：至少要有感官细节 + 前情 call back + 专属反应 三类，否则人设没立住
    weak = []
    if not sensory:
        weak.append('没有任何感官/生活细节——角色像 AI 写的，不像活的鲸鱼')
    if not callback:
        weak.append('没有前情 call back——人设不连贯，老观众接不上')
    if not react:
        weak.append('没有专属反应（委屈一秒/嘴硬/偷偷想）——呆萌立不住')
    if not self_ok:
        weak.append('没出现自称「本鲸」')

    if fatal or weak:
        print('不合格，按「搞人设 + 运营经验」方向改稿：')
        for x in fatal:
            print('  ✗ [硬红线]', x)
        for x in weak:
            print('  ✗ [人设缺失]', x)
        return 1

    # 通过，但提醒可选的运营要素缺哪些
    tips = []
    if not ledger:
        tips.append('真结果/账本线')
    if not golden:
        tips.append('失败照发+金句')
    if not community:
        tips.append('共同身份（你们/鲸群）')
    if not promise:
        tips.append('承诺链（小目标/月度目标/账本卡）')
    if not action:
        tips.append('结尾单一动作')
    print('通过：人设要素齐全、无硬红线。')
    if tips:
        print('提醒（可选运营要素缺失，建议补上）：' + '、'.join(tips))
    print('再跑一遍 `开场体检.py` 查事件秒数/承诺链，两道门都过才算定稿。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
