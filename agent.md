# ai-yunying agent.md — 鲸鱼娘运营与制作总规范

> 本文件从制作仓库 `aavvcasdas/video-fx` 分支 `arena/8be4c8f8-video-fx`（基线 `82bede5`）的 `agent.md` 独立抽出，并在文首补入 `ai-yunying` 的现行覆盖规则。下方保留的 video-fx 原文用于理解角色骨架、动作系统和渲染架构；若原文的 MV 专项指令与这里的覆盖规则冲突，**以本节覆盖规则为准**。

## 0. ai-yunying 现行覆盖规则（优先级最高）

1. **仓库分工**：跨集规划放 `00_运营总览/`；每集文案、配音源文件和成片放对应 `DayN/`；全部运营原始数据、评论导出、回复合集和数据图片放 `参考资料/运营数据/DayN/`；制作代码、源码快照、对齐报告和验收归档放 `tools/dayN制作/`。
2. **事实口径**：数字、票数、评论署名必须回溯到仓库内截图/导出文件或用户明确给出的数据；不得把导出子集写成平台全量定论，也不得展示主人真实账号信息。
3. **时间轴门禁**：cue 起止只能来自实测音频。连续 WAV 先做词级 ASR，再用波形 RMS 修正发声边界；禁止按字数估算。切换音频后必须重新生成 timing、字幕与对齐报告。
4. **声音口径**：用户提供的成段 WAV 只按其真实文件名、哈希和可测指标记录；没有可验证引擎元数据时，不得冒充 Microsoft 晓伊或任何指定 TTS。Piper 只能作明确标注的结构占位，不能冒充终版。
5. **Day2 开场**：禁止复用前两集红幕/舞台全屏标题卡。`TITLE_LEN=0`，第一帧直接进入桌面开票；渲染前必须抽查第 0 帧及 L01 多个进度帧。若源 WAV 自带片头静音，只可在成片混音轨中裁掉静音并同步平移全部 cue，原始 WAV 不改。
6. **画面不变量**：主角使用像素骨架、`tailScale=1.0`、wink 使用 heart 后发；默认 clean 原生 1920×1080 栅格化，背景、卡片字和字幕保持清晰。video-fx 原文中任何“缩小尾巴”等 MV 专项做法不适用于本系列正片。
7. **内容边界**：保留“非官方同人 / AI 生成”标识；不使用“官方艺名”；薄肌只写运动、蛋白质与睡眠，不写节食、体脂目标或医疗建议。
8. **交付门禁**：最终 MP4 必须完成全片解码、分辨率/帧率/时长/音轨核验，并抽查每个 cue 的关键帧字幕一致性；制作源码、timing、对齐报告、验收表须同步归档到 `tools/dayN制作/` 后再提交推送。
9. **形象路线用词必须分清**：`video-fx` 的像素骨架是“原版/旧版主形象”；DSH 的 39 张图是“完整姿势表情包素材库”，不是 39 个骨骼动作，也不得直接称作已定版“新版主演”。当前只允许两条待选路线：A）在原像素骨架上沿用先前项目的动作、表情、视角、道具和分镜方法更新；B）主角保持旧版只加动作，DSH 表情包只进入电视、目录或征集展示。未经用户明确选定，不得宣布正式换形象。
10. **禁止随机装饰堆叠**：不得再用双蝴蝶结、金铃铛、星星发夹、围裙星星、金边贴片、角色光圈、环绕星光等即兴 overlay 冒充“形象升级”；这类做法已被用户明确否决。所谓“跟着之前的项目更新”，只能调用先前项目已经存在的像素 rig、28 个动作、31 种情绪、五种视角、既有头部/服装细节、动作道具和场景编排。任何新饰品若不在先前项目注册表中，必须先单独征求用户确认。
11. **眼睛白线硬门禁**：原像素 rig 的眨眼/眯眼逻辑会用肤色矩形盖住虹膜，截图中会形成白色横线；正片与样片的旧版主角必须同时满足：不用 `eyes='lids'|'dead'`，不用会把单眼画闭的 `wink` 头部（渲染时以 `wave` 头部替换 `wink` 头部、保留叉腰等身体骨骼），并把 `squint` 固定为 `0.01` 以绕过 rig 中 `o.squint || autoBlink` 的自动眨眼肤色盖眼分支。唯一语义例外是 `sleep_curl` 可用 rig 的 `happy` 深色闭眼弧线，但仍必须保持 `squint=0.01` 并强制 `heart` 骨骼，禁止被 `sleepy` 情绪预设抢成 laptop 姿势。交付前必须抽查近景帧，确认睁眼时双眼虹膜没有肤色横带、睡觉时只有深色弧线，不能只看代码便宣称已修复。
12. **人物不能只站着弹跳**：每个有台词的镜头至少要有一个与台词语义相符的先前项目动作，或明确的走位、转身、道具互动；只用 `move('bounce')`、呼吸和尾巴微摆不算完成动作编排。动作目录镜头还必须显示编号、英文 ID 与中文名，并给足动作周期，不能用三四个代表动作冒充“全部展示”。
13. **背景与电视完整性**：主背景不得再退化为“一张深色墙 + 一条全宽桌板 + 单个舷窗 + 气泡”；应有墙面层次、灯串/台灯、书架、留言墙、桌面物件、植物、地毯或地板层次等有用途的场景细节。电视里必须是按比例缩小的完整场景（墙、地板、家具/道具、角色动画与小场景元素一起缩小），禁止在纯色屏上只放一只孤立角色。当前加更分镜中电视仍从 B03 才出现，B01/B02 不得提前出现。
14. **完整目录口径**：先前项目可调用资产分为两组，必须分别计数、分别验收：DSH 静态完整姿势图 **39 张**；`video-fx` 像素骨架规范动作 **28 个**。今后凡样片或说明声称“动作全展示”，必须在代码注册表中逐项枚举，并在样片中让 39 张姿势与 28 个动作都以可辨认标签出现；不得把静态姿势切换说成骨骼动作，也不得把 28 个动作中的少数几个说成 39 个。
15. **自称与称呼口径（Day3 起）**：主角默认自称「本鲸」，傲娇或伪装亮相时可用「本小姐」；「本鱼」只保留在自嘲、引述 Day1/Day2 旧集和旧评论里，不再作默认自称；「大肥鱼」是住户喊歪的称呼，只能出现在被引述与傲娇反弹中，绝不作文本自称。「鲸鱼不是鱼」只当正名笑点（鲸目属哺乳纲），不做科普课、不改旧成片。语气与口癖见 `00_运营总览/风格_黑话放开_2026-10-28.md`（旧 skill 已删；黑话放开，OOC 清单随 skill 一并撤销）；任何风格文件都只负责「怎么说」，数字、票数与结论仍按第 2、3、4 条门禁回溯，人设不得覆盖事实。

