# 魔丸 Agent

仓库里的可运行入口：`python3 tools/agent/run.py --message "你的问题"`

链路是：这条命令收输入 → 只读现有运营笔记的标题 → 组装魔丸提示 → 调模型 → 把回复打到标准输出。不后台抓取，不自动发布，不写记忆。

## 模型

不设置 `MOWAN_PROVIDER` 时，命令返回 `unconfigured`，不会编一条假回复。

要接真实模型，在环境里设置，不要写进仓库：

- `MOWAN_PROVIDER=openai`
- `MOWAN_API_BASE`：兼容 `/chat/completions` 的地址，带 `/v1`
- `MOWAN_API_KEY`
- `MOWAN_MODEL`

没配齐时命令会返回 `unconfigured`，不会假装已经生成。

## 记忆

只读 `00_运营总览/连续更新记忆.md`、`agent.md`、`00_运营总览/风格_黑话放开_2026-10-28.md`。记录 ID 是 `ops-notes:` 加相对路径。不新建第二套库，不改这些文件。

兴趣只认两类：用户这句话里明确说感兴趣，或这些笔记里已有的 `兴趣：` 行。对不上就不插话。
