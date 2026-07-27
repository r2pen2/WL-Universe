#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const args = { config: path.join(repoRoot, "deploy/liveness/sites.json") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config" && argv[i + 1]) args.config = argv[++i];
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

async function probe(target, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target.url, {
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
    } catch {}
    const looksLikeSpaHtml =
      !contentType.includes("application/json") &&
      /<!doctype html|<html/i.test(text.slice(0, 200));
    const okJson = body && body.ok === true;
    const healthy =
      response.status === 200 &&
      !looksLikeSpaHtml &&
      (okJson || contentType.includes("application/json"));
    return {
      name: target.name,
      url: target.url,
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
      name: target.name,
      url: target.url,
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
  const config = loadConfig(args.config);
  const timeoutMs = Number(config.timeoutMs) || 15000;
  const results = [];
  for (const target of config.targets) results.push(await probe(target, timeoutMs));
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    ok: failed.length === 0,
    checked: results.length,
    failed: failed.length,
    results,
  }));
  if (failed.length) {
    for (const f of failed) console.error(`FAIL ${f.name} ${f.url}: ${f.error || f.status}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ts: new Date().toISOString(), ok: false, error: error.message }));
  process.exit(1);
});
