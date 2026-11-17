#!/usr/bin/env node
/**
 * Tear down ephemeral QA projects for a PR and update active.json.
 *
 *   node scripts/qa/cleanup-pr.mjs --pr 42
 *   node scripts/qa/cleanup-pr.mjs --pr 42 --prune-images
 *   node scripts/qa/cleanup-pr.mjs --sweep --open 92,94   # also: delete QA data of every PR not open
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_APPS, cmsQaApps, qaProjectName } from "./apps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const QA_COMPOSE_ROOT = "/opt/services/data/app-assets/qa/compose";
const QA_ASSETS_ROOT = "/opt/services/data/app-assets/qa";

function parseArgs(argv) {
  const args = { pr: null, pruneImages: false, owner: "r2pen2", sweep: false, open: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--prune-images") args.pruneImages = true;
    else if (a === "--owner" && argv[i + 1]) args.owner = argv[++i];
    else if (a === "--sweep") args.sweep = true;
    else if (a === "--open" && argv[i + 1] !== undefined) {
      args.open = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!args.pr && !args.sweep) throw new Error("--pr (or --sweep --open N,M) is required");
  if (args.sweep && !args.open) throw new Error("--sweep needs --open (open PR numbers; may be empty)");
  return args;
}

function run(cmd, cmdArgs, opts = {}) {
  console.log(`+ ${cmd} ${cmdArgs.join(" ")}`);
  try {
    return execFileSync(cmd, cmdArgs, { stdio: "inherit", ...opts });
  } catch (err) {
    if (opts.allowFail) {
      console.warn(`command failed (ignored): ${cmd} ${cmdArgs.join(" ")}`);
      return null;
    }
    throw err;
  }
}

function sh(script, allowFail = false) {
  run("bash", ["-lc", script], { allowFail });
}

function cleanupOne(pr, app) {
  const project = qaProjectName(pr, app);
  const composeFile = path.join(
    QA_COMPOSE_ROOT,
    `pr-${pr}`,
    app,
    "compose.yml",
  );

  if (fs.existsSync(composeFile)) {
    run(
      "sudo",
      [
        "docker",
        "compose",
        "-p",
        project,
        "-f",
        composeFile,
        "down",
        "--remove-orphans",
      ],
      { allowFail: true },
    );
  } else {
    run(
      "sudo",
      ["docker", "compose", "-p", project, "down", "--remove-orphans"],
      { allowFail: true },
    );
  }

  sh(
    `sudo rm -rf ${JSON.stringify(path.join(QA_COMPOSE_ROOT, `pr-${pr}`, app))}`,
    true,
  );
  sh(
    `sudo rm -rf ${JSON.stringify(path.join(QA_ASSETS_ROOT, `pr-${pr}`, app))}`,
    true,
  );
}

function pruneImages(pr, owner) {
  for (const entry of ALL_APPS) {
    const image = `ghcr.io/${owner.toLowerCase()}/wl-universe-${entry.app}:pr-${pr}`;
    run("sudo", ["docker", "image", "rm", "-f", image], { allowFail: true });
  }
}

/**
 * Run scripts/qa/firestore-qa.mjs in the wl-cms image, which has Node and firebase-admin (the
 * static site images are nginx only, so running it in those silently did nothing and every
 * preview's qa-pr-<n>- collections were left behind). Same as deploy-pr.mjs seedFirestore.
 */
function runFirestoreQa(owner, pr, qaArgs) {
  const base = `ghcr.io/${String(owner).toLowerCase()}/wl-universe-wl-cms`;
  const candidates = pr ? [`${base}:pr-${pr}`, `${base}:latest`] : [`${base}:latest`];
  for (const image of candidates) {
    try {
      execFileSync("sudo", ["docker", "image", "inspect", image], { stdio: "ignore" });
    } catch {
      try {
        run("sudo", ["docker", "pull", image]);
      } catch {
        continue;
      }
    }
    run("sudo", [
      "docker", "run", "--rm",
      "-e", "NODE_PATH=/repo/packages/wl-cms/node_modules",
      "-v", "/opt/services/data/app-env:/opt/services/data/app-env:ro",
      "-v", `${repoRoot}/scripts:/repo/scripts:ro`,
      "--entrypoint", "node",
      image,
      "/repo/scripts/qa/firestore-qa.mjs",
      ...qaArgs,
    ]);
    return;
  }
  throw new Error("No wl-cms image available to run firestore-qa.mjs");
}

function cleanupFirestore(pr, owner) {
  const apps = [...cmsQaApps()];
  if (!apps.length) return;
  for (const app of apps) {
    try {
      runFirestoreQa(owner, pr, ["cleanup", "--pr", String(pr), "--app", app]);
    } catch (err) {
      // Keep tearing down the rest; the sweep in qa-preview-cleanup.yml retries leftovers.
      console.error(`::warning::firestore cleanup failed for ${app}: ${err.message}`);
    }
  }
}

/** Delete QA data of every PR that isn't open any more (leftovers of failed cleanups). */
function sweep(openPrs, owner) {
  const keep = openPrs.map(String);
  runFirestoreQa(owner, null, ["sweep", "--keep", keep.join(","), "--apps", [...cmsQaApps()].join(",")]);
  for (const root of [QA_ASSETS_ROOT, QA_COMPOSE_ROOT]) {
    sh(
      `for d in ${JSON.stringify(root)}/pr-*; do [ -d "$d" ] || continue; n="\${d##*/pr-}"; ` +
        `case ",${keep.join(",")}," in *",$n,"*) ;; *) echo "removing stale $d"; sudo rm -rf "$d";; esac; done`,
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pr) {
    sweep(args.open, args.owner);
    return;
  }
  for (const entry of ALL_APPS) {
    cleanupOne(args.pr, entry.app);
  }
  cleanupFirestore(args.pr, args.owner);
  sh(
    `sudo rm -rf ${JSON.stringify(path.join(QA_COMPOSE_ROOT, `pr-${args.pr}`))}`,
    true,
  );
  sh(
    `sudo rm -rf ${JSON.stringify(path.join(QA_ASSETS_ROOT, `pr-${args.pr}`))}`,
    true,
  );

  run("node", [
    path.join(repoRoot, "scripts/qa/update-active-json.mjs"),
    "remove",
    "--pr",
    String(args.pr),
  ]);

  if (args.pruneImages) pruneImages(args.pr, args.owner);
  if (args.sweep) sweep(args.open.filter((n) => n !== String(args.pr)), args.owner);

  console.log(
    JSON.stringify(
      { ok: true, pr: Number(args.pr), pruned: args.pruneImages },
      null,
      2,
    ),
  );
}

main();
