# Day 2 制作记录（指定配音实测对齐版）

> 完成日期：2026-10-26
> 当前成片：`成片/当前版/day2视频_指定配音实测对齐版.mp4`
> 逐 cue 数字与最终验收结论见：`../tools/day2制作/Day2指定配音对齐验收表.md`
>
> **2026-10-26 纠正：**高清动作候选全片曾误覆盖当前版，现已按用户反馈恢复原像素形象的 Day2 原文件；候选全片单独保存在 `成片/候选版/day2高清动作形象候选版_未发布.mp4`，不作为 Day2 发布版。后续只通过 `Day2加更_形象动作征集文案.md` 先展示与投票，投票前不得宣布换形象。

## 一、最终产物

| 项目 | 结果 |
|---|---|
| 成片 | `成片/当前版/day2视频_指定配音实测对齐版.mp4` |
| 时长 / 视频样本 | 容器 104.720s / 3141 个视频样本 |
| 视频 | 1920×1080，30fps，H.264 High，yuv420p，约 1909kb/s；主角为原像素形象 |
| 音频 | AAC-LC，48kHz，stereo，160kb/s |
| 文件大小 | 27,213,164 bytes |
| SHA-256 | `578988c40859a2c483e7e1432582d17ae21eab5de8d28f24320ee22e41271eb8` |
| 制作基线 | `aavvcasdas/video-fx` 分支 `arena/8be4c8f8-video-fx`，基线提交 `82bede5` |
| 解码验收 | ffmpeg 全片解码通过；第 0 帧、L03 落点帧与尾卡已从最终 MP4 抽帧复核 |

本片使用用户指定的连续 WAV，不是从 `Day2配音台词.txt` 重新逐句 TTS 合成。音频文件没有可验证的合成引擎元数据，故只记录为 `user-provided/final-voice-wav`，**未核验为 Microsoft 晓伊**。

## 二、指定 WAV 与实测对齐

源文件：`鲸鱼运营第三天_克隆配音_无BGM_v4.wav`

- SHA-256：`34ae5ab0aef4f63396a7e1d2a095de1eb6b6c5f6d1bee6ec06bf5e9f32fcebe2`
- 实际 PCM：103.800s，40000Hz，双声道，16-bit PCM。
- 峰值 0.661682，≥0.999 削顶样本 0。
- 全轨 F0 中位数 391.72Hz，逐 cue 350.00–429.62Hz；不在晓伊 290–330Hz 目标内。
- 文件的 WAV `data` 长度字段为 `0xffffffff`，与实际 16,608,000 bytes payload 不符。归档源文件没有被改写；生成器按实际 payload 解析，并用 ffmpeg 做 48kHz 工作副本解码。

对齐流程：

1. 先把源 WAV 转成 16kHz ASR 工作音频；
2. 用 Vosk `vosk-model-small-cn-0.22` 得到 189 个词级时间戳；
3. 对照 Git 历史确认 WAV 实际朗读的是 17 句版本，并把 `Day2配音台词.txt` 校准到该实际稿；
4. 用固定审定的词序范围映射 L01–L17，再以 5ms RMS 搜索修正每 cue 的发声起止；
5. 源 WAV 第一处实测发声在 2.430s。只在成片混合轨裁掉这段片头静音并整体平移 cue，使 L01 从 0.000s 开始；源文件本体不动；
6. 17 cue 位于 0.000–101.370s，尾卡位于 101.720–104.520s，总时长 104.720s。

没有使用字数估时。机器报告、189 词 ASR 与 17 条 QA 切片位于 `../tools/day2制作/day2_audio_final/`。

## 三、冷开场与分镜执行

