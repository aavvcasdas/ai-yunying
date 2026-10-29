# 鲸鱼娘 · Live2D 素材生成器

把自己画的/生成的**分层矢量图**变成 Live2D 可用素材。一份 SVG 源 → 部件 PNG → 分层 PSD → （可选）`.moc3`。

```bash
cd tools/live2d
npm install                     # @resvg/resvg-js  ag-psd  sharp  @napi-rs/canvas

node build.mjs --size 2048      # 1. SVG → out/parts/*.png + out/whale_girl.psd + out/preview.png
node render-states.mjs          # 2. 离线渲染 5 个表情状态 → out/states/*.png + states_sheet.png
node server.mjs                 # 3. 打开 http://localhost:8080/ ← 拖滑块实时驱动
```

## 产出物

| 文件 | 说明 |
|---|---|
| `out/whale_girl.psd` | **27 层分层 PSD，2048×2048，RGB/8bit**，图层名按 psd2live 语义规范 |
| `out/parts/*.png` | 每个部件一张（已裁到 alpha 包围盒，记录画布坐标） |
| `out/preview.png` | 合成定妆图 |
| `out/states/*.png` | 5 个表情/姿态的离线渲染（idle / 转头 / 眨眼张嘴 / 说话摆尾 / 半闭眼） |
| `out/states_sheet.png` | 上面 5 张的对比图 |
| `out/manifest.json` | 网页预览用的部件清单（名字/位置/尺寸） |

## 文件结构

```
tools/live2d/
├── src/character.svg        角色源（每个 PART 标记块 = 一层）
├── build.mjs                SVG 切层 → PNG + PSD + 预览
├── render-states.mjs        离线渲染状态图（验收用）
├── server.mjs               静态服务器（预览页 + 素材）
└── web/
    ├── index.html           预览页
    ├── viewer.js            交互（滑块 / 自动眨眼 / 呼吸 / 摆动 / 说话）
    └── rig.mjs              ★ 骨架逻辑，浏览器与 Node 共用同一份
```

## 图层命名（改图时不要乱改）

`build.mjs` 按 `<!--PART:名字-->` 切层，名字直接变成 PSD 图层名。psd2live 靠**图层名**识别部件类型，所以名字必须落在它的词表里：

| 图层名 | 部件 | 备注 |
|---|---|---|
| `back hair` | 后发 | 放最底层，做头发摇摆 |
| `tail` | 尾巴 | 鲸尾，摆动轴心在右侧 |
| `neck` | 脖子 | 头部转动时跟随 |
| `topwear` | 躯干/女仆装 | 含白色围裙与鲸鱼标记 |
| `handwear-l` / `handwear-r` | 左右手臂 | 侧别用 `-l` / `-r` |
| `neckwear` | 领结 + 白色领口 | |
| `ear-l` / `ear-r` | 鳍耳 | 必须是**独立层**，别并进头发 |
| `face` | 脸皮 | 一整张，只画轮廓与肤色 |
| `facedetail` | 腮红 + 鼻子 | |
| `eyewhite-l/r` | 眼白 | 画大，边缘靠睫毛盖 |
| `irides-l/r` | 虹膜（含瞳孔/高光） | 画满整圆，靠眼白裁 |
| `eyelash-l/r` | 上睫毛 | 闭眼时淡出 |
| `eye close-l/r` | 闭眼线 | 睁眼时 alpha=0 |
| `eyebrow-l/r` | 眉毛 | |
| `mouth close` / `mouth open` | 闭嘴 / 张嘴 | 两张差分，靠 alpha 与纵向缩放切换 |
| `front hair` | 刘海 | 顶点必须高于眼睛，否则转头会戳眼 |
| `front hair 2` | 侧发 + 呆毛 | |
| `headwear` | 女仆发箍 + 蝴蝶结 | |
| `objects` | 头顶小鲸鱼 | 道具层 |

## 换角色（不做矢量重绘也能用）

`src/character.svg` 末尾留了 `imagePose` 槽位：把某个 PART 的图形换成
`<image href="你的图.png" .../>` 贴到同一坐标，图层名与切分方式不变，`build.mjs` 照样出 PSD。

⚠️ 整张图塞进去只能做「一张图 + 差分」，没有部件就没有可动性。**要做能动的模型，必须按部件拆层。**

## 这套东西能做什么、不能做什么

- ✅ 出**符合 Live2D 导入规范**的分层 PSD（Cubism Editor `Ctrl+O` 直接进）
- ✅ 出**符合 psd2live 语义**的图层名，丢进去能自动绑骨并导出 `.moc3`
- ✅ 参数驱动的预览与离线状态图，用来验证「层切得够不够、层序对不对」
- ❌ **不能直接生成 `.moc3`**：moc3 是 Cubism 私有格式，仓库里没有、也不该有编解码器。
  必须走 Cubism Editor 或 psd2live 导出。
- ❌ 不是正式美术资产：这版是矢量示意稿，用来打通管线；正式上镜要么重绘，要么换成
  `tools/day3制作/whale_girl_src/` 里的高清立绘按同样 27 层切。

## 与项目现行素材的关系

现行形象仍是 `tools/day3制作/whale_girl_src/`（41 张高清姿势 + 10 骨骨架 + 28 动作），
按 `agent.md` 第 9 条，Live2D 只是**新增资产**，尚未定为本项目正式形象。
