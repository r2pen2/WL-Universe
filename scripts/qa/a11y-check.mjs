#!/usr/bin/env node
/**
 * Lighthouse accessibility audit for the WL sites.
 *
 *   node scripts/qa/a11y-check.mjs                          # every public site, live
 *   node scripts/qa/a11y-check.mjs --only beyond-the-bell   # one site (comma-separate for more)
 *   node scripts/qa/a11y-check.mjs --pr 104 --only you-can-do-it-gardening
 *
 * With --pr, each site's QA preview (pr-<n>-<app>.joed.dev) is audited next to the live site, and
 * the run fails if the preview scores lower or fails an audit the live site passes. That's the CI
 * gate on PRs: accessibility can only go up. Without --pr, it just prints the live scores.
 *
 * Needs Chrome (CHROME_PATH, or the usual install) and runs Lighthouse through npx.
 * Lighthouse only catches part of what matters; tab through the page and try a screen reader too.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { SPA_APPS, qaUrl } from "./apps.mjs";

const run = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIGHTHOUSE = "lighthouse@12";
/** Lighthouse scores move a point or so between runs; drops within this aren't regressions. */
const SCORE_TOLERANCE = 2;
/** Signed-in tools, not public pages: their front page is a login screen. */
const SKIP = new Set(["a-new-day-coaching-crm", "wl-admin-portal"]);

function parseArgs(argv) {
  const args = { pr: null, only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--pr" && argv[i + 1]) args.pr = argv[++i];
    else if (argv[i] === "--only" && argv[i + 1]) args.only = argv[++i].split(",").filter(Boolean);
  }
  return args;
}

function liveUrls() {
  const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "deploy/liveness/sites.json"), "utf8"));
  return Object.fromEntries(config.targets.map((t) => [t.name, t.url.replace(/\/liveness$/, "")]));
}

/** Runs Lighthouse (accessibility only) and returns the score and the failing audits. */
async function audit(url) {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wl-a11y-")), "report.json");
  // Windows can only start npx through a shell, which splits on spaces: quote there.
  const win = process.platform === "win32";
  const chromeFlags = win ? '"--chrome-flags=--headless=new --no-sandbox"' : "--chrome-flags=--headless=new --no-sandbox";
  await run(win ? "npx.cmd" : "npx", ["-y", LIGHTHOUSE, url, "--only-categories=accessibility", "--output=json", `--output-path=${out}`, "--quiet", chromeFlags], {
    shell: win,
    maxBuffer: 64 * 1024 * 1024,
  });
  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  const category = report.categories.accessibility;
  const failing = {};
  for (const ref of category.auditRefs) {
    const a = report.audits[ref.id];
    if (ref.weight > 0 && a.score === 0) failing[ref.id] = a.details?.items?.length || 1;
  }
  return { score: Math.round(category.score * 100), failing };
}

const describe = (failing) => Object.entries(failing).map(([id, n]) => `${id} (${n})`).join(", ") || "none";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const live = liveUrls();
  const apps = SPA_APPS.map((a) => a.app).filter((app) => !SKIP.has(app) && live[app] && (!args.only || args.only.includes(app)));
  const rows = [];
  let regressed = false;

  for (const app of apps) {
    const before = await audit(live[app]);
    if (!args.pr) {
      rows.push(`| ${app} | ${before.score} | ${describe(before.failing)} |`);
      continue;
    }
    const after = await audit(qaUrl(args.pr, app));
    const newFailures = Object.keys(after.failing).filter((id) => !(id in before.failing));
    const dropped = after.score < before.score - SCORE_TOLERANCE;
    if (dropped || newFailures.length) regressed = true;
    const verdict = dropped || newFailures.length ? `❌ ${newFailures.length ? `new: ${newFailures.join(", ")}` : "score dropped"}` : after.score > before.score ? "✅ better" : "✅";
    rows.push(`| ${app} | ${before.score} | ${after.score} | ${describe(after.failing)} | ${verdict} |`);
  }

  const header = args.pr
    ? ["| Site | Live | This PR | Still failing | |", "|---|---|---|---|---|"]
    : ["| Site | Score | Failing audits |", "|---|---|---|"];
  const table = ["### Accessibility (Lighthouse)", "", ...header, ...rows, ""].join("\n");
  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, table + "\n");
  if (regressed) {
    console.error("Accessibility got worse on at least one site. See the table above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