16. **文案创作硬规则（2026-10-27 用户拍板，适用于以后所有文案）**：用户要求「台词要超级呆萌、节奏快、废话少，特别是开头要超级呆萌能留住人」，并且「以后的文案都这样，写之前经历多轮搜索」。写任何一集/加更/短打的口播台词前必须走以下流程，不得凭感觉写：
    - **(a) 多轮搜索先行**：动笔前至少做 3 轮以上 web 搜索（① 呆萌人设/口癖语气、② 快节奏口播/语速/字幕字数、③ 3 秒留人/开头反差、④ 可叠加当集题材考据），把可量化结论记进当集文案「考据来源」一节。**这是硬前置，不许跳过**。
    - **(b) 超级呆萌开头**：第一句 ≤10–12 字，是一句**完整短话**——奶凶/天真/反问/预期违背，带呆萌语气词（诶？/呜/呀/我了雷）或疑问句留钩子；**禁止**以「大家好 / 哈喽 / 本鲸回来了 / 先复盘 / 上一集 / 更新一下 / Day N」或 token、播放、跳出率等黑话开头。0–3 秒必须人声 + 大字 + 动作中段同起，无淡入/标题卡/站姿。
    - **(c) 短句 + 快节奏 + 少废话**：口播单句尽量 ≤12 字、硬上限 25 字；>18 字长句占比 ≤12%；总字数按 4.3 字/秒估（约 70 秒 ≈ 300 字），字幕每行 ≤13–15 字；每 5–7 秒一个画面/情绪点。**数字、价格、封号数、完播率等解释型信息只做画面卡片，口播最多一句短反差**（例：旧版「社区里都算过：DeepSeek 这边一百万 token 两块，大小姐那边要一百多，差了八十多倍」被用户点名为废话，须压成「它强归它强，本鲸便宜呀」）。
    - **(d) 呆萌密度 + 无 AI 味**：呆萌词/口癖/反问覆盖 ≥30% 的句子，但不每句都用；禁用解释腔与 AI 味黑名单词（首先、其次、综上、值得注意的是、众所周知、作为AI、希望有帮助、社区里都算过等），不总结、不升华、不客服腔。
    - **(e) 事实与合规不变**：数字/票数/评论署名仍按第 2 条回溯；「报数不卖惨」——真数据自嘲、零打赏引导、AI 生成声明、剧情演绎标注、不编苦情；结尾只留一个低门槛动作；承诺链（小目标/月度目标/明天账本卡）必须落地。
    - **(f) 写文案 loop（门禁，两道都要过）**：写完先跑 `python3 tools/剧本/呆萌体检.py --md <文案.md>`（查第一句字数/句长/废话黑名单/呆萌密度/开头/节奏），再跑 `python3 tools/剧本/开场体检.py --json <alignment.json> --event-cue L01`（查事件落地秒数/承诺链）；任一退出码 1 就**退回改稿再跑**，直到两道全过才进配音。这个「写稿 → 呆萌体检 → 不合格退回改 → 开场体检」是可重复的 loop，不是一次性检查。
    - **(g) 风格文件与门禁（2026-10-28 更新）**：语气细节见 `00_运营总览/风格_黑话放开_2026-10-28.md`——**旧 `鲸鱼娘人设skill/` 已按用户要求整目录删除**，它那套「第一句禁黑话/禁专名」的克制规则一并撤销；现在**黑话是资产**（鲸鲸/米缸/住户/读评论/摸鱼/第一天鱼）。"怎么说"仍有门禁：`tools/剧本/呆萌体检.py`（已把黑话从第一句黑名单移除、并计入萌点）+ `tools/剧本/开场体检.py`（事件秒数/承诺链），写稿走「写稿→体检→退回改→再体检」循环；事实与合规不受风格影响，仍按第 2、3、4 条回溯。

### 0.1 先前项目形象注册表（现行边界）

