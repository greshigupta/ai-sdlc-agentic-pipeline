#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const bundleDir = path.join(rootDir, "bundle");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");
const cliDir = path.join(rootDir, "cli");
const npmCacheDir = path.join(rootDir, ".npm-cache");

const pushEnabled = process.argv.includes("--push");

function bin(base) {
  return process.platform === "win32" ? `${base}.cmd` : base;
}

function run(command, args, cwd, options = {}) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${label}`);
  }
}

function capture(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result.stdout.trim();
}

function hasStagedChanges(cwd) {
  const diff = capture("git", ["diff", "--cached", "--name-only"], cwd);
  return diff.length > 0;
}

function commitIfStaged(cwd, message) {
  if (!hasStagedChanges(cwd)) {
    console.log(`No staged changes in ${cwd}; skipping commit.`);
    return false;
  }

  run("git", ["commit", "-m", message], cwd);
  return true;
}

function writeText(filePath, content) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function assembleBundle() {
  const frontendBuildDir = path.join(frontendDir, "dist", "snip-frontend", "browser");
  const frontendIndex = path.join(frontendBuildDir, "index.html");

  if (!existsSync(frontendIndex)) {
    throw new Error(`Frontend build missing expected file: ${frontendIndex}`);
  }

  const bundlePublicDir = path.join(bundleDir, "public");
  rmSync(bundlePublicDir, { recursive: true, force: true });
  mkdirSync(bundlePublicDir, { recursive: true });

  cpSync(path.join(backendDir, "server.js"), path.join(bundleDir, "server.js"));
  cpSync(path.join(cliDir, "cli.js"), path.join(bundleDir, "cli.js"));
  cpSync(frontendBuildDir, bundlePublicDir, { recursive: true });

  writeText(path.join(bundleDir, ".env"), "PUBLIC_DIR=./public\n");

  writeText(
    path.join(bundleDir, "package.json"),
    JSON.stringify(
      {
        name: "snip-bundle",
        private: true,
        scripts: {
          start: "bun server.js",
        },
      },
      null,
      2
    ) + "\n"
  );

  writeText(
    path.join(bundleDir, "Dockerfile"),
    [
      "FROM oven/bun:1-alpine",
      "WORKDIR /app",
      "COPY . .",
      "ENV PORT=3000",
      "EXPOSE 3000",
      "CMD [\"bun\", \"server.js\"]",
      "",
    ].join("\n")
  );

  writeText(
    path.join(bundleDir, ".dockerignore"),
    [".git", "node_modules", "npm-debug.log", "dist", "",].join("\n")
  );

  writeText(
    path.join(bundleDir, "railway.json"),
    JSON.stringify(
      {
        build: {
          builder: "DOCKERFILE",
        },
      },
      null,
      2
    ) + "\n"
  );
}

function main() {
  console.log("Updating backend/frontend/cli submodules to branch tips...");
  run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"], rootDir);

  mkdirSync(npmCacheDir, { recursive: true });
  const frontendEnv = { npm_config_cache: npmCacheDir };

  console.log("Building frontend...");
  run(bin("npm"), ["install"], frontendDir, { env: frontendEnv });
  run(bin("npx"), ["ng", "build"], frontendDir, { env: frontendEnv });

  console.log("Assembling bundle artifacts...");
  assembleBundle();

  console.log("Committing generated output inside bundle submodule if needed...");
  run("git", ["add", "-A"], bundleDir);
  const bundleCommitted = commitIfStaged(bundleDir, "chore: regenerate bundle output");

  if (pushEnabled) {
    console.log("Pushing bundle branch (HEAD:bundle)...");
    run("git", ["push", "origin", "HEAD:bundle"], bundleDir);
  }

  console.log("Updating superproject bundle pointer if needed...");
  run("git", ["add", "bundle"], rootDir);
  const mainCommitted = commitIfStaged(rootDir, "chore: bump bundle submodule pointer");

  if (pushEnabled) {
    console.log("Pushing main branch...");
    run("git", ["push", "origin", "main"], rootDir);
  }

  if (!bundleCommitted && !mainCommitted) {
    console.log("No changes to commit in bundle or superproject.");
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}