- `TITLE_LEN=0`，不调用舞台红幕或全屏标题段。
- 第 0 帧直接显示“昨天的菜单 · 开票”、“打游戏 2 票”、王者/暗区两个选项、主角与手柄；L01 字幕条第 0 帧即为完成态。
- “没手”没有在 L01 提前出现，只在 L03 末尾随实际台词落章。
- 全片沿用房间/书桌连续场景，以菜单开票 → 没账号/不会打/没手 → 先吃白米饭 → 主人扣饭 → 8978/280/1441 账本 → 主人 2 个月 80 粉 → 饭碗推回 → 薄肌与鸡蛋申请推进。
- 主角保持像素骨架、`tailScale=1.0`，wink 使用 heart 后发；背景、卡片字与字幕走 clean 原生 1920×1080 绘制。
- 左上只保留小号 Day2 HUD，右上保留“非官方同人 · AI 生成内容”。

静帧阶段修复了：首帧字幕淡入、L01 扫描线越界与舷窗叠字、L03 印章被角色遮挡、L04 零票叠字与客串被挡、纸质卡片发灰、L13 缺字形符号、L14 饭碗与角色重叠、L15 悬停印章缩放过大、L16 申请表文字被户口本遮挡等问题。修复后重新生成 27 张检查帧并完成整片渲染。

## 四、音频与画面 QA 摘要

- 17 条 QA 切片独立回读：时长与 `alignment_report.json` 误差 0.000s，削顶合计 0。
- 最终 MP4 音频：mean volume -19.9dB，max volume -4.4dB；loudnorm 测量 integrated -15.49 LUFS、true peak -4.42dBTP、LRA 3.10 LU。
- 27 张代表静帧覆盖每个 cue；最终 MP4 再抽查第 0 帧、L03 92% 与尾卡，字幕和构图与静帧一致。
- 迁移前记录的 64 个 JPG/MP4/WAV SHA-256 多重集在当前仓库仍完整存在；Day1 权威 WAV 与 Day1 当前成片哈希未改变。

完整逐 cue 表见 `../tools/day2制作/Day2指定配音对齐验收表.md`。

## 五、高清动作候选与加更边界（不属于当前 Day2）

- 当前版已恢复为 `eadc43f` 的原 MP4，SHA-256 为 `578988c40859a2c483e7e1432582d17ae21eab5de8d28f24320ee22e41271eb8`。它没有被重新渲染，因此用户截图指出的 L03 白眼仍是这份已发布原片的已知问题；不能把候选测试的修复结果写成当前 Day2 已修复。
- 高清候选全片只作内部对照：`成片/候选版/day2高清动作形象候选版_未发布.mp4`，35,478,673 bytes，SHA-256 `6d6f355c62c4760d36baf0de6a4cac36b5dd6267de45db95aa237ece026a3142`。它证明 39 张完整姿势图、动作映射和 CRF 17 路线可运行，但用户已明确否决“整套替换原形象并覆盖 Day2”的发布方式。
- 代码现已加门禁：`render_day2.mjs` 默认 `--character original`；只有显式 `--character candidate` 才会整集使用候选，`--character mixed` 默认原版、只允许单个镜头以 `characterMode: 'candidate'` 展示候选。原像素路径保留白眼净化，供未来原版或混合版使用。
- 下一步先审 `Day2加更_形象动作征集文案.md` 的电视机第二稿：前半段仍由原版主持并完成开箱和动作演示；B10 电视机君入场后，屏内重播老版、屏外主展示新版候选，原版拿遥控器主持选台，评论区以 1–4 号台给主人下施工单；后段解释一天 200 条回复上限，并用电视抽四条真实评论回复。加更如制作，必须另存 `day2加更_电视机形象对比.mp4`，禁止覆盖当前版。

## 六、复现方法

前置条件：一份 `aavvcasdas/video-fx` 的 `arena/8be4c8f8-video-fx@82bede5` 检出、Node 与 `@napi-rs/canvas`、仓库自带字体、Python 3 + NumPy、ffmpeg（或 `imageio-ffmpeg`）。归档的 `vosk_words.json` 可直接复用；只有源 WAV 或台词变化时才需要重新跑 Vosk。

