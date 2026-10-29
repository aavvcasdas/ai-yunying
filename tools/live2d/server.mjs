#!/usr/bin/env node
/* 静态服务器：把 out/ 的素材和 web/ 的预览页一起提供出来
   访问 http://<host>:8080/  → 分层骨架预览
   访问 http://<host>:8080/preview.png → 合成定妆图
   访问 http://<host>:8080/whale_girl.psd → 分层 PSD 下载
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
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let rel = url === "/" ? "/index.html" : url;

  // web/ 优先，其次 out/（manifest.json、parts/*.png、preview.png、psd）
  for (const root of [WEB, OUT]) {
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) continue;           // 防目录穿越
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || "application/octet-stream");
    }
  }
  send(res, 404, "404 Not Found: " + rel);
}).listen(PORT, "0.0.0.0", () => {
  console.log(`预览已启动 → http://0.0.0.0:${PORT}/  (web: ${WEB}, out: ${OUT})`);
});
