# AI Girls Atlas：人物借鉴评估与落地

## 审阅对象与限制

- 用户指定：[HABAI182/ai-girls-atlas](https://github.com/HABAI182/ai-girls-atlas/tree/main)。
- 固定提交：`21fa0746ab6cdee2f19c0c99828f87e063b13565`，本次核对日期2026-11-04。
- 本轮通过GitHub API按固定提交读取二十份文本/JSON，文件路径、字节数和SHA256见同目录 `ai-girls-atlas_审阅清单_2026-11-04.json`。对数据表按相关角色选择性核读，不声称每项来源都独立追溯到底。
- 未运行上游脚本，未下载角色图、声音、Live2D/3D包，未看原视频或试听。Atlas对上游画面的记录是二手研究资料，不说成本轮亲自观影结果；其列出的动作为参考片段时，不当可调用动作文件。

## 核心判断：能借什么

| 实际读到的内容 | 证据性质 | 本项目采用 | 不采用/不外推 |
|---|---|---|---|
| `encyclopedia/personas/deepseek.md` 的动机、反差、做事、纠错与关心方式 | Atlas原创群像草案，作者分支依据另列 | 把本鲸从单一吃饭/监工反应，扩成有需求、缺点和纠错选择的人物 | 不宣布本鲸职业变成研究员；不照抄其原创示范对白，不从R1技术介绍推出现实人格 |
| `docs/02-character-system.md` 的品牌/作者设计/版本/文件分层 | 整理者研究方法 | 视觉版本、人物行为、作品关系分别管理 | 蓝发鲸尾不代表所有作品同一人；不同作者CP/室友关系不拼成通用正史 |
| `docs/05-creation-playbook.md` 的固定项/变化项和小冲突写法 | Atlas原创方法及未逐项实测模板 | 固定当前角色身份锚点，用一个需求与阻碍推进一场戏；动作和字后期独立检查 | 不采用其生图操作，不自动新增小星形贴纸/饰品、换装、错号/数字牌，不覆盖本项目红线 |
| `encyclopedia/performances/deepseek.md` 的不同情境反应 | Atlas对具体作品画面的限定观察，非本轮实看 | 人物不必每次都惊讶，可认真、迟疑、发现错误、再处理 | 不照搬闭眼、跪坐、武器、恋爱桥段，不把静态图当现成骨骼动画 |
| `data/personas.json` 中Claude/Gemini/GPT差异 | Atlas原创角色工作草案，非产品实测 | 备用的表达准确/换视角/收束整理三种写法，以便以后确需群像时区分 | 本轮不加演员；不等同特定产品永久性格，不暗示模型能力高低 |
| `data/relationships.json` | 指定作品/系列关系 | 提醒本项目只继承自己的连续记忆 | 不把别人合租、CP、家庭史移植给本鲸、老大、笨鱼 |
| `data/actions-props.json`、`production-kits.json` | 动作片段索引与不同可用级别的素材包 | 区分“见过动作”“有文件”“已运行” | 不把参考链接当可下载动作，不因有模型包而说本项目已经能跑 |

## 具体落地

1. `00_运营总览/人物设定与短剧写作卡_v1.md`：本鲸、老大、笨鱼的动机/限制/说话/可演行为；外部AI只做候选卡，注明未自动出场。
2. `agent.md` 第23条：人物层次、现实处境的尊重、连续记忆、场景卡与许可要求常驻；与前面的海底v2、原配音、BGM和封面规则并行。
3. `Day11/Day11_人物化创作准备.md`：求职篇六段事件骨架、人物反应、下一轮任务选择和近期带启动条件的候选题；不是已实现分镜/正式轴。
4. 当前 `Day11/Day11文案.md` 与 TXT **不改**，保持219字待审修订稿；不借“丰富人物”恢复已经被用户否决的笑点。

## 许可核对：不是“GitHub公开＝全都MIT”

读取了根 `LICENSE.md`、`THIRD_PARTY_NOTICES.md` 和 `docs/06-rights-and-provenance.md`，具体边界：

- Atlas原创程序和维护脚本：MIT；本轮没有复制这些程序。
- Atlas新写的研究说明/模板：CC BY 4.0。借鉴其框架时署名 **HABAI182 / AI Girls Atlas**，链接许可，并说明由本项目按用户连续记忆重写。
- 第三方角色图、视频、声音、品牌：不适用以上统一许可。DeepSeek相关多套文件按该库记录为CC BY-NC-SA 4.0或其他非商业声明，必须逐文件回到来源核对；不能默认为可用于商业运营。
- 上善无形原角色、ZipZipPipe二次设计和后续具体改编者/文件供应方须分别保留，不把Atlas维护者写成原画作者。某一图像许可也不覆盖歌曲、人声或音色。
- 本轮没有导入这些美术和声音，不对现有本地素材重新授予/更改许可，也不宣称现有项目已获商业授权或版权批准。

## 署名与改动说明

人物框架参考：HABAI182 / AI Girls Atlas（固定提交如上），原创说明及模板许可 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本项目变更：采用本鲸自称和已发生的连续剧情；加入老大现实处境、用户否决项和笨鱼暂停边界；重写口吻示例与求职场景卡；不沿用上游演出对白或新增素材。

本项目自己已有的角色设定、台词和资产不因这一参考声明自动变成Atlas原作或全部适用同一许可。

## 固定版本入口

- [README](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/README.md)
- [人设说明](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/encyclopedia/personas/README.md)
- [DeepSeek人物草案](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/encyclopedia/personas/deepseek.md)
- [角色系统](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/docs/02-character-system.md)
- [创作方法](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/docs/05-creation-playbook.md)
- [许可](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/LICENSE.md)
- [第三方使用说明](https://github.com/HABAI182/ai-girls-atlas/blob/21fa0746ab6cdee2f19c0c99828f87e063b13565/docs/06-rights-and-provenance.md)
