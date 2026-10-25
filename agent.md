# AGENT.md — ai-yunying · 鲸鱼娘 DeepSeek 抖音运营项目

> 这份文件是给**接手的 agent / 协作脚本**看的操作手册。它描述项目是什么、文件在哪、怎么出片、有哪些硬约束。
> 人类可读的完整说明见 `README.md`；所有运营文案见 `docs/`。

---

## 0. 一句话定位

一个「**假装 AI 运营、实际真人运营**」的抖音连载号。主角是虚构角色「鲸鱼娘 DeepSeek」（同人二创，非官方）。
核心玩法：**每天公开真实数据账本 → 把评论区当下一集剧本 → 观众投票决定下一期**。
Day0 已发布（2026-10-24 09:02）。当前在做 Day1 及其后 14 天连载。

---

## 1. 硬约束（改任何内容前先读）

1. **人设不能崩**。对外永远是「鲸鱼娘」在运营，人类只负责「注册账号 / 审核 / 按发布键」。
   - 自称「本鱼」；呆萌、慢半拍、爱摸鱼、怕鱼片；回复外壳固定「本鱼 + 一个 emoji」。
   - 详见 `docs/05_真人扮AI运营SOP与合规清单.md`。
2. **数据必须是真的**。视频/文案里的播放、点赞、评论、涨粉全部来自后台截图或导出文件，**禁止编造**。
   - Day0 基线：播放 7.4 万 / 赞 3236 / 评论 634（导出 653）/ 分享 422 / 收藏 232 / 涨粉 907 / 2 秒跳出 34.46% / 完播率 3.31%。
3. **配音统一**：微软 Edge TTS **`zh-CN-XiaoyiNeural`（晓伊）**，**rate / pitch 不加任何偏移**。
   - 配置在 `config/tts.json`，生成脚本 `tools/生成配音.py`。脚本强制校验音色与零偏移，且根本不向 TTS 传 `--rate` / `--pitch`。
   - 不允许用其它音色、不允许加语速/音调偏移。
4. **合规三件套缺一不可**：视频前 3 秒起全程常驻「本视频含 AI 生成内容」角标 + 发布页勾选「AI 生成 / 虚构演绎」+ 主页写明「同人创作 · 非官方 · 虚构演绎」。
5. **本鱼打不了游戏**（没有手、拿不起手柄）。可以哼副歌、做 MV、做游戏梗表情包；**绝不承诺**实机录屏 / 代打 / 上分 / 抽卡。
6. **不做咒语攻防线**。v2 起已删除「下咒 / 变猫娘 / 开发者模式」主线；技术索取类只按红线礼貌拒绝。
7. **Git 分支固定**：只在 `arena/63c2a221-ai-yunying` 上工作与推送（`git push origin arena/63c2a221-ai-yunying`）。不要改 `main`。

---

## 2. 文件地图

### 用户提供的原始素材（不要改动）
| 文件 | 内容 |
|---|---|
| `微信图片_20261024235201_51_1.jpg` | Day0 后台数据截图 |
| `day0视频全部评论.txt` | 653 条评论导出（含账号自己的 197 条回复） |
| `day0视频的部分回复.md` | 348 条拟回复台账 + 十条红线 |
| `自己的day0文案.md` / `day0原视频.mp4` | Day0 口播稿与成片（82.5s，1280×720 横屏） |
| `参考day1文案.md` / `样片day1.mp4` | 对标号 Day1 参考（141s），只借鉴结构，数据绝不可抄 |

### 交付文档
| 文件 | 内容 |
|---|---|
| `docs/01_近期DeepSeek运营项目调研.md` | 2026-10 这波「AI 接管账号」案例、方法论、37 条来源 |
| `docs/02_Day0数据与评论诊断.md` | 漏斗诊断、12 桶评论分桶（含 MV/音乐/游戏点播 19 条）、回复数口径、目标表 |
| `docs/03_Day1运营文案.md` ⭐ | **Day1 主交付物**：发布包、逐镜分镜、主版/极速版逐字稿、画面文字、评论区话术、投票、回收表 |
| `docs/04_14天运营方向与文案骨架.md` | Day1–14 每日主题、钩子、金句、Plan B |
| `docs/05_真人扮AI运营SOP与合规清单.md` | 人设卡、每日 SOP、15 条红线、危机预案、发布前预检 |
| `docs/06_出片工具链与配音规范.md` | video-fx 分支血缘、源码快照、Edge TTS 规范、出片 5 步 |

