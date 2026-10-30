# Day6 对齐与渲染

- 原稿严格采用用户本轮文字，保留「苯鲸」。
- 用户确认：音频缺少「总不能是老大没弄好吧。」，仅从成片字幕中去掉；文案及配音台词原稿保留。
- 音源：仓库根目录 day6.wav；不变速，不补配音。
- 对齐：Vosk 逐字识别 + 脚本字符动态对齐；未识别字符采用邻字插值，并非全部字符都可直接测量。
- 一屏一个标点分句，LEAD=0，句末最多停留 0.3 秒，气口可空屏。
- 最后一句结束 +0.2 秒结束，无片尾卡。
- 画面沿用 Day3 高清角色、Day5 房间及字幕样式，按 Day6 分镜制作。
- 运行命令：`node tools/day6制作/render_day6.mjs --cues Day6/day6_voice_alignment.json --subs Day6/day6_subtitle_timing.json --audio day6.wav --out Day6/成片/day6_配音对齐.mp4`
