# Day 1 制作记录 —— 《AI 运营第二天，名字被粉丝改了》

> 2026-10-25。本目录文件：`day1视频_预览版（待晓伊配音）.mp4`（85.2 秒，1280×720，30fps）。
> 制作仓库：`video-fx` 分支 `arena/8be4c8f8-video-fx`（clone 在沙箱 `/home/user/video-fx-day0`，已本地提交，未推送该仓库远端）。

## 当前状态：画面完成，配音待合成

- ✅ 四章画面全部新写：点名（907 户口本）/ 改名（大肥鱼已采纳）/ 米缸（鲸元券·抢米饭·算不明白）/ 欠信+点菜（305 封·菜单四项·907 住户明天见），逐 cue 对齐《Day1文案.md》。
- ✅ 字幕条、左上角 `Day 1 · AI 接管中` HUD、「含 AI 生成内容」水印都在。
- ✅ BGM：按引擎 BPM=128 程序化生成了一条 chiptune 垫底（`assets/day1_track.wav`），节拍卡点与之对齐。
- ⚠️ **人声轨目前是空的**：本沙箱出站网络只允许 GitHub/npm/PyPI，直连微软语音服务 `speech.platform.bing.com` 被挡（edge-tts 报 `ClientConnectorError`），晓伊合成无法在沙箱内完成。口型包络已用确定性曲线按 cue 窗口合成，画面节奏按 4.6 字/秒预估时长排布——所以现在是「预览版」，不是发布版。

## 出终版只需在一个有正常网络的环境里跑三条命令

在 `video-fx` 仓库根目录（需与 `ai-yunying` 同级目录放置）：

```bash
pip install edge-tts imageio-ffmpeg numpy   # 首次
npm install @napi-rs/canvas                  # 首次
python3 day1_tools/synth_voice.py            # 晓伊 zh-CN-XiaoyiNeural, rate+0%, pitch+0Hz -> day1_audio/L01..L21.mp3
python3 day1_tools/gen_all.py                # 检到实录后自动按实测时长重排 timing/字幕/人声轨/口型包络
node render_day1.mjs --out whale_day1.mp4    # 终版
```

`gen_all.py` 的逻辑是双模式：`day1_audio/L*.mp3` 存在则用实测时长并混入人声；不存在则预估。换实录后字幕卡点、章节切点、口型都会按晓伊真实时长自动重排，不需要改画面代码。

> 另一个选择：把 21 个 mp3 在本地合成后上传回本项目，我在沙箱里跑 `gen_all + render` 出终版。

## 本次在 video-fx 动的文件

| 文件 | 变动 |
|---|---|
| `src/ch/day1_all.js` | 新增，Day 1 四章全部画面（只拼装现有 CAST/PROPS/28 动作，没新做资产） |
| `src/day1_timing.js` | `gen_all.py` 生成的时间轴（21 cue 起止 + 字幕） |
| `src/lyrics.js` | `LY` 数组由 `gen_all.py` 重写为 Day 1 字幕（⚠️ 在 video-fx 里出 Day 0 需先还原此文件） |
| `src/props.js` | HUD `Day 0` → `Day 1`（同上，还原提醒） |
| `assets/day1_track.wav` / `assets/day1_envelope.js` | BGM+人声混音轨 / 30fps 包络（beats=128BPM 网格，hits=cue 起点） |
| `render_day1.mjs` | Day 1 独立渲染器（`--stills` 出静帧自检），不影响 Day 0 的 `render.mjs` |
| `day1_tools/gen_all.py`、`day1_tools/synth_voice.py` | 生成器与晓伊合成脚本（参数写死：晓伊、原速、原调） |

QA：成品 `Duration 00:01:25.20 / 1280x720 / 30fps / AAC 48k`，抽帧检查过标题、907 户口本、评论墙、改名盖章、抢米饭、菜单四项、305 封信、终幕卡共 12 个时间点。
