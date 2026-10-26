# Day 2 制作记录（指定配音实测对齐 + 视觉升级版）

> 完成日期：2026-10-26
> 当前成片：`成片/当前版/day2视频_指定配音实测对齐版.mp4`
> 逐 cue 数字与最终验收结论见：`../tools/day2制作/Day2指定配音对齐验收表.md`

## 一、最终产物

| 项目 | 结果 |
|---|---|
| 成片 | `成片/当前版/day2视频_指定配音实测对齐版.mp4` |
| 时长 / 视频样本 | 容器 104.720s / 3141 个视频样本（渲染管线生成 3142 张原始帧，`-shortest` 后的样本数与升级前一致） |
| 视频 | 1920×1080，30fps，H.264 High，yuv420p，约 2541kb/s；x264 `animation` 调优、CRF 17 |
| 音频 | AAC-LC，48kHz，stereo，160kb/s；与升级前成片抽出的 AAC 流逐字节一致 |
| 文件大小 | 35,478,673 bytes |
| SHA-256 | `6d6f355c62c4760d36baf0de6a4cac36b5dd6267de45db95aa237ece026a3142` |
| 制作基线 | `aavvcasdas/video-fx` 分支 `arena/8be4c8f8-video-fx`，基线提交 `82bede5` |
| 视觉基线 | 39 张 512×512 完整姿势 WebP；本片实际使用 24 种姿势，像素骨架只作无素材注入时的安全回退 |
| 解码验收 | ffmpeg 全片解码通过；35 张生产静帧及最终 MP4 的第 0 帧、L01、L03、L12、L14、L17、尾卡抽帧已复核 |

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
- 主角改为完整姿势立绘整图切换：眼睛、嘴、发丝、女仆装、鲸鱼围裙与尾巴都来自同一张自洽姿势图，不再把脸部贴片或肤色眼睑叠到另一套骨架上。旧像素骨架只保留为无素材注入时的回退，且仍固定 `tailScale=1.0`、wink 使用 heart 后发。
- 背景、卡片字与字幕继续走 clean 原生 1920×1080 绘制；左上只保留小号 Day2 HUD，右上保留“非官方同人 · AI 生成内容”。

静帧阶段除原有构图问题外，本轮重点修复了 L03 白眼、L12 手持碗与地面碗重复、L17 绿色尾尖伪影和吃饭蒸汽过重，并减轻终段动作对文字的遮挡。修复后生成 35 张 1920×1080 检查帧并完成整片渲染。

## 四、视觉升级审查与实现

### 1. 白眼与模糊的根因

- 用户截图对应 L03（14.975–21.660s）后段。旧像素骨架把 `deadpan` 映射为 `eyes: 'lids'`，再用肤色矩形覆盖虹膜上部；面部尺寸较小时整块眼睛被盖成接近白色。根因是眼睑覆盖，不是 `shy_fidget` 动作本身。
- L03 现在按台词节拍整图切换 `thinking → curious → failure → meme-doge`，四张图都保留原生蓝色虹膜；最终 MP4 在 21.13s 抽帧放大复核，白色盖眼已消失。
- 无姿势素材注入而走像素回退时，`safePixelOptions()` 会把 `lids`、`dead`、`deadpan`、`sleepy`、`smug` 净化为睁眼状态，并把所有回退情形的 `squint` 限制在 0.44 以下，避免同类问题从其他表情或过渡帧复发。
- “太模糊”的主要瓶颈不是最终分辨率：旧主角的面部和服饰只有低细节像素骨架信息，放大到 1080p 后靠锐化或提高码率也补不出发丝、蕾丝和围裙纹样。新版改用 512×512 完整姿势图，39 张素材的 alpha 包围盒高 480–496px，而角色在 1080p 中的目标高约 347–420px（未计逐姿态系数），主要为高质量缩样；编码同时从 CRF 19 提升为 x264 `animation` + CRF 17。

### 2. 两个参考仓库的审查结论

- `Sutera-Diffusus/dsh-whale-musume@edd215dd8cab297084d6a45be6d69f02a800ecfc`：完整审查了 92 张生成姿势、状态/动作选择逻辑及素材生成/切片脚本。仓库与包元数据均为 MIT，未发现把这批生成素材排除在许可外的声明。本项目按原文件精选复制 39 张 WebP，并把完整 MIT 文本、来源提交和文件清单保存在 `../tools/day2制作/video-fx源码快照/day2_poses/`。
- `LIN428924379/baifanyu@f46a2ce6f012cb410c6c2b10b28904e45238985e`：审查了 README、核心 Java、表情总图工具与 42 张立绘。该项目明确说明代码 MIT 之外，美术资源只允许个人非商业使用；因此没有复制它的图片、音频、图标或代码。只借鉴其制作结论：表情应整图切换而不是贴脸拼接；每个姿势按自身包围盒锚定；角色用呼吸浮沉和行走倾斜保持生命力。
- 没有实现桌面宠物、Android 悬浮窗、拖拽、存档、养成或小游戏；所有新增能力都只服务于视频分镜。

### 3. 新增动作系统

