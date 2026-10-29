#!/usr/bin/env node
/* 静态服务器
   /                → web/index.html（角色切换 + 参数驱动预览）
   /chars.json      → out/chars.json
   /<id>/preview.png / <id>/sheet.png / <id>/*.psd / <id>/manifest.json / <id>/parts/*.png
   /lineup.png      → 四角色定妆图
*/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const WEB = path.join(HERE, "web");
const OUT = path.join(HERE, "out");
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".psd": "image/vnd.adobe.photoshop",
};

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let rel = url === "/" ? "/index.html" : url;

  for (const root of [WEB, OUT]) {
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) continue;            // 防目录穿越
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || "application/octet-stream");
    }
  }
  send(res, 404, "404 Not Found: " + rel);
}).listen(PORT, "0.0.0.0", () => {
  console.log(`预览已启动 → http://0.0.0.0:${PORT}/`);
});
