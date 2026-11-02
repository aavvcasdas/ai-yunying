# Day9 样片制作

- `render_day9.mjs`：主渲染器，沿用 Day8 房间与 Day3 主演素材；无配音输出1920×1080/30fps。
- `样片回归检查.json`：字幕逐字/重叠、16镜画面变化与27时点电视边框固定检查。运行 `node tools/day9制作/render_day9.mjs --test`。
- `媒体核验.json` / `验收记录.md`：全片解码和抽查记录。
- `sample_timing.json`：**measured=false**，49行台词的样片临时节奏与分镜；无音源、无ASR，不得用作最终字幕。
- `逐句总览_*.jpg`：所有49行的中点抽查图；发现纸张遮脸后已缩小并移至腰侧。
- `抽帧/`：可重建缓存，不入库。

## 环境与命令

Node.js；`@napi-rs/canvas` 和 `@ffmpeg-installer/ffmpeg`（支持临时安装在 `/tmp/node_render/node_modules`），项目字体在 `video-fx/assets/fonts`。

```bash
mkdir -p /tmp/node_render
(cd /tmp/node_render && npm install @napi-rs/canvas @ffmpeg-installer/ffmpeg)
node tools/day9制作/render_day9.mjs --stills --all-lines
node tools/day9制作/render_day9.mjs
```

输出 `Day9/成片/Day9_笨鱼看同类_无配音样片.mp4`。不添加静音假音轨，不用TV占位音乐。

## 素材与版权边界

观影叙事来自根目录用户上传总结。总结中的 `~/.dsh/.../source.mp4` 是另一台机器的缓存路径，本工作区没有这些原片；电视采用代码绘制的示意场景和本项目角色素材，并持续标注“非原片”。不因标注来源就宣称可任意搬运原作。

## 正式版待办

收到用户确认的连续配音后，先保存原文件名及哈希，再做词级ASR与RMS修边。字幕、cue、所有镜头边界都重新实测；跑开场门禁、逐句抽帧和全片媒体核验后再交付有声成片。

## 有声终版（最新）

音源：`Day9/配音/鲸鱼看视频_克隆配音_最终版.wav`。生产时间轴：`voice_alignment.json`、`subtitle_timing.json`，两者为实测，保留真实source/hash。

```bash
# 已有ASR缓存时可复现修边与字幕
python3 tools/day9制作/finalize_alignment.py
node tools/day9制作/render_day9.mjs --voice Day9/配音/鲸鱼看视频_克隆配音_最终版.wav --alignment tools/day9制作/voice_alignment.json --subtitle-file tools/day9制作/subtitle_timing.json
# 同一组参数后追加 --test 或 --stills --all-lines 可回归/抽帧
```

有声输出独立命名`Day9_笨鱼看同类_配音对齐版.mp4`，不覆盖无声样片。渲染前校验音频SHA256；错用音源会拒绝。验收见`有声验收记录.md`及`有声媒体核验.json`。原始ASR可用`tools/day5制作/asr_align_day5.py`重建，参数`--voice`/`--lines Day9/Day9配音台词.txt`/`--cache tools/day9制作/asr_tokens.json`/`--out tools/day9制作/asr_alignment_raw.json`。

## 发布封面

运行 `node tools/day9制作/make_day9_cover.mjs`。用本项目角色/道具及最终成片的电视镜头做代码排版，输出3:4与4:3，不调用生图。台词和发布口径见`Day9/Day9发布物料.md`。
