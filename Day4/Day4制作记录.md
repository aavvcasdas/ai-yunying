# Day4 制作记录 · Day2 加更电视里那版 DSH 贴纸 + 电视里的劣质 MV

> 规格：`Day4/成片/样片/day4_样片_v4_DSH像素加更版.mp4`｜1920×1080 / 30fps / **69.90s**（2097 帧）
> 渲染器：`tools/day4制作/render_day4.mjs`（本仓库，可重跑）
> 对比图：`Day4/成片/QA/画质对比_脸部.png`（脚本 `tools/day4制作/make_char_compare.mjs --face`）
> 台词口径：`Day4/Day4文案.md` 第五节逐字稿（36 句 / 269 字，`呆萌体检.py` 与 `开场体检.py` 都过）

---

## 一、用户 2026-10-27 五条指令 → 落地在哪

| 要求（原话） | 落地 |
|---|---|
| 「像素版是让你用 day2 的加更的像素版，那个电视里的那种」 | 角色换成 `tools/day2制作/video-fx源码快照/day2_poses/` 里 **39 张 DSH 鲸鱼娘贴纸**（512×512 webp，MIT）。`loadDsh()` 启动时按 alpha bbox 预计算，`drawDsh()` 脚底锚定、等高 `heightU=9.65`、呼吸 + 轻微摇摆。`CHAR_MODE` 默认 `dsh`；旧的 `whale_girl.js` 骨架保留为 `--char ss2/crisp/day2` 对照 |
| 「在继续看看能不能更清楚些」 | 贴纸是真实立绘，成片里约 250px 高，属**降采样**而不是放大，`imageSmoothingQuality='high'` 后不再有方格边。证据见 `Day4/成片/QA/画质对比_脸部.png`：A（DSH）与 B/C（骨架）同一帧同一裁切，A 的刘海、蕾丝、眼神都是连续线条 |
| 「C02 加电视机，放 MV，慢些、声音小些、很奇怪的那种卡不上点、表情包动的不对」 | `shotC02()` + `tvSet()` + 重写的 `shoddyMV()`，详见第二节 |
| 「图片中的东西去掉」（三个角标） | `hud()` 清空：左上「AI 生成 · 非官方同人」、右上「鲸鱼娘 · 本鲸」、右下「QA: …」全部撤掉；合规声明只在片尾卡留一行小字 |
| 「最后改成第几天/30，粉丝 2180/10000」 | `shotEndCard()` 重写：`第 4 天 / 30` + `粉丝 2,180 / 10,000` + 22% 进度条 |

---

## 二、C02 的电视为什么「很劣质」

用户要的三个坏点，各有一个明确的做法（不是随机乱动）：

| 坏在哪 | 实现 |
|---|---|
| **慢放** | 画面整体按 `TV_SLOW=0.35` 走时间；右上角常驻角标「慢放 0.35×」 |
| **声音小** | 屏幕内音量条压在 **12%**；`--tv-audio` 可混一条真音轨（默认现场合成占位伴奏，`atempo 0.85` + `lowpass 900Hz` + `vibrato` + `volume 0.12`，只在 C02 那 8 秒响，实测 mean −37.6 dB / max −29 dB） |
| **卡不上点** | 曲子按 130.4BPM（`TV_BEAT=0.462s`）画节拍线，但贴纸**每 1.9s 换一次**——故意和拍子错开；歌词 `朋友/的酒/一起/举起/杯` 延迟 2.4s 且左侧裁掉 3px |
| **表情包动的不对** | 换的姿势从 `TV_WRONG_POSES = ['meme-cry','sleep','angry','meme-doge','daily-gaming','failure']` 里取，唱「举起杯」时在哭、唱「朋友」时在睡 |
| 劣质感包装 | 内屏只有 240×150 再放大、扫描线、滚动亮带、雪花、红青色差、机身贴纸「MV v4 · 未调」 |

> 真音轨：仓库里**没有**《朋友的酒》音频文件。正式版建议
> `node tools/day4制作/render_day4.mjs --tv-audio 朋友的酒.mp3 --out ...`
> 脚本会自动只取 C02 那一段、慢放 + 低通 + 压到 12% 音量。不给就只出声占位伴奏。

---

## 三、角色（DSH 贴纸）怎么接的

