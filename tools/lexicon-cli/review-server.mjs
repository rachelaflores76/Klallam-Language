import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { LEXICON_DIR } from "./lib.mjs";

const PORT = Number(process.env.PORT ?? 5174);
const ROOT = LEXICON_DIR;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = requested === "/" ? "review/index.html" : requested.replace(/^\/+/, "");

  // Keep the resolved path inside the lexicon directory.
  const resolved = path.resolve(ROOT, relative);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME[path.extname(resolved)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(resolved).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Lexicon review page: http://localhost:${PORT}/`);
  console.log("Press Ctrl+C to stop.");
});
