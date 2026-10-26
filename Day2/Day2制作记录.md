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
- 用户随后把加更稿修订为 12 cue：住户数改为 1816 位，电视机从 B03 才出现，原 B12 删除，B06/B07 只用真实存在的姿势与像素动作，并授权先生成初步草稿供观看后再改。已生成的 Piper 初步草稿见下一节；它仍只是试穿展示，不宣布正式换形象，也不覆盖当前 Day2。

## 六、Day2 加更 Piper 初步草稿（待用户审看）

初步草稿：`成片/初步草稿/Day2加更_形象动作征集_piper初步草稿_draft.mp4`

| 项目 | 结果 |
|---|---|
| 剧本 | `Day2加更_形象动作征集文案.md` 第三稿修订版，共 12 cue |
| 逐句台词 | `Day2加更配音台词.txt`，12 行与 B01–B12 一一对应 |
| 声音 | Piper `zh_CN-huayan-medium` 本地占位声；不是最终的 Microsoft `zh-CN-XiaoyiNeural` |
| 模型校验 | ONNX SHA-256 `9929917bf8cabb26fd528ea44d3a6699c11e87317a14765312420be230be0f3d`；配置 SHA-256 `d521dc45504a8ccc99e325822b35946dd701840bfb07e3dbb31a40929ed6a82b` |
| 实测总长 | timing 65.815s；语音合计 61.114s，11 个 0.300s 句间间隔，尾帧 1.400s |
| 容器 / 视频 | 65.82s；1920×1080，30fps，H.264 High，yuv420p，约 3180kb/s；全片解码得到 1974 个视频帧 |
| 容器音频 | AAC-LC，48kHz，stereo，约 159kb/s |
| 文件大小 | 27,538,731 bytes |
| SHA-256 | `55d147b7f930161b0e2664738b4b1a900c1cfaf1afc622a4f3e363f6dfe79e15` |

12 句均从实际 WAV 样本数回读，未用字数估时：B01 0.000–4.911、B02 5.211–8.775、B03 9.075–12.663、B04 12.963–16.713、B05 17.013–22.144、B06 22.444–26.543、B07 26.843–33.460、B08 33.760–39.554、B09 39.854–46.599、B10 46.899–51.183、B11 51.483–58.821、B12 59.121–64.415。逐句文件、哈希、峰值、削顶和 F0 见 `../tools/day2加更制作/bonus_audio_piper/timeline_report.json`。

Piper 每句均经 `alimiter=limit=0.89,loudnorm=I=-16:TP=-1.5:LRA=11` 后处理；独立回读削顶均为 0，F0 中位数范围 187.37–225.24Hz，全部低于晓伊 290–330Hz 目标，所以画面右上角、文件名和 MP4 title/comment 都明确标作占位初步草稿。源混音峰值 0.868545、削顶 0；最终 MP4 解码音频峰值 0.867567、RMS 0.142175、削顶 0。最终换晓伊时必须把 12 cue 全部标脏、重新逐句合成和实测，不能直接套用这份 Piper timing 冒充终版。

视觉执行与 QA：

- B01、B02 只有新版与真实评论/回复卡，电视机和老版均不入画；B03 第一个检查点起电视机完整出现，此后老版只在屏幕里。
- B06 依次使用真实姿势文件 `daily-eat`、`daily-stretch`、`daily-gaming`；B07 电视内依次使用真实像素动作 `eat_white_rice`、`wake_stretch`、`token_wordle_sneak`。放大检查确认 `wake_stretch` 的实际画面是单侧举臂舒展加醒神黄光，不是双臂过头，文案已按实改写。
- B02 使用 `curious → meme-yes`：后者是星星眼举手肯定姿势，不冒充独立的真实点头图。
- 渲染器先生成 46 张静帧覆盖每 cue 的 12%/55%/88% 与 B03、B06、B07、尾帧关键点；成片后再抽第 0 帧、B02、B03、B06 三动作、B07 三动作与细节段、B09 计数前后、B11、B12 与尾帧共 15 帧复核；B06/B07/B08/B09/B12 的句内切换点按同文本多次 Piper 合成的音素对齐中位位置做句内近似校准，避免动作或标签明显抢在对应台词之前。
- 当前版 `day2视频_指定配音实测对齐版.mp4` 在草稿生成后复核仍为 27,213,164 bytes，SHA-256 `578988c40859a2c483e7e1432582d17ae21eab5de8d28f24320ee22e41271eb8`，未被覆盖。

## 七、复现方法

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

### Day2 加更初步草稿复现

Piper 63MB 模型本体不进入仓库；复现时需另行取得 `zh_CN-huayan-medium.onnx` 与同名 `.onnx.json`，先核对上节两个 SHA-256。仓库已经保存 12 句后处理 WAV 与 manifest；只有台词变更时才重新运行第一步。