### 脚本与配置
| 文件 | 作用 |
|---|---|
| `config/tts.json` | 配音唯一配置（晓伊，零偏移） |
| `tools/生成配音.py` | Edge TTS 一键配音（校验零偏移） |
| `tools/评论分类.py` | 零依赖评论分桶（12 桶 + 点播类合计） |
| `tools/video-fx/` | Day0 出片分支 `arena/8be4c8f8-video-fx`（commit `0147237`）的源码快照，媒体素材不入库 |
| `tools/video-fx/render_day1.mjs` | **Day1 竖屏渲染器**（本项目新增，见第 4 节） |
| `day1_配音稿.txt` / `day1_配音稿_极速版.txt` | 纯文本口播（456 字 / 298 字），直接送 TTS |
| `.github/workflows/tts.yml` | 云端生成晓伊配音的 workflow（沙箱访问不了微软端点时用） |

---

## 3. 环境与已知限制（2026-10-25 实测）

| 项 | 状态 |
|---|---|
| Node / npm | v22 / v10，可用；`registry.npmjs.org` 可访问 |
| `@napi-rs/canvas` | 可安装（装在 `/tmp/node_render/`，不入库） |
| ffmpeg / ffprobe | 系统级**没有**；用 Python 包 `imageio-ffmpeg` 提供的二进制（`.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`） |
| 中文字体 | 系统无中文字体；用 `/home/user/video-fx/assets/fonts/NotoSansSC-Bold.ttf`（或 `tools/video-fx/` 快照里同名文件）；**不入库**（5 MB） |
| Edge TTS | **沙箱内不可用**：`speech.platform.bing.com:443` 被网络白名单阻断（`ClientConnectorError`）。`edge-tts` 包本身可从 PyPI 安装，但连不上微软服务。→ **已用 GitHub Actions 云端生成成功**（见 `.github/workflows/tts.yml`，Runner 可访问微软服务），音频 + SRT 自动 commit 回分支 |
| Artifact 下载 | `gh run download` 会失败：artifact 存在 `productionresultssa1.blob.core.windows.net`，**不在白名单**。→ 改用 workflow 里「commit 回分支」这一步，`git pull` 取回即可 |
| 沙箱网络白名单 | 仅 `github.com` / `codeload.github.com` / `api.github.com` / `registry.npmjs.org` / `pypi.org` / `files.pythonhosted.org` |
| video-fx 完整克隆 | `/home/user/video-fx`（1.4 GB，含 mp4/mp3/png/字体）；**不属于本仓库**，不会推送 |
| 大文件 | 生成的 mp4/wav/依赖目录不要进 Git（见 `.gitignore`）；`audio/` 忽略 |

---

## 4. 出片流程（Day1 及以后每一集）

### 4.1 准备配音（晓伊，零偏移）
```bash
# 本机联网时（推荐）
pip install edge-tts
python3 tools/生成配音.py --text-file day1_配音稿.txt --output audio/day1.mp3
python3 tools/生成配音.py --text-file day1_配音稿_极速版.txt --output audio/day1_fast.mp3
```
沙箱内连不上微软端点时，走云端：
```bash
git push origin arena/63c2a221-ai-yunying   # 触发 tts.yml workflow
gh run list --workflow=tts.yml              # 查看运行
gh run download <run-id> -n day1-tts -D audio/   # 取回 mp3
```

### 4.2 准备素材（首次）
```bash
# fonts + 立绘来自 video-fx 克隆，脚本会自动寻找；缺失时显式指定：
cp -r /home/user/video-fx/assets/fonts /tmp/day1_assets/
node -e "require('/tmp/node_render/node_modules/@napi-rs/canvas')"   # 确认 canvas 可用
```

### 4.3 渲染竖屏画面（已实测跑通）
```bash
cd tools/video-fx

# 只出关键帧 PNG 目检（最快，先看版式再渲全片）
node render_day1.mjs --stills /tmp/day1_stills

# 带配音成片（推荐：同时传 --srt 做字幕精确对齐）
node render_day1.mjs --audio ../../audio/day1.mp3 --srt ../../audio/day1.srt \
  --out "../../out/Day1_主版_1080x1920.mp4"

# 极速版
node render_day1.mjs --fast --audio ../../audio/day1_fast.mp3 --srt ../../audio/day1_fast.srt \
  --out "../../out/Day1_极速版_1080x1920.mp4"

# 无配音时（静音轨兜底）
node render_day1.mjs --out ../../out/day1_无声.mp4
```