```bash
# 在 ai-yunying 仓库根目录执行；把 <video-fx> 换成实际检出路径
python3 'tools/day2制作/gen_day2_finalvoice.py' --video-fx-root <video-fx>

cp 'tools/day2制作/video-fx源码快照/day2_all.js' <video-fx>/src/ch/day2_all.js
cp 'tools/day2制作/video-fx源码快照/render_day2.mjs' <video-fx>/render_day2.mjs

cd <video-fx>
# 默认 original：正式像素形象；不要把输出直接覆盖仓库当前版，先写到临时文件验收
node render_day2.mjs --stills --character original
node render_day2.mjs --out /tmp/day2_original_check.mp4 --style clean --character original
```

只有制作候选对照或未来 mixed 加更时才复制姿势库并显式开启：

```bash
# 仍在 ai-yunying 仓库根目录执行
mkdir -p <video-fx>/assets/day2_poses
cp 'tools/day2制作/video-fx源码快照/day2_poses/'*.webp <video-fx>/assets/day2_poses/

cd <video-fx>
node render_day2.mjs --stills --character candidate
# 候选输出必须使用独立文件名，禁止写成 Day2 当前版
node render_day2.mjs --out /tmp/day2_candidate_check.mp4 --style clean --character candidate
```

生成器会重写 video-fx 工作区中的 `src/day2_timing.js`、`src/lyrics.js` 的 `LY`、`assets/day2_track.wav` 与 `assets/day2_envelope.js`，并刷新本仓库的对齐报告和 QA 切片。复跑后应先比较新 timing 与 `tools/day2制作/video-fx源码快照/day2_timing_measured.js`；若源 WAV、台词或 ASR 词数变化，固定 189 词范围即失效，必须重新转写、重新审定词序与边界，禁止套用旧 timing。

## 七、关键文件

| 文件 | 说明 |
|---|---|
| `Day2文案.md` | 已按实际 WAV 校准的 17-cue 文案、数据口径与发布稿 |
| `Day2配音台词.txt` | 与指定 WAV 实际朗读一致的 17 行台词 |
| `鲸鱼运营第三天_克隆配音_无BGM_v4.wav` | 用户指定源音轨，归档本体不改 |
| `成片/当前版/day2视频_指定配音实测对齐版.mp4` | 当前 Day2 成片，已恢复原像素形象版本 |
| `成片/候选版/day2高清动作形象候选版_未发布.mp4` | 高清动作全片内部对照，未发布、不得冒充 Day2 当前版 |
| `Day2加更_形象动作征集文案.md` | 19-cue 电视机第二稿：原版主持、屏内老版、屏外新版试穿、评论区遥控选台、200 条上限说明、抽评回复与发布稿 |
| `../tools/day2制作/gen_day2_finalvoice.py` | 损坏头容错读取、Vosk 映射、RMS 精修、timing/字幕/混音/包络生成器 |
| `../tools/day2制作/day2_audio_final/` | 189 词 ASR、对齐报告与 17 条 QA 切片 |
| `../tools/day2制作/video-fx源码快照/day2_all.js` | 17 cue + 尾卡分镜；原版默认，候选动作映射仅在显式开启时生效 |
| `../tools/day2制作/video-fx源码快照/render_day2.mjs` | Day2 clean 1920×1080 渲染器、35 张静帧入口与 `original/candidate/mixed` 形象门禁 |
| `../tools/day2制作/video-fx源码快照/day2_poses/` | 39 张候选姿势 WebP、来源说明与 MIT 许可证；只供试穿展示，不代表已定稿 |
| `../tools/day2制作/video-fx源码快照/day2_timing_measured.js` | 实测 timing 快照 |
| `../tools/day2制作/Day2指定配音对齐验收表.md` | 逐 cue 时间、F0、峰值、削顶、成片规格与 QA 结论 |
