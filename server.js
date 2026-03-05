const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "::";
const START_PORT = Number(process.env.PORT) || 8000;
const ROOT = __dirname;
const MAX_PORT_ATTEMPTS = 50;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type });
  res.end(body);
}

function resolvePath(urlPath) {
  let safePath = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (safePath.endsWith("/")) safePath += "index.html";
  if (safePath === "/") safePath = "/index.html";
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT, normalized);
}

function createServer() {
  return http.createServer((req, res) => {
    let filePath;
    try {
      filePath = resolvePath(req.url);
    } catch {
      send(res, 400, "Bad Request");
      return;
    }

    if (!filePath.startsWith(ROOT)) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        send(res, 404, "Not Found");
        return;
      }

      const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
      fs.readFile(finalPath, (readErr, data) => {
        if (readErr) {
          send(res, 404, "Not Found");
          return;
        }

        const ext = path.extname(finalPath).toLowerCase();
        const type = MIME_TYPES[ext] || "application/octet-stream";
        send(res, 200, data, type);
      });
    });
  });
}

function startAtPort(port, attempt) {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(
      `[ERROR] Could not bind a port after ${MAX_PORT_ATTEMPTS} attempts starting at ${START_PORT}.`
    );
    process.exit(1);
  }

  const server = createServer();

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`[WARN] Port ${port} is busy. Retrying on ${nextPort}...`);
      startAtPort(nextPort, attempt + 1);
      return;
    }

    console.error("[ERROR] Server failed to start:", err.message);
    process.exit(1);
  });

  server.listen({ host: HOST, port, ipv6Only: false }, () => {
    console.log(`[OK] Serving static files from: ${ROOT}`);
    console.log(`[OK] URL: http://localhost:${port}`);
    console.log(`[OK] URL: http://127.0.0.1:${port}`);
  });
}

startAtPort(START_PORT, 1);
