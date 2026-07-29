#!/usr/bin/env node
/**
 * Detect which apps changed between two git refs.
 *
 *   node scripts/qa/detect-changed-apps.mjs --base origin/main --head HEAD
 *   node scripts/qa/detect-changed-apps.mjs --base SHA1 --head SHA2 --json
 *   node scripts/qa/detect-changed-apps.mjs --base SHA1 --head SHA2 --scope publish --json
 *
 * Rules:
 *   - deploy/compose/<app>.yml → that app
 *   - deploy/dns/sites/<app>.json → that app (inbound mail DNS)
 *   - packages/web-legos/** or packages/server-legos/** → all SPA apps
 *   - scripts/docs/** or packages/docs/** → docs (publish scope)
 *   - deploy/docker/node-react-express.Dockerfile → all SPA apps
 *   - deploy/docker/node-express.Dockerfile → site-mail
 *   - deploy/docker/docs-static.Dockerfile → docs
 *   - root package-lock / package.json / sync script → all apps in scope
 *   - site-mail / docs only when their own paths (or shared docker) change
 *
 * --scope qa      (default): SPA + site-mail
 * --scope publish: SPA + site-mail + docs
 */
import { execFileSync } from "node:child_process";
import {
  ALL_APPS,
  APP_BY_NAME,
  PUBLISH_APPS,
  SPA_APPS,
} from "./apps.mjs";

function parseArgs(argv) {
  const args = { base: null, head: "HEAD", json: false, scope: "qa" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base" && argv[i + 1]) args.base = argv[++i];
    else if (a === "--head" && argv[i + 1]) args.head = argv[++i];
    else if (a === "--scope" && argv[i + 1]) args.scope = argv[++i];
    else if (a === "--json") args.json = true;
  }
  if (!args.base) throw new Error("--base <ref> is required");
  if (args.scope !== "qa" && args.scope !== "publish") {
    throw new Error('--scope must be "qa" or "publish"');
  }
  return args;
}

function catalogFor(scope) {
  return scope === "publish" ? PUBLISH_APPS : ALL_APPS;
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

function detect(files, catalog) {
  const selected = new Set();
  let sharedLibs = false;
  let allSpaDocker = false;
  let allCatalogDocker = false;
  const known = new Set(catalog.map((a) => a.app));

  for (const file of files) {
    if (
      file.startsWith("packages/web-legos/") ||
      file.startsWith("packages/server-legos/")
    ) {
      sharedLibs = true;
      continue;
    }
    if (
      file === "package-lock.json" ||
      file === "package.json" ||
      file === "scripts/sync-local-packages.mjs"
    ) {
      allCatalogDocker = true;
      continue;
    }
    if (file === "deploy/docker/node-react-express.Dockerfile") {
      allSpaDocker = true;
      continue;
    }
    if (file === "deploy/docker/node-express.Dockerfile") {
      if (known.has("site-mail")) selected.add("site-mail");
      continue;
    }
    if (file === "deploy/docker/docs-static.Dockerfile") {
      if (known.has("docs")) selected.add("docs");
      continue;
    }
    if (file.startsWith("deploy/docker/")) {
      // Unknown shared docker path — rebuild everything in scope.
      allCatalogDocker = true;
      continue;
    }
    if (file.startsWith("scripts/docs/") && known.has("docs")) {
      selected.add("docs");
      continue;
    }

    const pkg = file.match(/^packages\/([^/]+)\//);
    if (pkg) {
      const name = pkg[1];
      if (known.has(name) && APP_BY_NAME[name]) selected.add(name);
      continue;
    }

    const compose = file.match(
      /^deploy\/compose\/([^/]+)\.(yml|env\.example)$/,
    );
    if (compose && known.has(compose[1]) && APP_BY_NAME[compose[1]]) {
      selected.add(compose[1]);
      continue;
    }

    // Per-app inbound mail DNS config
    const mailSite = file.match(/^deploy\/dns\/sites\/([^/]+)\.json$/);
    if (mailSite && known.has(mailSite[1]) && APP_BY_NAME[mailSite[1]]) {
      selected.add(mailSite[1]);
    }
  }

  if (sharedLibs || allSpaDocker) {
    for (const a of SPA_APPS) {
      if (known.has(a.app)) selected.add(a.app);
    }
  }
  if (allCatalogDocker) {
    for (const a of catalog) selected.add(a.app);
  }

  return catalog.map((a) => a.app).filter((name) => selected.has(name));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = catalogFor(args.scope);
  const files = changedFiles(args.base, args.head);
  const apps = detect(files, catalog);
  if (args.json) {
    console.log(
      JSON.stringify({
        apps,
        files,
        base: args.base,
        head: args.head,
        scope: args.scope,
      }),
    );
  } else {
    console.log(apps.join("\n"));
  }
}

main();
