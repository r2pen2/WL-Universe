#!/usr/bin/env node
/**
 * Tear down ephemeral QA projects for a PR and update active.json.
 *
 *   node scripts/qa/cleanup-pr.mjs --pr 42
 *   node scripts/qa/cleanup-pr.mjs --pr 42 --prune-images
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_APPS, qaProjectName } from "./apps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const QA_COMPOSE_ROOT = "/opt/services/data/app-assets/qa/compose";
const QA_ASSETS_ROOT = "/opt/services/data/app-assets/qa";

function parseArgs(argv) {
  const args = { pr: null, pruneImages: false, owner: "r2pen2" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--prune-images") args.pruneImages = true;
    else if (a === "--owner" && argv[i + 1]) args.owner = argv[++i];
  }
  if (!args.pr) throw new Error("--pr is required");
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const entry of ALL_APPS) {
    cleanupOne(args.pr, entry.app);
  }
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

  console.log(
    JSON.stringify(
      { ok: true, pr: Number(args.pr), pruned: args.pruneImages },
      null,
      2,
    ),
  );
}

main();
