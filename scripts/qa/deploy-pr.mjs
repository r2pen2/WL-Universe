#!/usr/bin/env node
/**
 * Deploy ephemeral QA compose projects on glados for a PR.
 *
 *   node scripts/qa/deploy-pr.mjs --pr 42 --apps beyond-the-bell,site-mail --sha abc1234
 *
 * Requires: docker (via sudo), repo checkout, images already pushed as :pr-<n>
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_BY_NAME,
  qaContainerName,
  qaProjectName,
  qaUrl,
} from "./apps.mjs";
import { generateCompose } from "./generate-compose.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const QA_ENV_DIR = "/opt/services/data/app-env/qa";
const QA_ASSETS_ROOT = "/opt/services/data/app-assets/qa";
const QA_COMPOSE_ROOT = "/opt/services/data/app-assets/qa/compose";

function parseArgs(argv) {
  const args = {
    pr: null,
    apps: [],
    sha: null,
    owner: process.env.GITHUB_REPOSITORY_OWNER || "r2pen2",
    out: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--apps" && argv[i + 1]) {
      args.apps = argv[++i]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === "--sha" && argv[i + 1]) args.sha = argv[++i];
    else if (a === "--owner" && argv[i + 1]) args.owner = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.out = argv[++i];
  }
  if (!args.pr) throw new Error("--pr is required");
  if (!args.apps.length) throw new Error("--apps is required");
  for (const app of args.apps) {
    if (!APP_BY_NAME[app]) throw new Error(`Unknown app: ${app}`);
  }
  return args;
}

function run(cmd, cmdArgs, opts = {}) {
  console.log(`+ ${cmd} ${cmdArgs.join(" ")}`);
  return execFileSync(cmd, cmdArgs, {
    stdio: "inherit",
    ...opts,
  });
}

function sh(script) {
  run("bash", ["-lc", script]);
}

function ensureQaEnv(app) {
  const dest = path.join(QA_ENV_DIR, `${app}.env`);
  const example = path.join(repoRoot, "deploy/qa/env", `${app}.env.example`);
  sh(`sudo mkdir -p ${JSON.stringify(QA_ENV_DIR)}`);
  if (fs.existsSync(dest)) {
    console.log(`env exists: ${dest}`);
    return dest;
  }
  if (!fs.existsSync(example)) {
    throw new Error(`Missing QA env stub: ${example}`);
  }
  sh(`sudo cp ${JSON.stringify(example)} ${JSON.stringify(dest)}`);
  sh(`sudo chmod 640 ${JSON.stringify(dest)}`);
  console.log(`env seeded: ${dest}`);
  return dest;
}

function ensureAssets(pr, app) {
  const root = path.join(QA_ASSETS_ROOT, `pr-${pr}`, app);
  const entry = APP_BY_NAME[app];
  sh(`sudo mkdir -p ${JSON.stringify(root)}`);
  if (entry.kind === "spa") {
    sh(`sudo mkdir -p ${JSON.stringify(path.join(root, "static"))}`);
    sh(`sudo mkdir -p ${JSON.stringify(path.join(root, "images"))}`);
    const sa = path.join(root, "serviceAccountKey.json");
    const placeholderSrc = path.join(
      repoRoot,
      "deploy/qa/firebase-placeholder.json",
    );
    if (!fs.existsSync(placeholderSrc)) {
      throw new Error(`Missing ${placeholderSrc}`);
    }
    sh(
      `if [ ! -f ${JSON.stringify(sa)} ]; then sudo cp ${JSON.stringify(placeholderSrc)} ${JSON.stringify(sa)}; fi`,
    );
    if (entry.extraVolumes?.includes("cal")) {
      const cal = path.join(root, "cal.json");
      const calTmp = path.join("/tmp", `qa-cal-${pr}-${app}.json`);
      fs.writeFileSync(calTmp, "{}\n");
      sh(
        `if [ ! -f ${JSON.stringify(cal)} ]; then sudo cp ${JSON.stringify(calTmp)} ${JSON.stringify(cal)}; fi`,
      );
      fs.unlinkSync(calTmp);
    }
  }
  return root;
}

function deployOne({ pr, app, owner, sha }) {
  ensureQaEnv(app);
  ensureAssets(pr, app);

  const project = qaProjectName(pr, app);
  const composeDir = path.join(QA_COMPOSE_ROOT, `pr-${pr}`, app);
  const composeFile = path.join(composeDir, "compose.yml");
  sh(`sudo mkdir -p ${JSON.stringify(composeDir)}`);

  const yaml = generateCompose({
    pr,
    app,
    owner,
    tag: `pr-${pr}`,
  });
  const tmp = path.join("/tmp", `qa-compose-${pr}-${app}.yml`);
  fs.writeFileSync(tmp, yaml);
  sh(`sudo cp ${JSON.stringify(tmp)} ${JSON.stringify(composeFile)}`);
  fs.unlinkSync(tmp);

  // Prefer registry pull; fall back to a local tag (useful for smoke tests).
  try {
    run("sudo", [
      "docker",
      "compose",
      "-p",
      project,
      "-f",
      composeFile,
      "pull",
    ]);
  } catch (err) {
    console.warn(
      `compose pull failed for ${app}:pr-${pr}; trying local image if present`,
    );
    const image = `ghcr.io/${String(owner).toLowerCase()}/wl-universe-${app}:pr-${pr}`;
    try {
      execFileSync("sudo", ["docker", "image", "inspect", image], {
        stdio: "ignore",
      });
    } catch {
      throw err;
    }
  }
  run("sudo", [
    "docker",
    "compose",
    "-p",
    project,
    "-f",
    composeFile,
    "up",
    "-d",
    "--remove-orphans",
  ]);
  run("sudo", ["docker", "compose", "-p", project, "-f", composeFile, "ps"]);

  const url = qaUrl(pr, app);
  run("node", [
    path.join(repoRoot, "scripts/qa/update-active-json.mjs"),
    "upsert",
    "--pr",
    String(pr),
    "--app",
    app,
    "--url",
    url,
    "--sha",
    sha || "",
  ]);

  return {
    app,
    project,
    container: qaContainerName(pr, app),
    url,
    liveness: `${url}/liveness`,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  sh(`sudo mkdir -p ${JSON.stringify(QA_ASSETS_ROOT)}`);
  const deployments = [];
  for (const app of args.apps) {
    deployments.push(
      deployOne({
        pr: args.pr,
        app,
        owner: args.owner,
        sha: args.sha,
      }),
    );
  }
  const summary = { ok: true, pr: Number(args.pr), deployments };
  console.log(JSON.stringify(summary, null, 2));
  if (args.out) {
    fs.writeFileSync(args.out, `${JSON.stringify(deployments)}\n`);
  }
}

main();
