const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = process.env.PUBLIC_DIR;

function getBaseUrl() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`.replace(/\/$/, "");
  }

  return `http://localhost:${PORT}`;
}

const BASE_URL = getBaseUrl();

const links = new Map();
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomBase62(length) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * BASE62.length);
    out += BASE62[idx];
  }
  return out;
}

function makeUniqueCode() {
  let code;
  do {
    code = randomBase62(6);
  } while (links.has(code));
  return code;
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function withCorsHeaders(headers = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...headers,
  };
}

function toPayload(record) {
  return {
    code: record.code,
    url: record.url,
    shortUrl: record.shortUrl,
    hits: record.hits,
    createdAt: record.createdAt,
  };
}

function safePathFromUrlPathname(urlPathname) {
  if (!PUBLIC_DIR) return null;

  const publicRoot = path.resolve(PUBLIC_DIR);
  const decodedPath = decodeURIComponent(urlPathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const resolved = path.resolve(publicRoot, relativePath);

  if (!resolved.startsWith(publicRoot + path.sep) && resolved !== publicRoot) {
    return null;
  }

  if (!fs.existsSync(resolved)) {
    return null;
  }

  if (fs.statSync(resolved).isDirectory()) {
    const indexPath = path.join(resolved, "index.html");
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
    return null;
  }

  return resolved;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: withCorsHeaders(),
      });
    }

    if (method === "POST" && url.pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400, withCorsHeaders());
      }

      if (!body || typeof body.url !== "string" || !isValidHttpUrl(body.url)) {
        return jsonResponse({ error: "URL must be a valid http(s) URL" }, 400, withCorsHeaders());
      }

      const code = makeUniqueCode();
      const record = {
        code,
        url: body.url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };

      links.set(code, record);
      return jsonResponse(toPayload(record), 201, withCorsHeaders());
    }

    if (method === "GET" && url.pathname === "/api/links") {
      const all = Array.from(links.values()).map(toPayload);
      return jsonResponse(all, 200, withCorsHeaders());
    }

    const staticPath = safePathFromUrlPathname(url.pathname);
    if (method === "GET" && staticPath) {
      const file = Bun.file(staticPath);
      return new Response(file, {
        status: 200,
        headers: withCorsHeaders({ "content-type": contentTypeFor(staticPath) }),
      });
    }

    if (method === "GET" && url.pathname.length > 1) {
      const code = url.pathname.slice(1);
      const record = links.get(code);

      if (!record) {
        return jsonResponse({ error: "Not found" }, 404, withCorsHeaders());
      }

      record.hits += 1;
      return new Response(null, {
        status: 302,
        headers: withCorsHeaders({ location: record.url }),
      });
    }

    return jsonResponse({ error: "Not found" }, 404, withCorsHeaders());
  },
});

console.log(`Snip backend listening on ${BASE_URL} (port ${PORT})`);
