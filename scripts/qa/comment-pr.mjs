#!/usr/bin/env node
/**
 * Create or update the sticky QA deployments PR comment.
 *
 *   node scripts/qa/comment-pr.mjs --pr 42 --deployments '[{"app":"beyond-the-bell","url":"https://..."}]'
 *   node scripts/qa/comment-pr.mjs --pr 42 --empty
 *   node scripts/qa/comment-pr.mjs --pr 42 --teardown
 *
 * Requires: gh auth, pull-requests: write
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MARKER = "<!-- wl-universe-qa-deployments -->";

function parseArgs(argv) {
  const args = {
    pr: null,
    deployments: [],
    empty: false,
    teardown: false,
    repo: process.env.GITHUB_REPOSITORY || null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--deployments" && argv[i + 1]) {
      args.deployments = JSON.parse(argv[++i]);
    } else if (a === "--empty") args.empty = true;
    else if (a === "--teardown") args.teardown = true;
    else if (a === "--repo" && argv[i + 1]) args.repo = argv[++i];
  }
  if (!args.pr) throw new Error("--pr is required");
  if (!args.repo) throw new Error("--repo or GITHUB_REPOSITORY required");
  return args;
}

function buildBody(deployments, { empty, teardown }) {
  const lines = [MARKER, "## QA deployments", ""];
  if (teardown) {
    lines.push("_Ephemeral QA stacks for this PR have been torn down._", "");
    lines.push(
      "Registry: `/opt/services/data/app-assets/qa/active.json` (wl-status retired; not on Dozzle/`status.joed.dev`).",
    );
    return `${lines.join("\n")}\n`;
  }
  if (empty || !deployments.length) {
    lines.push(
      "_No apps changed — no ephemeral QA hosts for this update._",
      "",
    );
    return `${lines.join("\n")}\n`;
  }
  lines.push("| App | URL | Liveness |");
  lines.push("|-----|-----|----------|");
  for (const d of deployments) {
    lines.push(`| ${d.app} | ${d.url} | ${d.url}/liveness |`);
  }
  lines.push("");
  lines.push(
    "Ephemeral stacks tear down when this PR closes. See `deploy/qa/README.md`.",
  );
  return `${lines.join("\n")}\n`;
}

function ghJson(args) {
  const out = execFileSync("gh", args, { encoding: "utf8" });
  return JSON.parse(out || "null");
}

function findStickyComment(repo, pr) {
  const comments = ghJson([
    "api",
    `repos/${repo}/issues/${pr}/comments?per_page=100`,
  ]);
  if (!Array.isArray(comments)) return null;
  return (
    comments.find(
      (c) => typeof c.body === "string" && c.body.includes(MARKER),
    ) || null
  );
}

function patchOrCreate(repo, pr, body, existing) {
  const tmp = path.join(os.tmpdir(), `qa-pr-comment-${pr}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ body }));
  try {
    if (existing) {
      execFileSync(
        "gh",
        [
          "api",
          "-X",
          "PATCH",
          `repos/${repo}/issues/comments/${existing.id}`,
          "--input",
          tmp,
        ],
        { stdio: "inherit" },
      );
      return { action: "updated", id: existing.id };
    }
    execFileSync(
      "gh",
      [
        "api",
        "-X",
        "POST",
        `repos/${repo}/issues/${pr}/comments`,
        "--input",
        tmp,
      ],
      { stdio: "inherit" },
    );
    return { action: "created" };
  } finally {
    fs.unlinkSync(tmp);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const body = buildBody(args.deployments, {
    empty: args.empty,
    teardown: args.teardown,
  });
  const existing = findStickyComment(args.repo, args.pr);
  const result = patchOrCreate(args.repo, args.pr, body, existing);
  console.log(JSON.stringify({ ok: true, ...result }));
}

main();
