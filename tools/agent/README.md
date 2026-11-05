# 魔丸 Agent

仓库里的只读文本入口：

```bash
python3 tools/agent/run.py --message "写 Day12 的口播改稿"
# 消息里没有明确集数时，显式指定；也可强制创作模式
python3 tools/agent/run.py --message "接着上一集写口播" --mode creative --day 12
```

## 创作模式

消息明确涉及 Day 系列、剧情、口播、文案或下一集时，入口会尝试进入 `creative` 模式。明确要求写剧本时，即使情节提到“报错”“接口”“测试”，也不因此丢掉创作上下文；修复剧情校验器或代码等明确技术任务仍走 `work`。附件是待分析材料，不能自行改变模式。自动识别是启发式，有歧义时可用 `--mode creative --day N` 明确指定；支持和停止请求仍优先。`--day N` 在自动模式下也会启用创作模式；集数不明确或多集歧义时会返回 `creative_context`，请在消息中写明目标或传 `--day N`。

用户需要支持、又明确要求写作时，入口保留 `support` 语气并同时尝试加载创作资料；如果集数不明或资料缺失，不阻断支持回复，但在结果中给出 `context_warning`，并要求模型不要假装已读过缺失资料。识别到用户明确叫停时，不注入创作上下文，并要求模型不继续生成被叫停的内容。

所有模式的第一条系统消息是 `tools/agent/persona.py` 的 `SYSTEM_PROMPT`，即本项目整理的魔丸人格；创作还会注入同文件的 `CREATIVE_HINT`。这是**项目版魔丸提示**，不是运行 DSH 原插件或把它的 `templates/persona.md`、`templates/style.md` 全文注入。原模板描述的是大肥鱼并包含原插件主人信息，不直接覆盖本项目的魔丸、老大和鲸鱼娘设定。

创作上下文实际读取并传给模型：

- `.claude/skills/day-series-writer/SKILL.md`：魔丸幕后、鲸鱼娘镜内、当日客人的分层及创作流程。
- `agent.md` 和 `00_运营总览/连续更新记忆.md` 的完整内容。
- 标准路径 `Day{N-1}/Day{N-1}配音台词.txt` 的**完整口播**；如果上一集文案明确注明未锁字，或台词缺失/为空/待填，就停止并报告，不把草稿冒充定稿。
- 存在时读取上一集文案、`DayN/DayN文案.md` 和 `DayN/DayN梗来源.md`，供核对锁字状态及客人梗来源。没有记录时必须说明待核验，不能编出处。

路径仅限仓库内部，不自动选择最新草稿当上一集。结果中的 `target_day` 和 `context_files` 可检查本次加载路径；普通闲聊和技术模式不会加载完整创作资料。资料放入模型请求不等于模型一定遵循人设，实际风格仍需真实模型和人工复核。

**能力边界：**此入口不能修改文件、运行门禁、联网核验或发布；模型只能返回草稿，不能声称已经完成这些操作。Claude Code 若有相应工具权限，另按项目 Skill 更新文件和运行检查。项目 Skill 的 description 有助于自动匹配，但不保证每次都被模型选中，也可手动输入 `/day-series-writer`；创建或更新 Skill 后，必要时重新打开 Claude Code 会话以重新发现。旧 `00_运营总览/skills/剧情生成/` 是废弃指针。

## 模型

不设置 `MOWAN_PROVIDER` 时，命令返回 `unconfigured`，不会编一条假回复。接真实模型时在环境里设置，不要写进仓库：

- `MOWAN_PROVIDER=openai`
- `MOWAN_API_BASE`：兼容 `/chat/completions` 的地址，带 `/v1`
- `MOWAN_API_KEY`
- `MOWAN_MODEL`

测试链路可显式用 `MOWAN_PROVIDER=mock`；输出会标注模拟、`model_configured=false`，不是模型创作结果。自定义 provider 未声明 `model_configured` 时该值为 `null`，不会把测试替身冒充真实模型。即使配置了模型，配置标记也不代表已验证它遵循人格。

## 记忆

普通模式按标题匹配 `00_运营总览/连续更新记忆.md`、`agent.md`、`00_运营总览/风格_黑话放开_2026-10-28.md`。记录 ID 是 `ops-notes:` 加相对路径；创作模式再只读加载上面列出的正文。不新建第二套库，不改这些文件。兴趣只认用户明确表达或笔记中已有的 `兴趣：` 行；创作和工作模式不插闲聊挑刺。
