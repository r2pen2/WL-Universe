#!/usr/bin/env node
/**
 * Detect which QA apps changed between two git refs.
 *
 *   node scripts/qa/detect-changed-apps.mjs --base origin/main --head HEAD
 *   node scripts/qa/detect-changed-apps.mjs --base SHA1 --head SHA2 --json
 *
 * Rules (see docs/ephemeral-qa-environments.md):
 *   - packages/<app>/** or deploy/compose/<app>.yml → that app
 *   - packages/web-legos/** or packages/server-legos/** → all SPA apps
 *   - site-mail only when its package/compose/docker paths change
 *   - shared Dockerfile / root package-lock → all apps (conservative)
 */
import { execFileSync } from "node:child_process";
import { ALL_APPS, APP_BY_NAME, SPA_APPS } from "./apps.mjs";

function parseArgs(argv) {
  const args = { base: null, head: "HEAD", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base" && argv[i + 1]) args.base = argv[++i];
    else if (a === "--head" && argv[i + 1]) args.head = argv[++i];
    else if (a === "--json") args.json = true;
  }
  if (!args.base) throw new Error("--base <ref> is required");
  return args;
}

function changedFiles(base, head) {
  const out = execFileSync(
    "git",
    ["diff", "--name-only", `${base}...${head}`],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function detect(files) {
  const selected = new Set();
  let sharedLibs = false;
  let sharedDocker = false;

  for (const file of files) {
    if (
      file.startsWith("packages/web-legos/") ||
      file.startsWith("packages/server-legos/")
    ) {
      sharedLibs = true;
      continue;
    }
    if (
      file.startsWith("deploy/docker/") ||
      file === "package-lock.json" ||
      file === "package.json" ||
      file === "scripts/sync-local-packages.mjs"
    ) {
      sharedDocker = true;
      continue;
    }

    const pkg = file.match(/^packages\/([^/]+)\//);
    if (pkg) {
      const name = pkg[1];
      if (APP_BY_NAME[name]) selected.add(name);
      continue;
    }

    const compose = file.match(/^deploy\/compose\/([^/]+)\.(yml|env\.example)$/);
    if (compose && APP_BY_NAME[compose[1]]) {
      selected.add(compose[1]);
    }
  }

  if (sharedLibs) {
    for (const a of SPA_APPS) selected.add(a.app);
  }
  if (sharedDocker) {
    for (const a of ALL_APPS) selected.add(a.app);
  }

  return ALL_APPS.map((a) => a.app).filter((name) => selected.has(name));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = changedFiles(args.base, args.head);
  const apps = detect(files);
  if (args.json) {
    console.log(JSON.stringify({ apps, files, base: args.base, head: args.head }));
  } else {
    console.log(apps.join("\n"));
  }
}

main();
