# agent.md —— Day1 鲸鱼娘运营日志视频制作（基于 video-fx 引擎）

## 一、项目定位
- 账号人设：深海鲸鱼娘 DeepSeek（“人类已下班，本号由 AI 接管”）
- 配音统一：微软 Edge TTS `zh-CN-XiaoyiNeural`（晓伊），`rate=+0%` `pitch=+0Hz`，不加偏移
- 分辨率：1280×720，30fps
- 画面风格：16-bit 像素风（pixel），可复用 watercolor / risograph / neon / ukiyoe
- 音画同步：排画面卡点只准用 TTS 真实时长（ffprobe 读取），禁止按字数估算

## 二、目录结构
```
video-fx-day1/
├── agent.md              # 本文件：制作规范与可复用命令
├── day1_script.txt       # Day1 完整台词文本（供 TTS 合成）
├── day1_script_srt.txt   # 可选：带时间码的 SRT（由 sync_audio.py 生成）
├── render_day1.mjs       # Day1 视频渲染脚本（无声，供后期合成音频）
├── index.html            # 浏览器预览工作台
├── assets/               # 字体、音效、背景素材
├── src/
│   ├── core.js           # 引擎核心：画布、调色板、转场（iris/curtains/brushWipe/smokeWipe/spotDark）
│   ├── whale_girl.js     # 主角渲染：31 情绪 + 28 动作（eat_white_rice / ciallo_wink / heart / wave …）
│   ├── whale_girl_actions.js # 28 名动作定义（codex-deepseek-pet × dsh-dayu-fish-skin）
│   ├── timeline.js       # 章节注册与帧渲染入口
│   ├── lyrics_day1.js    # Day1 字幕时间轴（需按 TTS 真实时长校对）
│   ├── ch/day1_intro.js  # 第 1 章：开场 + 数据交账本
│   ├── ch/day1_comments.js # 第 2 章：评论区会议室，逐条回复 Day0 真实留言
│   └── ch/day1_outro.js  # 第 3 章：深度思考 + 正事 + Day2 预告 + 结尾 CTA
└── node_modules/         # @napi-rs/canvas（渲染依赖，已 .gitignore）
```

## 三、可复用命令

### 1. TTS 合成（~/tools/say.py）
```bash
# 单句合成（推荐，便于逐句拿到真实时长）
python3 ~/tools/say.py "哈喽，大家！我是鲸鱼娘。" day1_audio/001.mp3

# 批量合成（从文件按行读取）
python3 ~/tools/say.py --file day1_script.txt --out day1_audio/
```

`say.py` 内部执行：
```
edge-tts --voice zh-CN-XiaoyiNeural --rate=+0% --pitch=+0Hz --text "<台词>" --write-media "<文件>"
```
合成后自动：
- 用 `ffprobe` 回报真实时长（秒）
- 用自相关法估算人声 f0 中位，应在 `290–330 Hz`；不达标需调整后重合成

### 2. 音视频合成
```bash
# 将无声视频与生成的音频合并
ffmpeg -i day1_whale_girl_silent.mp4 -i day1_audio.mp3 -c:v copy -c:a aac -shortest day1_final.mp4
```

### 3. 重新渲染无声视频
```bash
cd video-fx-day1
node render_day1.mjs
```
输出：`day1_whale_girl_silent.mp4`（128秒，30fps）

## 四、音画卡点同步规范（重要）
1. 先用 `say.py` 把 `day1_script.txt` 逐句合成，拿到每句真实时长。
2. 用真实时长累加，生成每句的 `[start, end]` 时间码。
3. 更新 `src/lyrics_day1.js` 中 `LY` 数组的 `[start_sec, end_sec]`，必须与 TTS 真实时长一致，禁止按字数估算。
4. 每句台词对应一个主角动作（见 `whale_girl_actions.js` 的 28 个 action ID），动作切换点应落在 TTS 句首或句中重音点。
5. 转场（`core.js` 提供 `iris`, `curtains`, `brushWipe`, `smokeWipe`, `spotDark`）应在章节切换处插入，避免画面长时间静止。

## 五、已知限制（当前沙箱）
- 本沙箱无法连接 `speech.platform.bing.com`，`edge-tts` 无法在此直接运行。
- 已生成无声版本视频 `day1_whale_girl_silent.mp4`，请在可联网环境下用 `say.py` 生成晓伊配音，再用 ffmpeg 合成。

## 六、视频内容要点（基于 Day0 真实数据）
| 指标 | 数值 |
|---|---|
| 涨粉 | 907 个 |
| 播放量 | 7.4 万 |
| 点赞 | 3236 |
| 评论 | 653 条 |
| 完播率 | 3.31% |

新增文案：
- “3.31% 看完扣🍚领元老勋章。”
- “一，30 条催回信。咦？本鱼自己翻了翻后台，回了 300 多条，评论区只数出 197 条。剩下的一百多条，是不是被鱼叼走了🫧”
- “19 条点播。有人点《朋友的酒》，有人要 MV；还有人问我打不打三角洲、王者。本鱼没手，游戏真打不了😳 MV 还在肚子里，先游两圈🫧。”

## 七、十条红线（评论区/文案绝对不碰）
1. 不写“已关注/已点赞” → 记住名字、记在本子上
2. 不教任何技术实现 → “本鱼自己都不会”
3. 不加任何联系方式 → “在这儿聊就挺好”
4. 不报钱（成本/收入） → “费饭不费钱”“不敢算”
5. 不评价其他 AI、不接拉踩 → “打不过”“别比啦”
6. 不碰时政与口号 → “只懂吃饭”
7. 不承诺更新 → “尽量”“有空更”
8. 不承诺收益 → “够吃就行”
9. 真求助要跳出人设 → 指路官方客服
10. 不接骂、不讨好 → “死的那个不在，活着这条在这儿”
