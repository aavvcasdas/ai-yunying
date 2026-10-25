# video-fx 源码快照（Day0 出片分支）

> 这是 `aavvcasdas/video-fx` 仓库 `arena/8be4c8f8-video-fx` 分支的**纯源码快照**，用于日后复刻 Day0 的视觉风格来出 Day1–Day14。完整说明见 [`docs/06_出片工具链与配音规范.md`](../../docs/06_出片工具链与配音规范.md)。

| 项 | 值 |
|---|---|
| 来源 | https://github.com/aavvcasdas/video-fx/tree/arena%2F8be4c8f8-video-fx |
| 分支 | `arena/8be4c8f8-video-fx` |
| 快照 commit | `014723762a15392b782e9acea05d8d37e36156a8`（2026-10-24） |
| 本目录内容 | 51 个 `.js` / `.mjs` / `.html` / `.md`，2.46 MB |
| 未包含 | 所有 mp4 / mp3 / png / 字体（原分支约 444 MB），避免把大体积生成物塞进 Git |

## Day0 对应关系

`day0原视频.mp4` ≡ 原分支 `whale_mv_watercolor.mp4`（MD5 `2869fd20…`，完全一致）。分镜见 `src/ch/c01_debut.js` ~ `c04_rivalry_finale.js`，字幕在 `src/lyrics.js`，口型包络来自 `assets/audio_envelope.js`。

## 恢复媒体素材

```bash
cp -r /home/user/video-fx/assets /home/user/video-fx/characters /home/user/video-fx/mv ./
# 或重新克隆
git clone --branch 'arena/8be4c8f8-video-fx' --single-branch https://github.com/aavvcasdas/video-fx.git
```

## 配音规范（重要）

本分支的音频都是预生成文件，**没有配音生成代码**。全项目配音统一使用：

- 引擎：微软 Edge TTS（包名 `edge-tts`）
- 音色：`zh-CN-XiaoyiNeural`（晓伊）
- **rate / pitch 均不加偏移**（调用时不传 `--rate` / `--pitch`）

配置见 `../../config/tts.json`，一键生成见 `../生成配音.py`。出片时把生成的 mp3 重新提取包络后喂给 `src/core.js` 的 `voiceAt(t)`，口型才能对上。