1. `DSH_DIR = tools/day2制作/video-fx源码快照/day2_poses`，文件名 `dsh-whale-state-<pose>.webp`，共 39 张；
2. `alphaBBox()` 扫一遍 alpha 通道得到真实外框（贴纸四周留白很多，直接按 512×512 缩放会显小）；
3. `drawDsh()`：`H = heightU × u`（默认 `9.65`），`scale = H / bbox.h`，锚点 `(bbox 中心 x, bbox 底 y)` → `drawImage(-cx, -bottom)`，所以**脚永远踩在传入的 y 上**，换姿势不跳；
4. 动态：呼吸 `1 + sin(t·TAU/2.4)·0.012`、摇摆 `rot += sin(t·2.1)·0.012`、`sq`（跳/蹲）缩放、`flip` 镜像；
5. 情绪 → 姿势：`POSE_BY_EMOTION`（happy/idle→`idle-cute`、proud→`bold`、smug→`meme-smug`、sad/nervous→`failure`、cry→`meme-cry`、pout/angry→`angry`、confused→`curious`、thinking→`thinking`、sleepy→`sleep`、shocked→`meme-yes`、blush→`blush`、excited→`star`、celebrate→`celebrate`、love→`meme-heart`、hungry→`daily-eat`）。

想再清楚只有两条路（不是改采样算法）：
- 把 `heightU` 从 `9.65` 提到 `10.5~11`（人更大，但可能挡道具）；
- 整镜推近（`camBegin` 的 zoom）。

---

## 四、镜头表（14 镜 / 13 个 cue 组）

| 镜 | 画面要点 |
|---|---|
| C01 | 空碗 + v1–v4 返工单（v4 盖 `LEI`）+ 大字「米饭被 MV／吃光了」 |
| **C02** | **电视放劣质 MV**（见第二节）；返工单 v1→v3 按句拍下，v4 盖章 |
| C03 | 渲染进度条卡在 42%（抬到头顶上方，不压脑袋），本鲸蹲着、尾巴拖地 |
| C04 | 折线卡 `Day0 7.4万（10-24 截图）` → `现在 ≈2000`（只念「两千」） |
| C05 | 弹幕气泡「MV 呢？」×2 |
| C06 | 剪影手把 `MV v4.mp4` 送到位后淡出 → Q 版大小姐签收（唯一客串镜，带落地阴影） |
| C07 | 近景：屏幕空间大字「换的是 MV · 不是本鲸」+「换本鲸？」牌子被红叉划掉 |
| C08 | 两碗饭 + 便宜 / 返工不便宜 |
| C09 | 空碗「晚饭 · 没吃」→「不哭，就是有点饿」 |
| C10 | 字幕条故障（字挤一起）+ 小本本打勾 |
| **C11** | **目标卡：小目标·播放量 37,000 / 月度目标·粉丝 10,000** |
| C12 | 「还能改 · 从开头改起」 |
| C13 | 账本卡（播放量 / 新增粉丝 / 米饭钱 三栏留白） |
| C14 | 抱碗「评论区说句话就行」→ 片尾卡 `第 4 天 / 30`、`粉丝 2,180 / 10,000` |

---

## 五、怎么重跑

依赖（沙箱里装，不进仓库）：

```bash
cd /tmp/node_render && npm i @napi-rs/canvas @ffmpeg-installer/ffmpeg
```

```bash
# 全片抽帧过一遍（14 镜各一张 + 片尾）
node tools/day4制作/render_day4.mjs --stills
# 指定秒数出帧（文件名 = tag + 引擎后缀）
node tools/day4制作/render_day4.mjs --times 3.0,60.0 --tag chk
# 出片（默认 DSH 贴纸 + 电视占位伴奏）
node tools/day4制作/render_day4.mjs --tv-audio auto --out Day4/成片/样片/day4_样片_v4_DSH像素加更版.mp4
# 有真 MV 音轨时（只取 C02 那段）
node tools/day4制作/render_day4.mjs --tv-audio 朋友的酒.mp3 --out Day4/成片/当前版/day4.mp4
# 有实测 cue 与配音之后
node tools/day4制作/render_day4.mjs --cues Day4/day4_voice_alignment.json --audio Day4/配音.wav --out Day4/成片/当前版/day4.mp4
# 画质对比图
node tools/day4制作/make_char_compare.mjs --face
```

其他开关：`--char dsh|ss2|crisp|day2`（默认 dsh）、`--no-tv`（C02 不画电视）、
`--tv-audio auto|<文件>`（电视音轨）、`--soft`（关清晰化，做对照）、
`FFMPEG_PATH` 指定 ffmpeg。

---

## 六、还没做的（别当成终版）

1. **配音**：样片只有电视里那条占位伴奏，本鲸没有配音；配音出来后用 `--cues` 换实测时间轴，`开场体检.py` 再跑一遍。
2. **电视音轨**：占位伴奏是合成的；要真《朋友的酒》得用 `--tv-audio` 传文件。
3. **道具细化**：返工单、电视、饭碗都是程序化画的占位道具，不是最终美术。
4. **竖屏**：仍是 1920×1080；若要 1080×1920 需按竖屏安全区重排。
5. **待拍板的数据口径**：Day0 是 7.4 万（截图）还是 9.4 万（旧表）——现在片内用 7.4 万（可回溯截图）；
   月度目标 1 万粉丝是否按新判断下调到 3000。