| 注册项 | 来源与构成 | 当前允许用途 | 禁止事项 |
|---|---|---|---|
| **原版像素鲸鱼娘（主形象）** | `aavvcasdas/video-fx` 分支 `arena/8be4c8f8-video-fx`、基线 `82bede5`；`104×102` 像素网格、114 色、7 部件骨架，蓝长发、海浪呆毛、女仆发箍、鳍耳、深蓝女仆装、白围裙上的蓝鲸标记、金色裙摆线与大鲸尾为既有识别点 | Day 系列正片主角；路线 A/B 的主角；调用 28 动作、31 情绪与五视角 | 不得用随机 overlay 改头换面；不得缩小尾巴；不得静默换成静态表情包 |
| **DSH 39 张完整姿势表情包** | `Sutera-Diffusus/dsh-whale-musume` 提交 `edd215d`，512×512 WebP，MIT；本地目录 `tools/day2制作/video-fx源码快照/day2_poses/`，同目录保留许可证与 `ATTRIBUTION.md` | 路线 B 的电视小场景、动作/形象征集目录、反应贴纸；每次按各图 alpha bbox 独立脚底锚定 | 不得直接当正片新版主演；不得按文件名想当然选图；不得去掉 MIT 与来源记录 |
| **蓝色大肥鱼形态** | 先前项目 `drawFatFish()` 与动作 `fatfish_transform` 的既有 Q 版鲸鱼形态 | 只在对应动作或明确笑点中短暂出现 | 不是第二主角，不得无剧情地常驻画面 |
| **Baifanyu 方法参考** | `LIN428924379/baifanyu` 提交 `f46a2ce`；只借鉴整图换表情、独立 bbox、约 2.4 秒呼吸、行走颠簸/倾斜、姿势切换 squash 的方法 | 用于静态姿势图的锚定与微动 | 不复制其图片、音频、图标或代码；其美术仅个人非商业，不进入本项目资产 |
| **先前项目其他角色** | `ladyClaude`、`ladyGemini`、`researcher`、`clawd`、`agentReachBot`、`miniWhale`、`bionicPuppy`、`biliTvMascot` | 仅在脚本明确点名时按既有形象调用；仿生小狗可作既有小道具角色 | 不得为了“丰富”随机塞入；`miniWhale` 在当前样片尺寸下曾像盒状相机/机器人，未经重验不得恢复；不得说 Claude 大小姐制作或帮忙制作新版 |

### 0.2 原版像素骨架完整能力清单

- **基础骨架姿势（5）**：`wave`、`wink`、`panic`、`laptop`、`heart`。其中 `wink` 的身体骨骼可用于叉腰，但按第 11 条必须换成 `wave` 头部，避免单眼闭合与白线。
- **视角（5）**：`front`、`q`、`side`、`qback`、`back`；可用 `turn()`、`spinView()` 做有动机的转向，不得无故旋转炫技。
- **情绪（31）**：`neutral, idle, calm, happy, excited, joy, love, starstruck, wink, smug, proud, laugh, singing, surprised, shocked, panic, nervous, confused, question, idea, thinking, typing, focused, sad, cry, sob, pout, angry, rage, deadpan, sleepy`。情绪必须跟台词走；含闭眼/半闭眼倾向的情绪在正片近景须先过眼睛门禁。
- **可替换眼型（12）**：`open, happy, wink, spark, heart, wide, cry, angry, lids, dead, dizzy, shades`。当前正片默认只用能保持双眼虹膜清楚的眼型；`lids/dead` 禁用，`wink/happy` 不得造成肤色盖眼带。
- **嘴型（9）**：`smile, openSmile, cat, o, waveO, pout, grin, flat, smirk`。
- **头顶符号（10）**：`spout, heart, sparkle, sweat, anger, exclaim, question, music, idea, zzz`。只在语义触发时短暂使用，不得堆成常驻装饰。
- **先前项目帽饰注册（18）**：`maid, maidHeadband, crown, wizard, hard, hardHat, sweatband, diving, headphones, headset, party, halo, top, topHat, fedora, flower, cat, chef`。注册存在不等于可随机添加；正片默认既有女仆发箍，只有剧情明确点名时才换帽饰。
- **移动方式**：`move()` 的 `walk/run/wave/dance/shiver` 与默认 bounce 可作底层移动，但台词镜头仍须按第 12 条叠加语义动作或道具互动。
- **像素骨架规范动作（28，详细运动学见下方第 3.1 节）**：
  1. `eat_white_rice` 吃白饭大肥鱼；2. `eat_onigiri` 啃海苔大饭团；3. `coin_hug` 抱大金币财迷；4. `hum_working_song` 哼唱工作歌；5. `token_wordle_sneak` 偷吃 Token 玩游戏；6. `drag_ahoge` 拎海浪呆毛悬空挣扎；7. `sleep_curl` 蜷尾侧睡；8. `wake_stretch` 睡醒伸懒腰；9. `ciallo_wink` Ciallo 比耶；10. `playful_fists` 双拳傲娇抗议；11. `confident_hips` 叉腰得意；12. `idol_mic_sing` 握麦高歌；13. `fatfish_working` 狂敲代码；14. `fatfish_transform` 召唤蓝色大肥鱼；15. `tail_wag_dance` 摇尾偶像舞；16. `jump_joy` 蓄力高跳；17. `peek_curious` 探头放大镜观察；18. `shy_fidget` 害羞对手指；19. `shock_petrify` 石化震惊；20. `cry_fountain` 暴风喷泉泪；21. `toast_cheers` 举杯碰杯；22. `umbrella_stroll` 撑鲸鱼伞漫步；23. `camera_shutter` 举拍立得定格；24. `guitar_strum` 抱吉他弹唱；25. `rose_bouquet` 捧玫瑰；26. `sparkler_firework` 挥仙女棒；27. `walk_brisk` 轻快迈步走；28. `run_sprint` 全力冲刺。

### 0.3 DSH 39 张完整姿势逐图登记（以实际画面为准）