- 渲染器启动时严格预载 39 张姿势并逐张校验 512×512 与 alpha 包围盒；缺图会直接报错，不会静默退回低清骨架。姿态按包围盒脚底锚定、等高缩放，宽幅、蹲坐或横向尾巴姿势另有高度系数。
- `day2_all.js` 新增三层选择：镜头可直接指定 `spritePose`；已有 `action` 可经别名表映射到吃饭、睡眠、游戏、工作、调试、灵感、伸懒腰、头/肚子/尾巴反应、庆祝、甩尾等完整姿势；已有 `emotion` 可映射到思考、好奇、失败、得意、无语、害羞、星星眼、招手、眨眼等表情姿势。
- 上游 `evaluateAction()` 的位移、挤压、步频、头部倾斜、旋转与尾巴摆动被衰减后用于整图变换，再叠加约 2.4 秒呼吸、语音包络微浮动、姿态切换 squash、行走颠簸和逐姿态微动作。因此新增的是可实际调用的镜头动作，而不是只把静态图片排成幻灯片。
- 本片实际出现 24 种姿势；其余 15 种保留在动作库供后续视频调用。源图中带大面积白圆眼的 `meme-shock` 没有导入；尾尖带青绿色伪影的 `tail-swing` 不作为生产映射，甩尾统一使用干净的 `react-tail`。

## 五、音频与画面 QA 摘要

- 17 条 QA 切片独立回读：时长与 `alignment_report.json` 误差 0.000s，削顶合计 0。
- 本轮实际渲染使用的 `day2_timing.js` 与仓库 `day2_timing_measured.js` SHA-256 同为 `e71f931654c77bbf51dc423fe27572e33e1a70b5e74a9dbf2189b44790659bbe`；17 cue、尾卡和总时长均未漂移。
- 最终 MP4 音频：mean volume -19.9dB，max volume -4.4dB；loudnorm 测量 integrated -15.49 LUFS、true peak -4.42dBTP、LRA 3.10 LU。升级前后 MP4 抽出的 AAC 流均为 2,123,373 bytes，SHA-256 同为 `cd462f92156486109e47996781ac7a894823541d72179950871da075dcde1e13`，证明本轮没有改音轨。
- 35 张代表静帧覆盖第 0 帧、每个 cue、L03 70%/92%、L09 45%、L10/L11 88%、L12 18%、L14 18%/50%、L15 62%、L17 20%/72%/88%/96%/99% 与尾卡；最终 MP4 再抽查第 0 帧、L01 55%、L03 92% 面部放大、L12 18%、L14 18%、L17 88% 和尾卡，编码后蓝眼、发丝、围裙与尾巴细节仍清楚。

完整逐 cue 表见 `../tools/day2制作/Day2指定配音对齐验收表.md`。

## 六、复现方法

前置条件：一份 `aavvcasdas/video-fx` 的 `arena/8be4c8f8-video-fx@82bede5` 检出、Node 与 `@napi-rs/canvas`、仓库自带字体、Python 3 + NumPy、ffmpeg（或 `imageio-ffmpeg`）。归档的 `vosk_words.json` 可直接复用；只有源 WAV 或台词变化时才需要重新跑 Vosk。

```bash
# 在 ai-yunying 仓库根目录执行；把 <video-fx> 换成实际检出路径
python3 'tools/day2制作/gen_day2_finalvoice.py' --video-fx-root <video-fx>

cp 'tools/day2制作/video-fx源码快照/day2_all.js' <video-fx>/src/ch/day2_all.js
cp 'tools/day2制作/video-fx源码快照/render_day2.mjs' <video-fx>/render_day2.mjs
mkdir -p <video-fx>/assets/day2_poses
cp 'tools/day2制作/video-fx源码快照/day2_poses/'*.webp <video-fx>/assets/day2_poses/

cd <video-fx>
node render_day2.mjs --stills
node render_day2.mjs --out whale_day2.mp4 --style clean
```

生成器会重写 video-fx 工作区中的 `src/day2_timing.js`、`src/lyrics.js` 的 `LY`、`assets/day2_track.wav` 与 `assets/day2_envelope.js`，并刷新本仓库的对齐报告和 QA 切片。复跑后应先比较新 timing 与 `tools/day2制作/video-fx源码快照/day2_timing_measured.js`；若源 WAV、台词或 ASR 词数变化，固定 189 词范围即失效，必须重新转写、重新审定词序与边界，禁止套用旧 timing。

## 七、关键文件

| 文件 | 说明 |
|---|---|
| `Day2文案.md` | 已按实际 WAV 校准的 17-cue 文案、数据口径与发布稿 |
| `Day2配音台词.txt` | 与指定 WAV 实际朗读一致的 17 行台词 |
| `鲸鱼运营第三天_克隆配音_无BGM_v4.wav` | 用户指定源音轨，归档本体不改 |
| `成片/当前版/day2视频_指定配音实测对齐版.mp4` | 当前 Day2 成片 |
| `../tools/day2制作/gen_day2_finalvoice.py` | 损坏头容错读取、Vosk 映射、RMS 精修、timing/字幕/混音/包络生成器 |
| `../tools/day2制作/day2_audio_final/` | 189 词 ASR、对齐报告与 17 条 QA 切片 |
| `../tools/day2制作/video-fx源码快照/day2_all.js` | 17 cue + 尾卡分镜、39 姿势库映射、镜头动作节拍、呼吸/步态/逐姿态微动作与像素回退白眼净化 |
| `../tools/day2制作/video-fx源码快照/render_day2.mjs` | Day2 clean 1920×1080 渲染器、39 图严格预载/bbox 测量、35 张静帧入口与 CRF 17 编码 |
| `../tools/day2制作/video-fx源码快照/day2_poses/` | 39 张精选 512×512 WebP、`ATTRIBUTION.md` 与 DSH MIT 许可证文本 |
| `../tools/day2制作/video-fx源码快照/day2_timing_measured.js` | 实测 timing 快照 |
| `../tools/day2制作/Day2指定配音对齐验收表.md` | 逐 cue 时间、F0、峰值、削顶、成片规格与 QA 结论 |