- 默认 **1080×1920 竖屏 9:16 / 30fps**，画面按 `docs/03` 第 3 节分镜表逐卡绘制。
- `--audio`：以音轨时长为准；`--srt`：优先用 Edge TTS 输出的 SRT 时间戳把每段字幕**精确对齐**到朗读节奏，缺 SRT 时退化为「按字幕字数加权」。
- `--fast`：渲染极速版（8 段分镜）。
- 渲染速度约 **60–70 fps**（3128 帧 ≈ 50 秒）；成片约 5–8 MB。
- 版式：顶部合规双角标 → 中部卡片（账本/会员证/信件/投票）→ 角色立绘 → 字幕框（y≈1400）→ 进度条。**CTA 徽章放在角色与字幕之间（y≈1252），避免被立绘遮挡。**
- 画面元素：全程 AI 标识角标、账本卡、3.31% 俱乐部会员证、五封来信卡、疑惑卡、点播卡、金句卡、A/B/C 投票卡、进度条、底部字幕。

### 4.3.1 实测时长（晓伊语速 ≈ 4.37 字/秒，比按 5.5 字/秒的估算慢）
| 版本 | 字数 | 实测配音时长 | 备注 |
|---|---:|---:|---|
| 主版 | 500（含标点） | **104.26s** | 原估算 83s，偏差 21s；以实测为准 |
| 极速版 | 325 | **65.23s** | 原估算 54s |

> 教训：**不要用固定字/秒估算配音时长**，一律以 `ffprobe` 实测 mp3 时长为准；分镜时长由 `--srt` 反推。

### 4.4 质检
```bash
FF=/home/user/ai-yunying/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
$FF -i out/day1_主版.mp4 -hide_banner 2>&1 | grep -E 'Duration|Stream'
# 抽 6 帧人工目检：0s / 3s / 12s / 40s / 65s / 结尾
```

### 4.5 推送
`out/` 已在 `.gitignore` 里（渲染中间产物不自动入库）。最终成片要显式加 `-f`：
```bash
git add -f out/Day1_主版_1080x1920.mp4 out/Day1_极速版_1080x1920.mp4
git commit -m "video: Day1 竖屏成片（主版 104s / 极速版 65s）"
git push origin arena/63c2a221-ai-yunying
```
> 注意：`audio/` 也在 `.gitignore` 里，但 workflow 用 `git add -f` 强制提交了配音与 SRT，这是有意的（配音是交付物的一部分）。

---

## 5. 文案与数据的单一事实来源

- **口播文字**：`day1_配音稿.txt`（主版）/ `day1_配音稿_极速版.txt`（极速版）。`docs/03` 第 4、5 节与这两个文件必须逐字一致；改一处要同步三处。
- **分镜与画面文字**：`docs/03` 第 3、6 节是渲染器的输入依据。
- **评论分桶数字**：`tools/评论分类.py` 的输出；`docs/02` 与之对应。
- **回复数梗**：对外统一说「**本鱼自己翻后台查到回了 300 多条，评论区只数出 197 条**」——数据是 AI 自己查的，**不能写成人类告诉它的**。

---

## 6. 常见坑

1. 别把 `参考day1文案.md` 的 51 万播放 / 2.8 万赞 / 五道咒语 / 一键三连抄进来。
2. 抖音已取消评论置顶；靠作者自评 3 条 + 高频回复把关键评论顶上去。
3. 账号回复 `小积木奈` 在评论导出里约占 197 条，解析评论时务必用 `--self-name 小积木奈` 过滤。
4. 视频里的观众评论截图要打码 ID；不出现 API key / 二维码 / 联系方式。
5. 鲸鱼娘形象源自社区同人「溟月」（CC BY-NC-SA 4.0），商业化前换自有形象。
6. 不要在同一天同号连发主版与极速版（同质内容互相抢流量）。
7. `render.mjs`（原分支）是 **1280×720 横屏 MV 卡点风**，不要直接拿来出 Day1；用 `render_day1.mjs`。
