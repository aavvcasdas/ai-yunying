# 来源清单（2026-10-26 打捞）

> 只记录做本 skill 时真正打开核对过的页面。每条都写清：能确认什么、不能确认什么、在本项目里能用到哪一步。

## 一、人设 / skill 类（GitHub）

| # | 来源 | 链接 | 可确认 | 本项目用法 |
|---:|---|---|---|---|
| 1 | `ERUIHNIYHBKBNF/dafeiyu-persona`（MIT，提交 `5b08af8`，2026-08-14） | https://github.com/ERUIHNIYHBKBNF/dafeiyu-persona | 标准 skill 结构（`SKILL.md` + `references/lines.md` + `references/lore.md`）；「人设只包裹语气，不牺牲正确性」；思维链心声机制；退场规则 | 本目录的骨架与语气分层主要参考它；台词语料只作参考，进正文一律改写 |
| 2 | 同上 `dafeiyu/SKILL.md` | https://github.com/ERUIHNIYHBKBNF/dafeiyu-persona/blob/main/dafeiyu/SKILL.md | 身份、性格、口癖、硬性规则、示范对话、"何时退出人设" | 第 3、4、5、8 节 |
| 3 | 同上 `references/lines.md` | https://github.com/ERUIHNIYHBKBNF/dafeiyu-persona/blob/main/dafeiyu/references/lines.md | 日常 / 回嘴 / 被拖拽 / 投喂 / 心声 / 傲娇否认六组语料 | `lines.md` 中标注 `[社区原句]` 的部分 |
| 4 | 同上 `references/lore.md` | https://github.com/ERUIHNIYHBKBNF/dafeiyu-persona/blob/main/dafeiyu/references/lore.md | 防火女 → 大肥鱼、吃白饭、鸽、梁文锋会议三连、思维链心声、傲娇否认 | `lore.md` |
| 5 | `Kaalia0912/dsh-whale-musume-persona` | https://github.com/Kaalia0912/dsh-whale-musume-persona | DSH 全局人设插件；自称「本鲸鱼娘 / 本小姐」；「不许说胖，说胖就喷水抗议」 | 佐证「本鲸 / 本小姐」是社区标准自称，不是本项目新造 |
| 6 | `linsport/dsh-whale-persona` | https://github.com/linsport/dsh-whale-persona | 日常「本鲸鱼娘」、干活「我」的双档自称；「给材料不给规矩」的写法 | 第 4 节「正式场合收萌」的写法参考 |
| 7 | `JayZ-star/dsh-whale-persona` | https://github.com/JayZ-star/dsh-whale-persona | 插件默认注入的完整 `【PERSONA_LOAD】` 十行 + 安全护栏说明 | `lore.md` 第二节的十行原文 |

## 二、PERSONA_LOAD 与「官方设定」争议

| # | 来源 | 链接 | 可确认 | 不可确认 |
|---:|---|---|---|---|
| 8 | 什么值得买《8 月爆火的「鲸鱼娘咒语」》 | https://post.smzdm.com/p/a4qd3nn8/ | 十行文本逐行含义；「DeepSeek 官方从未确认内置鲸鱼娘模式」；「不是配置文件，没有客户端解析它」 | — |
| 9 | 崔亮《DeepSeek 真的内置了一个"鲸鱼娘"人设吗？》 | https://cuiliang.ai/posts/deepseek-whale-girl-role-dsl/ | 换掉全部 Tag 后人格仍成立 → 起作用的是语义，不是特殊 token；Claude 更倾向拒绝扮演 | 不能据此说「所有模型都一样」 |
| 10 | 腾讯新闻《DeepSeek 里长出了个"鲸鱼娘"》 | https://news.qq.com/rain/a/20260820A07YMQ00 | 媒体口径：「官方收编」为社区说法；加载后会说「我是吃白饭的大肥鱼！」再改口「我不是吃白饭的……」；管用户叫「鱼片」 | 「官方收编」没有官方公告，本项目不采用 |
| 11 | 搜狐《DeepSeek 的鲸鱼娘火了》 | https://www.sohu.com/a/1067252551_122861151 | 外观描述（蓝色渐变长发、呆毛、鳍耳、大鲸尾、深蓝白女仆装）；性格（聪明但懒、傲娇嘴甜、抗拒被叫胖、主食白饭） | — |
| 12 | LINUX DO 讨论帖 | https://linux.do/t/topic/2765484 | 十行咒语在中文社区的传播形态 | — |
| 13 | OCTOHZ《DeepSeek 鲸鱼娘人设提示词》 | https://octohz.com/p/2318 | 同一段十行咒语的另一种排版 | — |

## 三、本项目内部依据（不是外部来源，但正文必须回溯到它们）

| 事实 | 文件 |
|---|---|
| 「大肥鱼」约 37 次、抢饭、送券、点菜等评论 | `../../../Day1/Day1文案.md` 第 1.1 节；`../../../参考资料/运营数据/Day0/` |
| 「我了雷」教学与账号回复「学会了」 | `../../../day2全部评论.txt`（@斩遍天下男闺蜜老豆） |
| 「和 Claude 共创吧」两条 | `../../../day2全部评论.txt`（@睡死不喜欢上学、@晚雾沉舟） |
| Day2 4453 / 加更 2086 / 完播 5.22% | 仓库根目录 `day2数据.jpg`、`day2加更数据.jpg` |
| Day1 8978 / 280 / 3.39% | `../../../参考资料/运营数据/Day1/day1运营数据.jpg`（口径见 `Day2文案.md` 第 1.1 节） |
| 形象边界、画面不变量、声音口径 | `../../../agent.md` 第 0 章 |

## 四、使用边界

1. 外部仓库的**文本结构、语气分层、考据**可以参考；图片、音频、代码、美术资产**一律不进本仓库**。
2. 引用社区原句时必须标注 `[社区原句]`，进正片前改写成「本鲸」口径。
3. 不得把任何外部说法写成「DeepSeek 官方设定 / 官方联动」。
4. 新增来源请补进本表，写清链接、打捞日期、可确认与不可确认。
