#!/usr/bin/env bash
# setup_video_fx.sh — 拉取 Day 0 成片用的 video-fx 管线，并放入 Day 1 的配音与覆盖文件。
#
# 用法:
#   bash video/setup_video_fx.sh            # 克隆到 ./video-fx
#   bash video/setup_video_fx.sh /path/dir  # 克隆到指定目录
#
# 说明: 不加 --depth 1，因为这个分支只有一个提交需要看；但仓库有 756MB，
#       如果只想拿代码、不要成片，见文件末尾的 sparse checkout 写法。

set -euo pipefail

REPO="aavvcasdas/video-fx"
BRANCH="arena/8be4c8f8-video-fx"
PIN="0147237"
DEST="${1:-video-fx}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> 克隆 $REPO @ $BRANCH → $DEST"
if [ -d "$DEST/.git" ]; then
  echo "    已存在，跳过克隆"
else
  gh repo clone "$REPO" "$DEST" -- --branch "$BRANCH" --single-branch
fi

cd "$DEST"
echo "==> 当前 HEAD: $(git rev-parse --short HEAD)（核对基线 $PIN，不一致说明分支已更新，先 diff 再覆盖）"

echo "==> 拷入 Day 1 配音脚本"
mkdir -p video build/tts assets
cp -v "$ROOT/video/day1_script.json" video/
cp -v "$ROOT/video/tts_build.py"     video/

echo "==> 检查依赖"
command -v node   >/dev/null || echo "    ! 缺 node"
command -v python3 >/dev/null || echo "    ! 缺 python3"
python3 -c "import edge_tts" 2>/dev/null || echo "    ! 缺 edge-tts：pip install edge-tts"
node -e "require('@napi-rs/canvas')" 2>/dev/null || echo "    ! 缺 @napi-rs/canvas：npm i @napi-rs/canvas"

cat <<'EOF'

==> 下一步
  1) python3 video/tts_build.py --calibrate          # 标定语速
  2) python3 video/tts_build.py --tier 2 --target 90 # 生成 assets/day1.mp3
  3) cp assets/day1.mp3 video-fx/assets/ 之后改 render.mjs 的 audioFile
  4) 同步 video-fx/src/core.js 的 DURATION 与 src/lyrics.js 的 LY

EOF
