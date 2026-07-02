#!/usr/bin/env node

const { spawn } = require("node:child_process");

const BASE_URL = (process.env.SNIP_API || "http://localhost:3000").replace(/\/+$/, "");

function usage() {
  console.log([
    "Snip CLI",
    "",
    "Usage:",
    "  snip add <url>",
    "  snip ls",
    "  snip open <code>",
    "  snip help",
    "",
    "Environment:",
    "  SNIP_API   Backend origin (default: http://localhost:3000)",
  ].join("\n"));
}

function fail(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

function validateHttpUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function renderLinksTable(links) {
  const headers = ["CODE", "HITS", "URL"];
  const rows = links.map((link) => [String(link.code), String(link.hits), String(link.url)]);

  const widths = headers.map((header, index) => {
    let max = header.length;
    for (const row of rows) {
      if (row[index].length > max) {
        max = row[index].length;
      }
    }
    return max;
  });

  const format = (row) => row
    .map((cell, index) => cell.padEnd(widths[index]))
    .join("  ");

  console.log(format(headers));
  for (const row of rows) {
    console.log(format(row));
  }
}

function openInBrowser(targetUrl) {
  const platform = process.platform;

  if (platform === "win32") {
    return spawn("cmd", ["/c", "start", "", targetUrl], { stdio: "ignore", detached: true });
  }

  if (platform === "darwin") {
    return spawn("open", [targetUrl], { stdio: "ignore", detached: true });
  }

  return spawn("xdg-open", [targetUrl], { stdio: "ignore", detached: true });
}

async function run() {
  const [command, arg] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "add") {
    if (!arg) {
      fail("Missing url. Usage: snip add <url>");
    }

    if (!validateHttpUrl(arg)) {
      fail("URL must start with http:// or https://");
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: arg }),
      });
    } catch {
      fail(`Backend unreachable at ${BASE_URL}`);
    }

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      const message = payload && typeof payload.error === "string" ? payload.error : `Request failed (${response.status})`;
      fail(message);
    }

    if (!payload || typeof payload.shortUrl !== "string") {
      fail("Unexpected response from backend.");
    }

    console.log(payload.shortUrl);
    return;
  }

  if (command === "ls") {
    let response;
    try {
      response = await fetch(`${BASE_URL}/api/links`);
    } catch {
      fail(`Backend unreachable at ${BASE_URL}`);
    }

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      const message = payload && typeof payload.error === "string" ? payload.error : `Request failed (${response.status})`;
      fail(message);
    }

    if (!Array.isArray(payload)) {
      fail("Unexpected response from backend.");
    }

    if (payload.length === 0) {
      console.log("No links yet.");
      return;
    }

    renderLinksTable(payload);
    return;
  }

  if (command === "open") {
    if (!arg) {
      fail("Missing code. Usage: snip open <code>");
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}/${encodeURIComponent(arg)}`, { redirect: "manual" });
    } catch {
      fail(`Backend unreachable at ${BASE_URL}`);
    }

    if (response.status === 404) {
      fail(`Unknown code: ${arg}`);
    }

    const location = response.headers.get("location");
    if (!location) {
      fail(`Expected redirect target for code: ${arg}`);
    }

    const child = openInBrowser(location);
    child.on("error", () => fail("Failed to open browser."));
    child.unref();
    console.log(location);
    return;
  }

  fail(`Unknown command: ${command}\nRun: snip help`);
}

run().catch(() => {
  fail("Unexpected CLI error.");
});