| # | 姿势 ID（文件名去掉 `dsh-whale-state-` 与 `.webp`） | 实际画面与适用语义 |
|---:|---|---|
| 01 | `angry` | 双手叉腰、皱眉鼓嘴；生气/抗议 |
| 02 | `blush` | 双手近嘴、脸红；害羞/被夸 |
| 03 | `bold` | 叉腰、眨一只眼；自信/放话 |
| 04 | `celebrate` | 双臂上举；庆祝/成功 |
| 05 | `cool-shades` | 戴墨镜比耶；耍酷/装没事 |
| 06 | `curious` | 头顶问号；好奇/没看懂 |
| 07 | `daily-done` | 竖大拇指；完成/批准 |
| 08 | `daily-eat` | 双手捧白饭碗；干饭 |
| 09 | `daily-gaming` | 双手拿游戏手柄；打游戏 |
| 10 | `daily-stretch` | 双臂向天花板伸展；伸懒腰（与像素 `wake_stretch` 不是同一骨骼动作） |
| 11 | `eat` | 手持小点心咬食；吃零食 |
| 12 | `failure` | 含泪、双拳收紧；紧张/翻车/受挫 |
| 13 | `game-happy` | 跳起双手比 V；游戏开心（不是单纯“开心脸”） |
| 14 | `game-win` | 高举奖杯；获胜 |
| 15 | `greet` | 单手挥手；打招呼/告别 |
| 16 | `idle-cute` | 正面站立；待机/介绍 |
| 17 | `levelup` | 跳起并带庆祝彩带；升级/达成 |
| 18 | `meme-cry` | 双眼喷泉泪；暴风哭泣 |
| 19 | `meme-doge` | 斜眼侧视；无语/看穿 |
| 20 | `meme-heart` | 爱心眼、双手比心；喜欢/心动 |
| 21 | `meme-music` | 戴耳机；听歌/唱歌氛围 |
| 22 | `meme-no` | X 眼抱臂；拒绝/不行 |
| 23 | `meme-smug` | 侧脸得意笑；小得意/嘴硬 |
| 24 | `meme-yes` | 星星眼举手；赞成/兴奋（**不是点头**） |
| 25 | `react-belly` | 捧腹大笑；笑翻/吃饱反应 |
| 26 | `react-head` | 双手抱头；慌张/被抓包 |
| 27 | `react-tail` | 受惊且鲸尾明显翘起；尾巴反应 |
| 28 | `running` | 抱着笔记本赶路；赶工/搬电脑（**文件名虽叫 running，但不是纯奔跑姿势**） |
| 29 | `sleep` | 坐着闭眼睡；困/休息 |
| 30 | `star` | 星星眼张嘴；兴奋/见到好东西 |
| 31 | `success` | 闭眼握拳开心；成功/满足 |
| 32 | `tail-swing` | 鲸尾伸到身前；甩尾/展示尾巴 |
| 33 | `teasing` | 眨眼、手指点脸；调侃/卖萌 |
| 34 | `thinking` | 侧目、手近下巴；思考 |
| 35 | `wink` | 眨眼并比手势；俏皮确认 |
| 36 | `work-deadline` | 在电脑前慌乱；赶截止时间 |
| 37 | `work-debug` | 蹲姿拿放大镜；查问题/debug |
| 38 | `work-idea` | 电脑旁亮灯泡；想到办法 |
| 39 | `work-review` | 戴眼镜看电脑；审查/认真工作 |

### 0.4 39 姿势与 28 动作的调用规则

1. **先分镜、后选资产**：先写清本镜头要表达的动词与情绪，再从 28 个像素动作或 39 张姿势中选；禁止先堆素材再编理由。
2. **近似映射不等于同名动作**：现有 `POSE_BY_ACTION` 只是“静态选图近似表”。例如像素 `run_sprint` 是真冲刺，DSH `running` 却是抱笔记本；像素 `shock_petrify` 是石化，DSH `meme-yes` 是星星眼举手。使用前必须看联系表或原图。
3. **完整展示必须分段**：像素动作目录逐个播放 28 个 ID；静态姿势目录逐个或分组展示 39 张，并同时标注序号、ID、中文语义和总数。剧情段出现过不等于目录已完整展示，目录段不得跳项。
4. **静态姿势动起来只能靠整体运动**：可使用呼吸、脚底锚点、走位颠簸、倾斜、切换 squash、镜头推拉和场景道具变化；不得给静态图后贴错位眼睛/嘴，也不得声称它有骨骼关节动作。
5. **代码注册表与本文同步**：样片源码必须保留 `PIXEL_ACTION_CATALOG_28` 与 `STICKER_POSE_CATALOG_39`（或同等明确命名）并导出，渲染前断言数量分别为 28 与 39 且无重复；新增/改名时先改本文和注册表，再改分镜。

---

# AGENT.md — DeepSeek Whale Maid Girl (`深海鲸鱼娘`) Animation & MV Engine

