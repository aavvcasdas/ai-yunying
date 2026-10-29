# 原创角色 · Live2D 素材生成器

把**代码里画的矢量角色**变成 Live2D 可用素材。一条源文件 → 部件 PNG → 分层 PSD →（可选）`.moc3`。

现在是**四个原创角色**，不是复刻任何现成模型：凯 Kai（赤潮机甲）、露米 Lumi（星鲸）、桃桃 Momo（甜梦草莓）、妮莉 Nelly（兔兔海军）。

```bash
cd tools/live2d
npm install                        # @resvg/resvg-js  ag-psd  sharp  @napi-rs/canvas

node build.mjs                     # 全部角色：out/<id>/parts/*.png + <id>.psd + preview.png + manifest.json + chars.json
node build.mjs --only lumi,nelly    # 只重建指定角色
node make-sheets.mjs               # 每个角色 4 状态 sheet.png + 四角色 lineup.png
node server.mjs                    # http://localhost:8080/ ← 切角色、拖滑块实时驱动
```

## 产出物

| 文件 | 说明 |
|---|---|
| `out/<id>/<id>.psd` | **分层 PSD，2048×2048，RGB/8bit**，图层名按 psd2live 语义规范（kai 27 层 / lumi 27 / momo 25 / nelly 26） |
| `out/<id>/parts/*.png` | 每层一张（裁到 alpha 包围盒，`manifest.json` 记画布坐标） |
| `out/<id>/preview.png` | 定妆图（2048） |
| `out/<id>/sheet.png` | 4 状态验收图（idle / 转头闭眼 / 张嘴说话 / 半闭眼，2×2） |
| `out/chars.json` | 角色索引：id、中英文名、主题、描述、配色、manifest 路径 |
| `out/lineup.png` | 四角色定妆图并排（对外展示用） |

## 文件结构

```
tools/live2d/
├── src/lib.mjs               ★ 部件库：face / eyeWhite / iris / lashes / mouth / bangs / sideLock / ear / tail …
├── src/chars/<id>.mjs        角色定义（配色 + 逐层 SVG 片段），新增角色只加一个文件
├── build.mjs                 SVG → 部件 PNG → 裁剪 → 分层 PSD + preview + manifest + chars.json
├── make-sheets.mjs           离线出状态拼图与 lineup（复用 web/rig.mjs）
├── server.mjs                静态服务器（预览页 + 素材 + PSD）
└── web/
    ├── index.html            预览页
    ├── viewer.js             切角色 / 滑块 / 自动眨眼呼吸摆尾 / 说话口型 / 图层列表
    └── rig.mjs               ★ 骨架逻辑，浏览器与 Node 共用同一份
```

## 新增一个角色

在 `src/chars/` 下建 `xxx.mjs`，用 `src/lib.mjs` 的部件函数逐层 `add("图层名", svg)`，
导出一个 `meta`（id / name / theme / nameAscii / themeAscii / desc / palette）。
`build.mjs` 自动发现该文件，跑 `node build.mjs --only xxx` 即可。

**图层名不能随便起** —— psd2live 靠图层名识别部件类型：

| 图层名 | 部件 | 要点 |
|---|---|---|
| `back hair` | 后发 | 最底层，做摇摆 |
| `tail` | 尾巴 | 摆动轴心在右侧 |
| `neck` | 脖子 | 跟头转 |
| `topwear` / `bottomwear` | 躯干 / 下装 | |
| `handwear-l` / `handwear-r` | 手臂 | 侧别用 `-l` / `-r` |
| `neckwear` | 领子 / 领结 | 只留小圆领，别横跨脖子画浅色弧（会被读成围兜） |
| `ear-l` / `ear-r` | 兽耳 / 鳍耳 | 必须独立层 |
| `face` | 脸皮 | 只画轮廓与肤色 |
| `facedetail` | 腮红 + 鼻子 | |
| `eyewhite-l/r` | 眼白 | 画大，边缘靠睫毛盖 |
| `irides-l/r` | 虹膜 | 画满整圆，靠眼白裁 |
| `eyelash-l/r` | 上睫毛 | 闭眼时淡出 |
| `eye close-l/r` | 闭眼线 | 睁眼时 alpha=0 |
| `eyebrow-l/r` | 眉毛 | |
| `mouth close` / `mouth open` | 闭嘴 / 张嘴 | 两张差分，靠 alpha 与纵向缩放切换 |
| `front hair` | 刘海 | **最低点必须高于眼顶**，否则转头戳眼 |
| `front hair 2` | 侧发 + 呆毛 | 宽度 ≤66，否则像悬浮板 |
| `headwear` | 帽子 / 头带 | 帽檐底部不得高于眼顶 |
| `objects` | 道具 | 最上层 |

### 画图时踩过的坑（别再踩）

- 刘海最低点 > 眼顶（本项目 y≈376），`bangs()` 默认 `tipY 352`。
- 兽耳 / 鳍耳**基部要贴头**，别飘在两侧。
- 侧发用 `sideLock()`，宽 ≤66、x 取 358 / 666；颜色用亮一档的 `hairMid` 才有层次。
- 帽子白边 / 帽檐底部不低于 y≈384，否则盖眼。
- 发夹、草莓这类装饰**不得与脸部椭圆相交**。
- 横跨脖子的浅色弧 = 围兜；横带（头带 + 护目条）要**收窄居中**，否则糊成一顶浴帽。
- 中文标签在 PNG 里会变豆腐块（沙箱无中文字体），所以图内一律英文（`nameAscii` / `themeAscii`），中文只在网页里出现。

## 换角色 / 接真立绘

`build.mjs` 吃的是 SVG 字符串，不限定来源。想用真立绘，把某个 `add()` 的图形换成
`<image href="你的图.png" .../>` 贴到同一坐标即可，图层名与切分方式不变。

⚠️ 整张图塞进去只能做「一张图 + 差分」，没有部件就没有可动性。**要做能动的模型，必须按部件拆层。**

## 这套东西能做什么、不能做什么

- ✅ 出**符合 Live2D 导入规范**的分层 PSD（Cubism Editor `Ctrl+O` 直接进）
- ✅ 图层名落在 psd2live 语义词表内，丢进去能自动绑骨并导出 `.moc3`
- ✅ 参数驱动的预览与离线状态图，用来验证「层切得够不够、层序对不对」
- ❌ **不能直接生成 `.moc3`**：私有格式，必须 Cubism Editor 或 psd2live 导出
- ❌ 不是正式美术资产：这版是矢量示意稿，用来打通管线；正式上镜要么重绘，要么按同样层切真立绘

## 与项目现行素材的关系

项目现行形象仍是 `tools/day3制作/whale_girl_src/`（41 张高清姿势 + 10 骨骨架 + 28 动作）。
按 `agent.md` 第 9 条，Live2D 只是**新增资产**，尚未定为本项目正式形象。

> 历史说明：本目录第一版曾照着社区里的 DS 鲸鱼娘模型复刻过一套 27 层素材（`src/character.svg`），
> 因授权链不清晰、且不属于原创，**已于 2026-10-29 整体删除**，改为现在的四个原创角色。
