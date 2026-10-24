# ai-yunying · 深海鲸鱼娘（蓝色大肥鱼）抖音 AI 运营与动画渲染项目库

本项目是 **「DeepSeek 鲸鱼娘 / 蓝色大肥鱼 AI 接管账号」** 的抖音 14 天连载运营、角色动画引擎（集成自 `aavvcasdas/video-fx` 的 `arena/8be4c8f8-video-fx` 分支并已清理全部 MV 模块，完整保留全员角色骨骼、31种情绪与28种大肥鱼动作）及派蒙语音合成（集成 `gaaiyun/ai-paimon` VITS 管线）的一体化仓库。

---

## 🎬 核心成品视频与渲染入口

* **[`day1_whale_girl.mp4`](./day1_whale_girl.mp4)** —— **已渲染完成的 Day 1 正式成片（`140.65s` / `4220帧` / `1280x720@30fps` / 100% 原版 `gaaiyun/ai-paimon` 派蒙真实语音配音）**
  * 音频：基于 `样片day1.mp4` 中的原版 `gaaiyun/ai-paimon` 派蒙真实语音主干，从派蒙原声字素库无损拼接合成真实 Day 0 账本数字（**播放7.4万、点赞3236、有907人关注了我、评论有634条**），全片 140.65 秒 100% 纯正派蒙原声，无机械电子音或背景杂音。
  * 画面：100% 融合对标样片 [`样片day1.mp4`](./样片day1.mp4) 的视觉卡片/进度条/猫娘羞耻度检测器、Day 0 抖音真实后台账本（[`微信图片_20261024235201_51_1.jpg`](./微信图片_20261024235201_51_1.jpg)：**播放量 7.4万、点赞 3236、涨粉 907、评论 634 已回 348 条、分享 422、收藏 232、17:00 单小时峰值 1.8万+**）以及 [`day0视频的部分回复.md`](./day0视频的部分回复.md) 中的真实读者神评。
* **[`whale_mv_multistyle.mp4`](./whale_mv_multistyle.mp4)** —— Day 0 出道成片（`82.5s` / `1280x720@30fps`）。
* **一键重新生成 Day 1 音频与视频**：
  ```bash
  # 1. 使用 gaaiyun/ai-paimon VITS 模型或分段语音合成并混音 Day 1 派蒙音轨 + 30fps 口型包络
  python3 tools/build_day1_audio.py
  # 2. 渲染 Day 1 完整视频 (1280x720 @ 30fps -> day1_whale_girl.mp4)
  node render_day1.mjs
  ```

---

## 📂 仓库核心文件索引

### 1. 原始运营数据与对标资产（Day 0 实操沉淀）
* [`自己的day0文案.md`](./自己的day0文案.md) —— 已发布的 Day 0《鲸鱼娘 DeepSeek 接管账号》82.5秒完整分镜、时间码与包装结构。
* [`参考day1文案.md`](./参考day1文案.md) & [`样片day1.mp4`](./样片day1.mp4) —— 对标爆款《鲸鱼娘 Day 1：五道咒语全破解》样片与结构拆解。
* [`微信图片_20261024235201_51_1.jpg`](./微信图片_20261024235201_51_1.jpg) —— 抖音 Day 0 真实后台作品数据截图（7.4万播放 / 3236点赞 / 907涨粉 / 634评论 / 422分享 / 232收藏）。
* [`day0视频的部分回复.md`](./day0视频的部分回复.md) —— 抖音 Day 0 视频下 **348 条真实用户评论与呆萌版回复合集**，内含核心**「呆萌人设口径 + 六型句式反模板 + 十条安全红线」**。

### 2. 14天完整文案企划、全网同款拆解与真AI接管架构
* [`路线一_人工伪装AI运营_14天完整企划与逐日脚本.md`](./路线一_人工伪装AI运营_14天完整企划与逐日脚本.md)
  * **Day 1 – Day 14 完整逐日文案与分镜表**：已将 Day 0 真实账本（7.4万播放/3236点赞/907涨粉/634评论已回348条）与 348 条真实评论代表作完整融入 Day 1–14 剧本。
* [`调研报告_近期DeepSeek与AI运营账号项目拆解.md`](./调研报告_近期DeepSeek与AI运营账号项目拆解.md)
  * 拆解 2026 年 10 月中下旬 B 站/抖音现象级爆款（`DeepSeek鲸鱼娘在运营`、`Claude大小姐在运营`、`Claude和DS在营业`）及 GitHub 7 大最新开源工具链。
* [`路线二_真AI接管运营_技术架构与Agent交接方案.md`](./路线二_真AI接管运营_技术架构与Agent交接方案.md)
  * 95% AI 自动化 + 5% 人类守门员防封号架构、双模型策划会机制、开源工具拼装指南，以及可直接复制喂给 Claude Code / DeepSeek Harness 的《项目交接总指令》。

### 3. 角色骨骼引擎与派蒙 VITS 语音模块（已移除 MV 模块，完整保留角色库）
* `src/` —— 核心渲染与角色动画引擎（已移除全部 `mv_*.js`）：
  * `src/core.js`：多风格渲染内核（像素/水彩/赛博霓虹/孔版/浮世绘）与 30fps 口型/节拍同步。
  * `src/whale_girl_rig_data.js` / `src/whale_girl.js` / `src/whale_girl_actions.js`：深海鲸鱼娘 7 部件骨骼、31种情绪、5旋转视图、16种帽饰（含猫耳 `catEars`）与 28 种大肥鱼专属动作（含 `eat_white_rice`、`coin_hug`、`fatfish_working`、`drawFatFish` 等）。
  * `src/cast.js` / `src/clawd.js` / `src/props.js`：全员 8 角色库（含 `ladyClaude`、`ladyGemini`、`researcher`、`bionicPuppy`、`miniWhale`、`biliTvMascot`、`agentReachBot`、`clawd`）。
  * `src/day1_story.js`：Day 1《五道人类咒语全破解》9 幕完整分镜与动态卡片渲染器。
* `paimon_tts/` —— 集成自 `gaaiyun/ai-paimon` 的 VITS 派蒙语音服务端（`vits_server/`）与合成脚本（`synthesize_day1_vits.py`）。
* `characters/` & `docs/` & `studio.html` —— 角色三视图、31种情绪设定表、28种动作表与交互式角色工坊。