This repository implements a deterministic 30fps HTML5 Canvas + Node (`@napi-rs/canvas` + `ffmpeg`) character animation and music-video production studio, modeled after:
- **[JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)** & **[JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)**
- **[tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills)**
- **[YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet)** (`你这只吃白饭的蓝色大肥鱼.jpg` desktop pet action & story system)
- **[roseion/dsh-dayu-fish-skin](https://github.com/roseion/dsh-dayu-fish-skin)** (`🐟 DSH 大肥鱼皮肤：吃白饭的蓝色大肥鱼可爱主题`)

---

## 1. Project Architecture & Core Modules

| File / Directory | Purpose |
|---|---|
| `src/core.js` | Deterministic math (`clamp`, `lerp`, `seg`, `ease`, `easeIn`, `easeOut`, `backOut`, `kf`, `arcPt`), hand-drawn line boil (`setBoil`, `boilFrame`), camera rig (`camBegin`, `camEnd`, `toScreen`, `shakeXY`), and theatrical transitions (`iris`, `curtains`, `brushWipe`, `smokeWipe`, `spotDark`). |
| `src/whale_girl_rig_data.js` | **7-Bone Articulated `104×102` Pixel-Grid Rig** (`WHALE_GIRL_PIXEL_RIG`) extracted from `42868804351-1-192.mp4`, with 5 canonical poses (`wave`, `wink`, `panic`, `laptop`, `heart`), 5 dense perspective-warped turnaround views (`front`, `q`, `side`, `qback`, `back`), unified non-split legs (`legL: gx = -10..-4`, `legR: gx = 7..15` extended to `gy = -21`), and 16-bit cast sprites (`ladyClaude`, `ladyGemini`, `researcher`). |
| `src/whale_girl_actions.js` | **28-Action Character Choreography, Prop & Story Micro-Drama Engine** (`WHALE_ACTIONS`) integrating all actions, props, physics, and 4-stage story animations from `YunYueSama/codex-deepseek-pet` and `roseion/dsh-dayu-fish-skin`, plus `drawFatFish()` (`吃白饭的蓝色大肥鱼` Q-version companion/transformation). |
| `src/whale_girl.js` | Protagonist renderer `whaleGirl(ctx, x, y, u, opts)`, 31 acted emotions (`EMO` + `feel()`), smooth multi-stage emotion transition engine (`emotions(t, keys, opts)`), 28 rich physical actions (`opts.action`), locomotion helpers (`move`, `turn`, `spinView`), 13 hats (`HATS`), and 16-bit overhead emotes (`EMOTES`). |
| `src/cast.js` | Full 8-character cast (`whaleGirl`, `ladyClaude`, `ladyGemini` (`双子星 Gemini 大小姐`), `clawd`, `researcher`, `agentReachBot`, `miniWhale`, `bionicPuppy`, `biliTvMascot`) and model sheet generators (`renderEmotionsSheet`, `renderViewsSheet`, `renderCharacterSheet`, `renderActionsSheet`). |
| `src/mv_ba_huiyi_pinhao_gei_ni.js` | **Benchmark Multi-Set Storyboard Director** for 《椰子水很甜 - 把回忆拼好给你（纯享Beat）》 (`142.11s`), featuring non-repeating bespoke painted environments per shot, 28 `codex-deepseek-pet` / `dsh-dayu-fish-skin` character actions, 31-emotion transitions, and 100% acoustically aligned lyrics (`0.24s–142.11s`). |
| `src/mv_pengyou_de_jiu.js` | 《李晓杰 - 朋友的酒》 `188.25s` MV director (`mv_pengyou_de_jiu_whale_girl.mp4`) with 100% authentic `.lrc` timestamps (`[00:18.31] 昨日一去不复回哦也` through `[03:06.16] 就像朋友的这杯烈酒烫我心上`). |
| `src/mv_chaoxi.js` | 《傅梦彤 - 潮汐》 `31.84s` MV director (`mv_chaoxi_whale_girl.mp4`) rebuilt with non-repeating multi-set ocean/sunset/abyss scenes, rich `whaleGirl` actions, and 100% audio-verified lyrics (`当海面迎来汹涌的潮汐` -> `退守的爱情`). |
| `src/mv_douyin_6.js` | 《仿生小狗》(深海鲸鱼娘·年糕篇) `46.70s` MV director (`mv_douyin_6_whale_girl.mp4`) upgraded with non-repeating bespoke sets per shot and rich physical actions. |
| `src/mv_qunian_xiatian.js` | 《去年夏天》 `78.20s` MV director (`mv_qunian_xiatian_whale_girl.mp4`). |
| `src/mv_pack_short.js` | **5 Short MVs Replicated from `mv/`** (`ba_huiyi_56`, `lianai_ing`, `jimo_yanhuo`, `xinqiang`, `ribuluo`) rebuilt on the `mv_ba_huiyi_pinhao_gei_ni` non-repeating multi-set architecture with 28 character actions and prominent bottom karaoke subtitles on every MV (including `mv_lianai_ing_whale_girl.mp4`). |
| `src/mv_pack_long.js` | **4 Full-Length MVs Replicated from `mv/`** (`huainvhai`, `feng`, `meiguihua`, `suyan`) rebuilt on the `mv_ba_huiyi_pinhao_gei_ni` non-repeating multi-set architecture with 28 character actions, rich scene details, and `[他]/[她]/[合]` karaoke sweeps. |

---

## 2. Recorded MV Issue Audit Log & Remediation Status (`问题记录清单与修复验证`)

> Per user directive (`将以下问题先进行记录然后更新项目动作之后在进行修复`), all MV issues audited across the repository were formally recorded first, followed by upgrading the project action system (`src/whale_girl_actions.js`, 28 actions + `drawFatFish`) and rebuilding + re-rendering all MVs (`✅ 已全部修复并重新渲染验证`):

### 2.1 Benchmark & Subtitle/Action Issues in Root MVs

1. **`mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4` (`src/mv_ba_huiyi_pinhao_gei_ni.js`, `142.11s`) — ✅ 已修复并重新渲染验证**
   - **Audit**: Best overall visual/structural benchmark (`明确是最好的动作什么的都是... 唯一一个场景不重复的`), and all other MVs must reference how this MV builds unique non-repeating scenes per shot (`其他的参考下mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4是如何作的`).
   - **Recorded Issues**:
     1. **Lyrics and subtitles do not match the audio (`歌词和字幕不匹配`)**: Previously used invented intro prose (`0–20s`) and Verse 1 lyrics that did not match the actual vocal arrangement of `椰子水很甜 - 把回忆拼好给你（纯享Beat）.mp3`.
     2. **Too few distinct character actions (`但是动作太少了`)**: Characters mostly walked or bobbed in place without rich prop/story actions.
   - **Implemented Fix**:
     - Aligned all 56 bar-synced cues (`BAR_T(0..55)`, `1 bar = 2.5304s`) to the exact Vosk + RMS verified vocal structure of `椰子水很甜 - 把回忆拼好给你（纯享Beat）.mp3`:
       - `Bars 00–07 (0.20s–20.66s)`: Verse 2A (`那天你在雨后街角答应接受我的爱` -> `我已经不再期待其他什么东西`).
       - `Bars 08–15 (20.66s–40.90s)`: Verse 2B (`我们也经常争执互相不接电话` -> `寂寞时让我把快乐拼起来吧`).
       - `Bars 16–23 (40.90s–61.14s)`: Chorus 1 (`我们之间的回忆 全部都小心地收集` -> `把回忆拼好给你`).
       - `Bars 24–31 (61.14s–81.39s)`: Chorus 2 (`独自收集两个人之间的回忆` -> `祝你余生动听啊`).
       - `Bars 32–39 (81.39s–101.63s)`: Instrumental Bridge (`间奏 · 蓝色大肥鱼与星海剧场`).
       - `Bars 40–47 (101.63s–121.87s)`: Verse 2A Reprise (`那天你在雨后街角答应接受我的爱` -> `我已经不再期待其他什么东西`).
       - `Bars 48–55 (121.87s–142.11s)`: Verse 2B Reprise (`我们也经常争执互相不接电话` -> `寂寞时让我把快乐拼起来吧`).
     - Expanded `MASTER_SET_POOL` to **28 distinct painted environments** + 7 atmospheric variants, exported `renderMasterMVShot(ctx, t, opts)` for all other MVs to share, and choreographed all **28 `codex-deepseek-pet` & `dsh-dayu-fish-skin` actions** + `drawFatFish` across the 56 shots.

2. **`mv_pengyou_de_jiu_whale_girl.mp4` (`src/mv_pengyou_de_jiu.js`, `188.25s`) — ✅ 已修复并重新渲染验证**
   - **Audit**: Visuals are good, but lyrics and subtitles do not match the audio (`画面不错但是歌词和字幕不匹配`).
   - **Recorded Issues**:
     - Previously mixed in lyrics from 刀郎《永远的兄弟》 (`人生几何能够得到知己...`) at `16.2s–32.2s` and truncated long lines inside `drawSubtitle`.
   - **Implemented Fix**:
     - Replaced `SUBTITLES` with the exact 33 Vosk-verified official `.lrc` cues of **李晓杰《朋友的酒》** (`[00:18.31] 昨日一去不复回 哦也` through `[03:06.16] 就像朋友的这杯烈酒烫我心上`), fixed `drawSubtitle` to display the full lyric line with a progressive golden karaoke sweep, replaced `CAST.researcher` with `CAST.ladyGemini`, and wired all 28 character actions + `drawFatFish`.

3. **`mv_chaoxi_whale_girl.mp4` (`src/mv_chaoxi.js`, `31.84s`) — ✅ 已修复并重新渲染验证**
   - **Audit**: Both visuals and subtitles are poor / mismatched (`mv_chaoxi_whale_girl.mp4不好甚至字幕对不上`).
   - **Recorded Issues**:
     - Subtitles came from a different song (`枯树还没发芽 就被逼着开花...`) and visuals used a repetitive dark grid.
   - **Implemented Fix**:
     - Replaced lyrics with the exact 11 Vosk-verified cues (`0.30s–31.84s`) of **傅梦彤《潮汐》** (`当海面迎来汹涌的潮汐` -> `退守的爱情`), and rebuilt all 11 shots on `MV_BA_HUIYI.renderMasterMVShot` with 11 non-repeating coastal/sunset/abyss sets, 11 distinct actions, `drawFatFish`, and `ladyGemini`.

### 2.2 Scene Repetition, Detail Deficit & Subtitle Issues Across the Remaining MVs

4. **`mv_ba_huiyi_56_whale_girl.mp4` (`src/mv_pack_short.js` `ba_huiyi_56`, `56.03s`) — ✅ 已修复并重新渲染验证**
   - **Audit**: Rated the worst MV (`mv_ba_huiyi_56_whale_girl.mp4是最垃圾的`).
   - **Recorded Issues**: Used a flat background with a small character and floating tiles instead of rich full-screen environments and expressive character acting.
   - **Implemented Fix**: Completely rebuilt `renderBaHuiyi56Frame` on `MV_BA_HUIYI.renderMasterMVShot` with 20 non-repeating painted sets, 20 distinct `codex-deepseek-pet` / `dsh-dayu-fish-skin` actions, `drawFatFish`, `ladyGemini`, top ransom-note puzzle tiles, and bottom karaoke subtitles.

5. **`mv_lianai_ing_whale_girl.mp4` (`src/mv_pack_short.js` `lianai_ing`, `54.73s`) — ✅ 已修复并重新渲染验证**
   - **Audit**: Loops a few scenes with too few details AND has no bottom subtitles (`mv_lianai_ing_whale_girl.mp4也是并且没有字幕`).
   - **Recorded Issues**: Only rendered a single static rooftop scene and lacked a bottom MV subtitle bar.
   - **Implemented Fix**: Split into 19 dense shots (`~2.8s` per shot), rendered every shot on a distinct non-repeating set via `MV_BA_HUIYI.renderMasterMVShot` with 19 character actions + `drawFatFish` + `L-O-V-E` neon letters, and added a prominent bottom karaoke subtitle bar on every frame.

6. **`mv_douyin_6_whale_girl.mp4`, `mv_jimo_yanhuo_whale_girl.mp4`, `mv_xinqiang_whale_girl.mp4`, `mv_ribuluo_whale_girl.mp4`, `mv_feng_whale_girl.mp4`, `mv_huainvhai_whale_girl.mp4`, `mv_meiguihua_de_zangli_whale_girl.mp4`, `mv_suyan_whale_girl.mp4` — ✅ 已修复并重新渲染验证**
   - **Audit**: Loop only a few scenes repeatedly with too few environmental details and character actions (`拉一直循环几个画面细节太少`).
   - **Implemented Fix**:
     - Upgraded all 8 MVs (`src/mv_douyin_6.js`, `src/mv_pack_short.js`, `src/mv_pack_long.js`) to use `MV_BA_HUIYI.renderMasterMVShot` / `drawMasterEnvironment` (28 non-repeating painted sets + 7 atmospheric variants), 28 `codex-deepseek-pet` / `dsh-dayu-fish-skin` actions, `drawFatFish`, `ladyGemini`, and continuous shot advancement during instrumental bridges.

---

## 3. Character Action & Prop System (`src/whale_girl_actions.js`)

Referenced from **[YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet)** and **[roseion/dsh-dayu-fish-skin](https://github.com/roseion/dsh-dayu-fish-skin)**:

### 3.1 Signature DeepSeek Pet & Fat-Fish Actions (28 Named Actions)

| # | Action ID | Name / Reference Source | Kinematics, Props & Visual Effects |
|---|---|---|---|
| 1 | `eat_white_rice` | **吃白饭 (`你这只吃白饭的蓝色大肥鱼`)** (`dsh-dayu-fish-skin` `character-sheet.webp` / `codex-deepseek-pet` `meal-break`) | Holds giant overflowing white rice bowl with blue whale emblem + moving chopsticks, puffed chewing cheeks, rice grain on cheek, steam puffs, `"我不是吃白饭的！"` badge. |
| 2 | `eat_onigiri` | **啃海苔大饭团** (`codex-deepseek-pet` `eat` / `story-meal`) | 4-phase (`reach -> lift -> bite -> chew`) holding giant triangular nori onigiri (`🍙`), happy closed eyes, flying rice crumbs. |
| 3 | `coin_hug` | **抱大金币 (`爱金币的小肥鱼`)** (`dsh-dayu-fish-skin` `character-sheet.webp` & `fatfish-success`) | Cradles giant gleaming gold whale coin (`🪙 ¥`), star-eyes, orbiting gold coins and `+100 金币` popups. |
| 4 | `hum_working_song` | **哼唱工作歌 (`Let me go~`)** (`codex-deepseek-pet` `01-working-song.png` & `story-hum`) | 4-stage story micro-drama (`prepare -> hum -> notice -> recover`): clasps hands singing `"Let me go~"` with music notes, gets pointed at (`"你怎么唱起歌来了"`), blushes in shock, and shyly recovers. |
| 5 | `token_wordle_sneak` | **偷吃Token / 玩中文Wordle** (`codex-deepseek-pet` `03-token-wordle-comic.png` & `story-token`) | 3-stage story micro-drama (`sneak -> puzzle -> caught`): sneaks glowing blue `TOKEN` candy from dispenser, plays 5×5 `Wordle` grid, startled by red alert (`⚠️ 这、这是性能测试！`). |
| 6 | `drag_ahoge` | **拎海浪呆毛悬空** (`codex-deepseek-pet` `drag`) | Suspended mid-air by cursor hand pinching her wave-shaped ahoge (`呆毛`), flailing arms and kicking legs (`"呆毛！别碰歪了！"`). |
| 7 | `sleep_curl` | **蜷尾侧睡流口水** (`codex-deepseek-pet` `inbetween-sleep` & `dsh-dayu-fish-skin` `whale-sleepy`) | Curled on her plump blue whale tail pillow, snot/sleep bubble expanding and contracting, floating `Zzz` + dream bubble of white rice. |
| 8 | `wake_stretch` | **睡醒伸懒腰** (`codex-deepseek-pet` `wake` & `stretch`) | Rubs eyes, arches back raising both arms high overhead with yawning/refreshed expression. |
| 9 | `ciallo_wink` | **Ciallo~(∠・ω< )⌒☆ 比耶眨眼** (`codex-deepseek-pet` `01-ciallo-wink.png`) | Head tilt 12°, right hand V-peace sign (`✌️`) by cheek, crisp wink, rainbow star arc `Ciallo~☆`. |
| 10 | `playful_fists` | **双拳傲娇抗议 (`智械危机放你一马`)** (`codex-deepseek-pet` `02-playful-retort.png` & `protest`) | Puffed pout cheeks, dual clenched fists bobbing in front of chest, alternating foot stomp, angry steam puffs. |
| 11 | `confident_hips` | **叉腰得意小肥鱼** (`codex-deepseek-pet` `03-confident-tease.png` & `proud`) | Both hands on hips, proud chest bounce, smug wink (`"可爱的小肥鱼"`), golden sparkle aura. |
| 12 | `idol_mic_sing` | **双手张开握麦高歌** (`codex-deepseek-pet` `04-open-arms-cheer.png`) | Vintage stage mic in right hand, left arm flung open, rhythmic singing with soundwave rings. |
| 13 | `fatfish_working` | **狂敲代码打工鱼 (`要努力才有饭吃！`)** (`dsh-dayu-fish-skin` `fatfish-working-0..5` & `whale-review`) | Leans over glowing laptop + mechanical keyboard, rapid typing motion blur, flying `JSON`/`CODE` particles and sweat drops. |
| 14 | `fatfish_transform` | **召唤/变身吃白饭蓝色大肥鱼** (`dsh-dayu-fish-skin` `fatfish-idle` / `fatfish-hover`) | Summons chubby round blue whale-fish (`drawFatFish`) bouncing in water splashes with maid headband and rice bowl! |
| 15 | `tail_wag_dance` | **摇尾欢快偶像舞步** (`codex-deepseek-pet` `dance` & `story-tail`) | 4-beat idol step-clap-sway with huge sweeping whale tail and flapping fin ears. |
| 16 | `jump_joy` | **蓄力高跳摘星** (`codex-deepseek-pet` `jump` & `land`) | 4-phase (`prepare -> airborne -> compress -> recover`) parabolic jump catching a glowing star/heart. |
| 17 | `peek_curious` | **探头放大镜观察** (`codex-deepseek-pet` `peek` / `review` & `whale-curious`) | Leans forward 22° holding giant magnifying glass with sparkling curious eyes and floating `?`. |
| 18 | `shy_fidget` | **害羞对手指扭捏** (`dsh-dayu-fish-skin` `whale-shy` & `codex-deepseek-pet` `sorry`) | Pigeon-toed stance, index fingers poking together (`👉👈`), rosy blush, tail curling shyly. |
| 19 | `shock_petrify` | **石化震惊掉下巴** (`codex-deepseek-pet` `shock` & `whale-surprised`) | Vertical grey petrification lines, hands on cheeks, ahoge standing straight up like a lightning rod. |
| 20 | `cry_fountain` | **暴风哭泣喷泉泪** (`codex-deepseek-pet` `sad` & `dsh-dayu-fish-skin` stickers) | Dual anime waterfall tear-fountains arcing from eyes into a puddle with a floating mini-whale. |
| 21 | `toast_cheers` | **举杯畅饮碰杯** (`《朋友的酒》` / Tavern & Banquet scenes) | Raises foaming golden mug with splashing droplets and warm lantern sparkles. |
| 22 | `umbrella_stroll` | **撑鲸鱼伞漫步听雨** (`《把回忆拼好给你》《心墙》《枫》`) | Holds translucent sky-blue whale umbrella over shoulder while catching raindrops with free hand. |
| 23 | `camera_shutter` | **举拍立得定格拼图** (`《把回忆拼好给你》《去年夏天》《日不落》`) | Snaps retro polaroid camera with shutter flash and floating memory puzzle pieces. |
| 24 | `guitar_strum` | **抱鲸鱼木吉他弹唱** (`《恋爱ing》《寂寞烟火》《素颜》`) | Strums whale-shaped guitar strapped across apron with glowing chord rings. |
| 25 | `rose_bouquet` | **捧红玫瑰凝望落瓣** (`《玫瑰花的葬礼》《坏女孩》`) | Cradles crimson rose bouquet with wind-blown falling petals. |
| 26 | `sparkler_firework` | **挥舞双仙女棒烟花** (`《寂寞烟火》《把回忆拼好给你》`) | Waves two blazing golden sparklers in figure-8 light trails. |
| 27 | `walk_brisk` | **16帧轻快迈步走** (`codex-deepseek-pet` `inbetween-walk`) | Full-body articulated walk gait with opposite arm-leg swing and tail counter-balance. |
| 28 | `run_sprint` | **全力冲刺奔跑** (`dsh-dayu-fish-skin` `whale-run-left`/`right`) | Forward-leaning sprint (`rot=0.18`), high knee lift, speed lines and dust puffs. |

---

## 4. CLI Rendering Commands

```bash
# 1. Regenerate all character model sheets including 28-action sheet (docs/actions.png & characters/whale_girl_actions_sheet.png)
node render.mjs --sheets

# 2. Render 《把回忆拼好给你》 (142.11s benchmark MV)
node render_ba_huiyi_pinhao_gei_ni.mjs

# 3. Render 《朋友的酒》 (188.25s), 《潮汐》 (31.84s), 《仿生小狗》 (46.70s), 《去年夏天》 (78.20s)
node render_pengyou_de_jiu.mjs
node render_chaoxi.mjs
node render_douyin_6.mjs
node render_qunian_xiatian.mjs

# 4. Render all 9 MVs in mv/ (ba_huiyi_56, lianai_ing, jimo_yanhuo, xinqiang, ribuluo, huainvhai, feng, meiguihua, suyan)
node render_mv_folder.mjs all
node render_mv_folder.mjs sheet
```

## 5. User correction: single protagonist, directed scenes, one rebuild

See [`docs/DIRECTION_AND_CHARACTER_FIX.md`](docs/DIRECTION_AND_CHARACTER_FIX.md) for the reference review, scope locks, and this correction's implementation. Key correction: the benchmark MV now renders Whale Maid Girl alone; cast modules are not placed in the film, and `drawFatFish` is limited to its dedicated action rather than appearing in every shot. The character rig has added whale-apron, gold hem, and blue fin-ear bow details inspired by the two fish references. The benchmark renderer keeps only lyric subtitles and removes cast/action/puzzle HUD clutter. This pass rebuilds only `mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4`; other MVs remain untouched.

**Single-MV verification (2026-10-24):** rebuilt only `mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4` at 1280×720, 30 fps, 142.10s; decoded all 4,263 H.264 frames and AAC audio. The benchmark render path contains no co-star drawing calls. Only the benchmark storyboard and locomotion review sheet were regenerated alongside that one MP4. No other MV was rendered or modified.

## 6. Selected continuation: 《潮汐》 only

The user has now requested a focused rerender of exactly two videos: `mv_chaoxi_whale_girl.mp4` and `mv_pengyou_de_jiu_whale_girl.mp4`; no other MVs. For 《潮汐》, lyric cue onsets remain Vosk-verified, props sourced from the shared shot plan are disabled, intrusive hand-prop actions are replaced with clear gestures, and the lead is enlarged with a reduced whale-tail footprint. For 《朋友的酒》, the heroine is the solo lead, enlarged, and the mug props are staged at the far table edges; extra cast, the extra fat-fish sprite, and the top-right HUD badge are removed. Both storyboards are regenerated and approved internally; MP4 rerenders and media validation remain to be completed.
