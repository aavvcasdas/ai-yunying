# Day 1 制作记录 —— 《AI 运营第二天，名字被粉丝改了》

> 更新：2026-10-25。当前剧本为 **27 cue 修订稿**，终版尚未渲染；旧 21-cue 预览片已作废，**不要发布**。
> 制作仓库：`video-fx` 分支 `arena/8be4c8f8-video-fx`（沙箱 `/home/user/video-fx-day0`）。本仓库保存文案、配音稿、TTS 工具与制作源码快照。

## 一、本轮已完成

- ✅ 《Day1文案.md》和 `Day1配音台词.txt` 已从 21 cue 更新为 27 cue，两个文件逐条一致。
- ✅ 新增 **L15–L17 回信悬案**：30 条催回信 → 后台回了三百多条、评论区只数出 197 条 → “是不是被鱼叼走了？”
- ✅ 新增 **L20–L22 点播回应**：19 条点播 → 《朋友的酒》和 MV → 三角洲/王者与“本鱼没手” → “MV 还在肚子里，先游两圈。”
- ✅ 画面文字 **“官方艺名：鲸鱼娘”已改为“艺名：鲸鱼娘”**。
- ✅ `video-fx/src/ch/day1_all.js` 已新增六个对应分镜并完成 cue 重编号：
  - `shotUrgeReplies`：30 张催信卡 + 红点提醒；
  - `shotReplyMismatch`：后台 348 与评论区 197 双账卡对数；
  - `shotFishTookReplies`：小鲸鱼叼着信封游过；
  - `shotRequests19`：19 条点播台、《朋友的酒》与 MV 真实点播卡；
  - `shotGameRefusal`：三角洲/王者、超大手柄和“没手”红章；
  - `shotMvBelly`：MV 制作中泡泡，本鱼沿泳圈轨迹游满两圈。
- ✅ 菜单仍保留已确认四项：MV / 打游戏 / Claude 共创 / 偷吃饭；“打游戏”卡已加“没手警告”，承接新台词，不假装能亲自操作。
- ✅ 六个新增镜头已做静帧运行检查，并修正了大字被头发遮挡、巨型手柄被角色遮挡等图层问题；检查没有写入任何生产时间轴。
- ✅ 代码已加终版门禁：`day1_all.js` 只接受 27-cue、带人声且标记为 measured 的时间轴；旧 21-cue 估时时间轴被使用时直接报错。

## 二、晓伊 TTS：工具完成，本沙箱网络仍失败

### 工具

- 沙箱内：`/home/user/tools/say.py`
- 本仓库同份文件：`tools/say.py`
- video-fx 工具目录同份文件：`day1_tools/say.py`
- 固定参数：Microsoft Edge TTS `zh-CN-XiaoyiNeural`、rate `+0%`、pitch `+0Hz`
- 不允许改音色、不加语速/音调偏移；没有克隆任何真人、游戏角色声音，也没有拿任何人的干声做参考。

单句：

```bash
python3 ~/tools/say.py "大家好，本鱼回来了。日更，没摸鱼。" L01.mp3
```

全片逐行批量：

```bash
python3 ~/tools/say.py --batch Day1配音台词.txt --outdir day1_audio
```

工具会逐行生成 `L01.mp3`–`L27.mp3`，随后用 ffprobe/mutagen 回读真实时长，并用自相关法报告 F0 中位、P25、P75；结果写入 `tts_report.json`。任一 cue 的 F0 中位不在 290–330Hz，工具会返回失败状态，不会只报“已完成”。

检查已有 MP3（不合成）：

```bash
python3 ~/tools/say.py --check L01.mp3
```

### 本次实测结果（不是估算）

