# Day10 当前入口：鲸鱼架空有声版

## 当前成片

- `成片/Day10_鲸鱼架空_配音对齐版.mp4`：完整八镜、二十三行、二十五字幕屏，原指定配音速度；1920×1080 / 30fps / 1784帧 / 约59.467秒。
- 源音频：根目录 `鲸鱼架空_克隆配音_最终版.wav`，59.2秒、40000Hz双声道，原文件不改。SHA256 `ffd3f521901aaaab0fbcaaa4df869891a721d35df3e138d6e94220cd51ac3ddc`。
- `Day10配音台词.txt` / `Day10文案.md`：用户指定二十三行，前十二行锁定，不改字。
- `Day10分镜_新版规划.md` 已更新为实际构造与实施说明；旧配音前规划保存在 `历史/Day10分镜_23行配音前规划.md`。
- 封面文案、标题和简介：`Day10发布物料.md`。本轮交封面文字，不宣称另外生成封面图片。

## 正式制作与验收入口

- `../tools/day10制作/render_day10_full.mjs`
- `voice_alignment.json` / `subtitle_timing.json`（measured=true）及 `字幕/Day10字幕.srt`
- `asr_tokens.json` / `asr_alignment_raw.json` / `asr_unconstrained.json` / `finalize_alignment.py` 留识别与修边依据。
- `gate_config.json` 指向这份音源和成片；`有声_final门禁.json` / `gate_media_report.json` 为当前全阶段/媒体结果，依实际报告判断是否通过。
- `有声成片抽帧/`、`Day10_有声分镜总览.jpg` 与 `有声_渲染自检.json` 记录镜头样本及接触。不能把解析接触或自动检查当完整OCR/审美批准。

```sh
PYTHONPATH=/tmp/day10-python python3 tools/gate.py --day 10 --stage final --report tools/day10制作/有声_final门禁.json
node tools/day10制作/render_day10_full.mjs --stills
node tools/day10制作/render_day10_full.mjs
```

/tmp 依赖不会随 Git 保存；Python 需 numpy，ASR重跑另需 vosk/中文模型；Node 需 Canvas/Resvg 与 ffmpeg，安装方法沿用 `../tools/互动元素/README.md`。重渲前先读 agent.md 第17/20/21条及当集验收，不拿新文案套旧音频。

## 历史保留

- `成片/Day10_词点互动_无声结构样片.mp4`（提交 b8184d4）：十九秒技术样片，未覆盖；旧规划轴仍为 measured=false，不用于正式字幕。
- 二百零一字验收选题稿在 `历史/`，报告在 `../tools/day10制作/历史_201字稿/`，不是当前文字。
- 当前二百零五字稿的配音前估时和规划测试保留，状态由本页实测版本覆盖；此前“缺音频/没有 full renderer”均为当时状态。
