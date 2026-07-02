import { access, stat } from "node:fs/promises";
import path from "node:path";

const store = new Map();
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const BASE_URL =
  process.env.BASE_URL ||
  (RAILWAY_PUBLIC_DOMAIN ? `https://${RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : null;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function randomBase62Code(length = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let code = "";
  for (const byte of bytes) {
    code += BASE62[byte % BASE62.length];
  }
  return code;
}

function generateUniqueCode() {
  let code;
  do {
    code = randomBase62Code(6);
  } while (store.has(code));
  return code;
}

function buildLinkResponse(link) {
  return {
    code: link.code,
    url: link.url,
    shortUrl: `${BASE_URL}/${link.code}`,
    hits: link.hits,
    createdAt: link.createdAt,
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function safePublicFilePath(urlPathname) {
  if (!PUBLIC_DIR) {
    return null;
  }

  const requestedPath = urlPathname === "/" ? "/index.html" : urlPathname;
  const normalized = path.normalize(requestedPath).replace(/^([.]{2}[/\\])+/, "");
  const fullPath = path.resolve(PUBLIC_DIR, `.${normalized}`);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return fullPath;
}

async function serveStaticIfExists(urlPathname) {
  const filePath = safePublicFilePath(urlPathname);
  if (!filePath) {
    return null;
  }

  if (!(await fileExists(filePath))) {
    return null;
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    return null;
  }

  return new Response(Bun.file(filePath), {
    status: 200,
    headers: corsHeaders(),
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (pathname === "/api/links" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      if (!payload || typeof payload.url !== "string" || !isValidHttpUrl(payload.url)) {
        return jsonResponse({ error: "url must be a valid http(s) URL" }, 400);
      }

      const link = {
        code: generateUniqueCode(),
        url: payload.url,
        hits: 0,
        createdAt: new Date().toISOString(),
      };

      store.set(link.code, link);
      return jsonResponse(buildLinkResponse(link), 201);
    }

    if (pathname === "/api/links" && request.method === "GET") {
      const links = Array.from(store.values()).map(buildLinkResponse);
      return jsonResponse(links, 200);
    }

    if (PUBLIC_DIR && request.method === "GET") {
      const staticResponse = await serveStaticIfExists(pathname);
      if (staticResponse) {
        return staticResponse;
      }
    }

    if (request.method === "GET" && pathname.length > 1) {
      const code = pathname.slice(1);
      const link = store.get(code);

      if (!link) {
        return new Response("Not Found", {
          status: 404,
          headers: corsHeaders(),
        });
      }

      link.hits += 1;
      return new Response(null, {
        status: 302,
        headers: {
          Location: link.url,
          ...corsHeaders(),
        },
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders(),
    });
  },
});

console.log(`Snip backend running on ${server.url}`);