# 大肥鱼 · Live2D 素材管线

把现成的分层素材包转成 **Live2D 能导入的分层 PSD**，并做参数化验证。
不做重绘 —— 形象用项目自己的：大肥鱼（鲸鱼娘）。

```bash
cd tools/live2d
npm install                       # @napi-rs/canvas  ag-psd  sharp

node build-pack.mjs               # assets/whale-maid → out/dafeiyu/
node server.mjs                   # http://localhost:8080/  ← 拖参数实时看
```

## 素材来源

`FAYER-0610/dafeiyu-vtuber` · `overlay/avatar/packs/whale-maid/`

- **94 张 PNG + `rig.json`**，原生 1024×1536
- 29 个部件，带 z 序 / 画布矩形 / 枢轴点 / 三层组（root→body→head）
- 自带面部变形参数（视差、压缩、曲线）、头发物理（刚度/阻尼/最大摆角）、差分命名（眼 3 态、眉 6 种、嘴 11 种）

> ⚠️ **授权：CC BY-NC-SA 4.0，仅限非商业直播。** 原型「溟月」@上善无形，设计 @ZipZipPipe。
> 商用必须另行取得授权；`assets/whale-maid/ATTRIBUTION.md` 必须随素材一同保留。

## 产出物

| 文件 | 说明 |
|---|---|
| `out/dafeiyu/dafeiyu.psd` | **32 层 / 1024×1536 / RGB 8bit**，图层名按 psd2live 语义，无重名无蒙版，psd-tools 已校验 |
| `out/dafeiyu/preview.png` | 中立姿态定妆图 |
| `out/dafeiyu/sheet.png` | 4 状态验收图（idle / 转头眨眼 / 张嘴摆身 / 半闭眼害羞） |
| `out/dafeiyu/manifest.json` | 每层的 PSD 图层名 + 画布矩形 |

## 文件结构

```
tools/live2d/
├── assets/whale-maid/       素材包原样（94 PNG + rig.json + ATTRIBUTION.md + LICENSE）
├── src/pack.mjs             ★ 运行时：头部转动 / 面部视差 / 头发物理 / 眨眼 / 口型 / 表情
│                              node 与浏览器共用同一份，避免两边不一样
├── build-pack.mjs           PNG → 语义图层名 → 分层 PSD + preview + sheet + manifest
├── server.mjs               静态服务器（页面 / 素材 / 生成的 PSD 都能下）
└── web/
    ├── index.html           预览页
    └── pack-viewer.js       交互（7 参数 + 7 表情 + 自动眨眼/呼吸/物理/口型/视线）
```

## 图层名映射（psd2live 靠这个自动绑骨）

| 原部件 | PSD 图层名 |
|---|---|
| `backHair` / `longHairLeft` / `longHairRight` | `back hair` / `back hair 2-l` / `back hair 2-r` |
| `neck` / `body` | `neck` / `topwear` |
| `face` / `blushLeft` `blushRight` | `face` / `facedetail-l` `facedetail-r` |
| `chestBow` | `neckwear` |
| `eyeWhiteL/R` / `irisL/R` / `highlightL/R` / `eyelidL/R` | `eyewhite-l` `-r` / `irides-l` `-r` / `irides-l 2` `-r 2` / `eyelash-l` `-r` |
| `eyelidL-closed` / `eyelidR-closed` | `eye close-l` / `eye close-r` |
| `mouth-N` / `mouth-A` | `mouth close` / `mouth open` |
| `headdress` / `ribbonL` `ribbonR` | `headwear` / `headwear 2-l` `headwear 2-r` |
| `sideHairL/R` | `side hair-l` / `side hair-r`（FRONT_HAIR + role `side`） |
| `frontHair` / `ahoge` | `front hair` / `front hair 2` |
| `browL/R` | `eyebrow-l` / `eyebrow-r` |
| `whaleClip` / `tassel` | `objects` / `objects 2` |

## 还差的一步：`.moc3`

`.moc3` 是 Live2D 私有格式，只能由 Cubism Editor 或 psd2live 产出。沙箱里没有 JDK/Cubism，
所以这一步要在本机跑：

```bash
git clone https://github.com/tsunehimatoi/psd2live && cd psd2live
./gradlew -p ./psd2live run --args="--input <repo>/tools/live2d/out/dafeiyu/dafeiyu.psd --output ./out --atlas 2048 --mesh-spacing 32"
```

或用 Cubism：`Ctrl+O` 导入 PSD → 眼/嘴设开合参数 → 头发加物理 → 导出 moc3。
FREE 版限制（1 张 2048 贴图 / 100 ArtMesh / 30 参数 / 50 变形器）对 32 层的半身像完全够用。

拿到 moc3 后可以丢进 VTube Studio，或用 `pixi-live2d-display` 挂到网页/直播挂件上。

详见 [`Live2D导入_大肥鱼现成素材_2026-10-29.md`](../../00_运营总览/Live2D导入_大肥鱼现成素材_2026-10-29.md)。

## 能做什么、不能做什么

- ✅ 出符合 Cubism 导入规范的分层 PSD（RGB 8bit / 每部件一层 / 层名唯一 / 无蒙版）
- ✅ 图层名落在 psd2live 语义词表内，丢进去能自动绑骨并导出 moc3
- ✅ 参数化预览 + 四状态验收图，先验证「层序、遮挡、眨眼口型、头摆」都对
- ❌ 不能直接生成 moc3
- ❌ 预览是 canvas 2D 近似，不是 Live2D 的变形器系统；真正的九轴变形要绑骨后才有
- ❌ 素材包是半身像，没有手、腿、尾巴（原包就没有这些层）

## 历史说明

本目录先后做过两版「自己画」的尝试：先是照着社区 DS 鲸鱼娘模型复刻（授权不清，已删），
后是四个与鲸鱼娘无关的原创角色（物种不对，已删，可在 commit `91a3352` 找回）。
现在只保留「用项目自己的现成素材做 Live2D」这一条路。