| 检查项 | 结果 |
|---|---|
| `edge-tts` 安装 | 成功；本沙箱因 PEP 668 需要 `pip install --break-system-packages edge-tts mutagen imageio-ffmpeg numpy` |
| 单句自检台词 | “大家好，本鱼回来了。日更，没摸鱼。” |
| 单句自检退出码 | **1（失败）** |
| 错误 | `aiohttp.client_exceptions.ClientConnectorError: Cannot connect to host speech.platform.bing.com:443` |
| DNS | 正常，解析到 150.171.27.10 / 150.171.28.10 及 IPv6 地址 |
| IPv4 | TCP 可连接，但 TLS 握手立即 EOF；curl 为 `SSL_ERROR_SYSCALL` |
| IPv6 | `Network is unreachable` |
| 代理 | 环境变量、pip、npm、git 均未配置可用代理 |
| 有效晓伊 MP3 | **无**；失败留下的 0 字节文件已由工具自动清理 |
| 晓伊真实时长 / F0 | **尚无数据，不能声称达标** |

时长/F0 回读器本身另做了非人声的 310Hz 谐波测试信号校验：回读时长 **2.038s**，F0 中位 **310.34Hz**（98/98 帧）。这只证明检测算法能工作，**不是晓伊测试结果，不用于配音或卡点**。

## 三、严格实测门禁

`day1_tools/gen_all.py` 已删除旧的字数估时回退：

1. 必须存在 27 个有效 MP3 和 `day1_audio/tts_report.json`；
2. 报告中的台词、文件名、音色与固定参数必须与当前配音稿逐条一致；
3. 每条 `duration_sec_measured` 必须有效，并由 ffprobe/mutagen 独立复测，误差超过 0.08 秒就中止；
4. 每条 F0 中位必须在 290–330Hz，否则列出不合格 cue 并中止；
5. 全部通过后才生成 `src/day1_timing.js`、重排字幕、混入人声并用真实人声 RMS 生成口型包络。

本轮已实跑门禁测试：在没有 MP3/报告时，`gen_all.py` 按预期退出码 1，只提示先运行 `say.py`，不会覆盖出估算版时间轴。

## 四、正常网络下出终版

前提：`ai-yunying` 与 `video-fx` 两个仓库同级放置；在 `video-fx` 根目录运行。

```bash
pip install edge-tts mutagen imageio-ffmpeg numpy
npm install @napi-rs/canvas

python3 day1_tools/synth_voice.py       # 调用 ~/tools/say.py，生成 27 条 MP3 + tts_report.json
python3 day1_tools/gen_all.py           # 只按实测时长排 27 cue，并复核 F0
node render_day1.mjs --out whale_day1.mp4
```

也可以先在正常网络机器上直接运行本仓库 `tools/say.py --batch Day1配音台词.txt --outdir day1_audio`，再把 27 个 MP3 与 `tts_report.json` 放回 `video-fx/day1_audio/` 后继续后两步。

## 五、旧预览片（历史留档）

`day1视频_预览版（待晓伊配音）.mp4` 是旧 21-cue、无人声、按估时排布的预览：85.20 秒，1280×720，30fps，H.264/AAC 48kHz；曾抽帧检查标题、户口本、评论墙、改名、抢米饭、菜单、信堆和终幕。它不包含本轮新增六条台词，也不满足新的实测卡点要求，因此只能回看构图风格，**不能作为 Day 1 发布片**。

## 六、关键文件

| 文件 | 说明 |
|---|---|
| `Day1文案.md` | 27-cue 连读版、Cue/分镜表与数据出处 |
| `Day1配音台词.txt` | 27 行纯台词，一行对应一条 MP3 |
| `tools/say.py` | 晓伊单句/批量合成 + 时长回读 + F0 报告（沙箱同份在 `~/tools/say.py`） |
| `day1制作/gen_all.py` | 严格实测版时间轴/字幕/混音/口型生成器 |
| `day1制作/synth_voice.py` | video-fx 内调用 `say.py` 的批量入口 |
| `day1制作/video-fx源码快照/day1_all.js` | 27-cue 四章分镜；已含六个新增镜头与删“官方” |
| `day1制作/video-fx源码快照/render_day1.mjs` | Day 1 独立渲染器 |

注：旧的 `day1_timing.js` 快照已移除，避免误用 21-cue 估时。video-fx 中 `src/lyrics.js` 与 `src/props.js` 仍是上次 Day 1 预览时改过的状态；若要在该仓库重出 Day 0，需先按原提交还原。
