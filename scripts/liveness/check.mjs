#!/usr/bin/env node
/**
 * Probe one or more /liveness URLs.
 *
 * Usage:
 *   node scripts/liveness/check.mjs
 *   node scripts/liveness/check.mjs --only beyond-the-bell
 *   node scripts/liveness/check.mjs --only beyond-the-bell --pr 42
 *   node scripts/liveness/check.mjs --url https://example.com/liveness --name smoke
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const args = {
    config: path.join(repoRoot, "deploy/liveness/sites.json"),
    only: null,
    pr: null,
    url: null,
    name: null,
    skipFeature: false,
    skipLive: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--config" && argv[i + 1]) args.config = argv[++i];
    else if (a === "--only" && argv[i + 1]) args.only = argv[++i];
    else if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--url" && argv[i + 1]) args.url = argv[++i];
    else if (a === "--name" && argv[i + 1]) args.name = argv[++i];
    else if (a === "--skip-feature") args.skipFeature = true;
    else if (a === "--skip-live") args.skipLive = true;
  }
  return args;
}

function loadConfig(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Array.isArray(config.targets) || !config.targets.length) {
    throw new Error(`No targets in ${configPath}`);
  }
  return config;
}

function featureUrlFor(target, pr, template) {
  if (!pr) return null;
  if (target.featureUrl) {
    return target.featureUrl.replaceAll("{pr}", pr).replaceAll("{name}", target.name);
  }
  const tpl = template || "https://pr-{pr}.{name}.qa.joed.dev/liveness";
  return tpl.replaceAll("{pr}", pr).replaceAll("{name}", target.name);
}

async function probe(label, url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "wl-liveness-check/1.0" },
    });
    const elapsedMs = Date.now() - started;
    const contentType = response.headers.get("content-type") || "";
    let body = null;
    let text = "";
    try {
      text = await response.text();
      if (contentType.includes("application/json")) body = JSON.parse(text);
    } catch {
      /* ignore */
    }
    const looksLikeSpaHtml =
      !contentType.includes("application/json") &&
      /<!doctype html|<html/i.test(text.slice(0, 200));
    const okJson = body && body.ok === true;
    const healthy =
      response.status === 200 &&
      !looksLikeSpaHtml &&
      (okJson || contentType.includes("application/json"));
    return {
      label,
      url,
      ok: healthy,
      status: response.status,
      elapsedMs,
      service: body && body.service,
      error: healthy
        ? undefined
        : looksLikeSpaHtml
          ? "got HTML (SPA catch-all?) instead of JSON liveness"
          : `unexpected response status=${response.status} content-type=${contentType}`,
    };
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      elapsedMs: Date.now() - started,
      error: error.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  /** @type {{ label: string, url: string }[]} */
  const jobs = [];
  let timeoutMs = 15000;

  if (args.url) {
    jobs.push({ label: args.name || "custom", url: args.url });
  } else {
    const config = loadConfig(args.config);
    timeoutMs = Number(config.timeoutMs) || 15000;
    const targets = args.only
      ? config.targets.filter((t) => t.name === args.only)
      : config.targets;
    if (!targets.length) {
      throw new Error(args.only ? `No target named '${args.only}'` : "No targets");
    }
    for (const target of targets) {
      if (!args.skipLive) {
        jobs.push({ label: `${target.name}/live`, url: target.url });
      }
      if (!args.skipFeature && args.pr) {
        const fUrl = featureUrlFor(target, args.pr, config.featureUrlTemplate);
        if (fUrl) jobs.push({ label: `${target.name}/feature`, url: fUrl });
      }
    }
  }

  const results = [];
  for (const job of jobs) {
    results.push(await probe(job.label, job.url, timeoutMs));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      ok: failed.length === 0,
      checked: results.length,
      failed: failed.length,
      pr: args.pr || null,
      results,
    }),
  );
  if (failed.length) {
    for (const f of failed) console.error(`FAIL ${f.label} ${f.url}: ${f.error || f.status}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ts: new Date().toISOString(), ok: false, error: error.message }));
  process.exit(1);
});