```bash
# 仅在台词变更、需要重新生成 12 句占位 WAV 时执行
python3 tools/say.py --engine piper \
  --piper-model <zh_CN-huayan-medium.onnx> \
  --batch 'Day2/Day2加更配音台词.txt' \
  --outdir 'tools/day2加更制作/bonus_audio_piper'

# 从已保存的 WAV 重新生成实测 timing、混音轨与包络
python3 'tools/day2加更制作/gen_bonus_piper.py' \
  --video-fx-root <video-fx> \
  --piper-model <zh_CN-huayan-medium.onnx>

cp 'tools/day2加更制作/video-fx源码快照/day2_bonus_all.js' <video-fx>/src/ch/day2_bonus_all.js
cp 'tools/day2加更制作/video-fx源码快照/render_day2_bonus.mjs' <video-fx>/render_day2_bonus.mjs
mkdir -p <video-fx>/assets/day2_poses
cp 'tools/day2制作/video-fx源码快照/day2_poses/'*.webp <video-fx>/assets/day2_poses/

cd <video-fx>
NODE_PATH=<node_modules-with-@napi-rs/canvas> node render_day2_bonus.mjs --stills
NODE_PATH=<node_modules-with-@napi-rs/canvas> node render_day2_bonus.mjs \
  --out '/home/user/ai-yunying/Day2/成片/初步草稿/Day2加更_形象动作征集_piper初步草稿_draft.mp4'
```

`render_day2_bonus.mjs` 会拒绝非 Piper、非实测、非占位或 cue 数不是 12 的 timing，也会拒绝不含 `piper…draft` / “初步草稿”的输出名；不要为了省事放宽这些门禁。

## 八、关键文件

| 文件 | 说明 |
|---|---|
| `Day2文案.md` | 已按实际 WAV 校准的 17-cue 文案、数据口径与发布稿 |
| `Day2配音台词.txt` | 与指定 WAV 实际朗读一致的 17 行台词 |
| `鲸鱼运营第三天_克隆配音_无BGM_v4.wav` | 用户指定源音轨，归档本体不改 |
| `成片/当前版/day2视频_指定配音实测对齐版.mp4` | 当前 Day2 成片，已恢复原像素形象版本 |
| `成片/候选版/day2高清动作形象候选版_未发布.mp4` | 高清动作全片内部对照，未发布、不得冒充 Day2 当前版 |
| `Day2加更_形象动作征集文案.md` | 12-cue 剧本第三稿修订版：1816 位住户、电视机 B03 起出现、删除原 B12、B06/B07 使用真实动作 |
| `Day2加更配音台词.txt` | 与 B01–B12 一一对应的 12 行逐句合成输入 |
| `成片/初步草稿/Day2加更_形象动作征集_piper初步草稿_draft.mp4` | Piper 实测占位初步草稿，待用户观看后修改；不是 Day2 当前版，也不是发布版 |
| `../tools/day2加更制作/bonus_audio_piper/` | 12 句 Piper 后处理 WAV、manifest 与实测时间轴报告 |
| `../tools/day2加更制作/gen_bonus_piper.py` | Piper manifest/模型哈希门禁、独立回读、timing、混音与包络生成器 |
| `../tools/day2加更制作/video-fx源码快照/day2_bonus_all.js` | B01–B12 加更分镜；电视机只从 B03 起调用 |
| `../tools/day2加更制作/video-fx源码快照/render_day2_bonus.mjs` | 独立 Piper 初步草稿渲染器与输出命名门禁 |
| `../tools/day2加更制作/video-fx源码快照/day2_bonus_timing_piper_measured.js` | 12-cue Piper 实测 timing 快照 |
| `../tools/day2制作/gen_day2_finalvoice.py` | 损坏头容错读取、Vosk 映射、RMS 精修、timing/字幕/混音/包络生成器 |
| `../tools/day2制作/day2_audio_final/` | 189 词 ASR、对齐报告与 17 条 QA 切片 |
| `../tools/day2制作/video-fx源码快照/day2_all.js` | 17 cue + 尾卡分镜；原版默认，候选动作映射仅在显式开启时生效 |
| `../tools/day2制作/video-fx源码快照/render_day2.mjs` | Day2 clean 1920×1080 渲染器、35 张静帧入口与 `original/candidate/mixed` 形象门禁 |
| `../tools/day2制作/video-fx源码快照/day2_poses/` | 39 张候选姿势 WebP、来源说明与 MIT 许可证；只供试穿展示，不代表已定稿 |
| `../tools/day2制作/video-fx源码快照/day2_timing_measured.js` | 实测 timing 快照 |
| `../tools/day2制作/Day2指定配音对齐验收表.md` | 逐 cue 时间、F0、峰值、削顶、成片规格与 QA 结论 |
