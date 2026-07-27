#!/usr/bin/env node
/**
 * Point GoDaddy domains at Cloudflare nameservers (idempotent).
 *
 * Usage:
 *   node scripts/dns/set-godaddy-nameservers.mjs
 *   node scripts/dns/set-godaddy-nameservers.mjs --dry-run
 *   node scripts/dns/set-godaddy-nameservers.mjs --domain talkaboutdreams.com
 *   node scripts/dns/set-godaddy-nameservers.mjs --app boston-mixtape
 *
 * Env (prefer PAT):
 *   GODADDY_PAT
 *     scopes needed: domains.domain:read, domains.nameserver:update
 *
 * Legacy fallback:
 *   GODADDY_API_KEY + GODADDY_API_SECRET
 *   GODADDY_SHOPPER_ID  (optional)
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inventory = JSON.parse(
  readFileSync(join(__dirname, "../../deploy/dns/godaddy-domains.json"), "utf8"),
);

const TARGET_NS = inventory.cloudflareNameservers;

function parseArgs(argv) {
  const out = { dryRun: false, domain: null, app: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--domain") out.domain = argv[++i];
    else if (a === "--app") out.app = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function normalizeNs(list) {
  return (list || [])
    .map((ns) => String(ns).toLowerCase().replace(/\.$/, ""))
    .sort();
}

function sameNs(a, b) {
  const aa = normalizeNs(a);
  const bb = normalizeNs(b);
  return aa.length === bb.length && aa.every((v, i) => v === bb[i]);
}

function selectDomains({ domain, app }) {
  return inventory.domains
    .filter((entry) => {
      if (domain && entry.domain !== domain) return false;
      if (app && !(entry.apps || []).includes(app)) return false;
      return true;
    })
    .map((entry) => entry.domain);
}

function authHeaders() {
  const pat = process.env.GODADDY_PAT;
  if (pat) {
    return {
      mode: "pat",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
  }

  const key = process.env.GODADDY_API_KEY;
  const secret = process.env.GODADDY_API_SECRET;
  if (key && secret) {
    const headers = {
      Authorization: `sso-key ${key}:${secret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (process.env.GODADDY_SHOPPER_ID) {
      headers["X-Shopper-Id"] = process.env.GODADDY_SHOPPER_ID;
    }
    return { mode: "legacy", headers };
  }

  throw new Error(
    "Missing GoDaddy credentials. Set GODADDY_PAT (preferred), or GODADDY_API_KEY + GODADDY_API_SECRET.",
  );
}

async function godaddyRequest(method, path, body, { headers }) {
  const res = await fetch(`https://api.godaddy.com${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  if (!res.ok) {
    const detail =
      json?.message ||
      json?.code ||
      (Array.isArray(json?.fields) ? JSON.stringify(json.fields) : null) ||
      text ||
      res.statusText;
    throw new Error(`GoDaddy ${method} ${path} → ${res.status}: ${detail}`);
  }
  return { status: res.status, json };
}

async function getNameServers(domain, auth) {
  if (auth.mode === "pat") {
    const { json } = await godaddyRequest(
      "GET",
      `/v3/domains/domain-names/${domain}`,
      undefined,
      auth,
    );
    return json?.nameServers || [];
  }
  const { json } = await godaddyRequest(
    "GET",
    `/v1/domains/${domain}`,
    undefined,
    auth,
  );
  return json?.nameServers || [];
}

async function setNameServers(domain, auth) {
  if (auth.mode === "pat") {
    await godaddyRequest(
      "PUT",
      `/v3/domains/domain-names/${domain}/nameservers`,
      TARGET_NS,
      auth,
    );
    return;
  }
  await godaddyRequest(
    "PATCH",
    `/v1/domains/${domain}`,
    { nameServers: TARGET_NS },
    auth,
  );
}

async function syncDomain(domain, { dryRun, auth }) {
  const currentNs = await getNameServers(domain, auth);
  console.log(`\n${domain}`);
  console.log(`  current: ${currentNs.join(", ") || "(none)"}`);

  if (sameNs(currentNs, TARGET_NS)) {
    console.log("  already set — leaving alone");
    return { domain, ok: true, skipped: true };
  }

  if (dryRun) {
    console.log(`  dry-run: would set → ${TARGET_NS.join(", ")}`);
    return { domain, ok: true, dryRun: true };
  }

  await setNameServers(domain, auth);
  console.log(`  updated → ${TARGET_NS.join(", ")}`);
  return { domain, ok: true, updated: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      `Usage: node scripts/dns/set-godaddy-nameservers.mjs [--dry-run] [--domain example.com] [--app package-slug]`,
    );
    process.exit(0);
  }

  const domains = selectDomains(args);
  if (!domains.length) {
    if (args.app) {
      console.log(
        `No GoDaddy domains mapped for app "${args.app}" — skipping DNS step.`,
      );
      process.exit(0);
    }
    throw new Error(
      args.domain
        ? `Domain not in GoDaddy list: ${args.domain}`
        : "No domains in list",
    );
  }

  const auth = authHeaders();
  console.log(
    `GoDaddy → Cloudflare nameservers (auth=${auth.mode}, dryRun=${args.dryRun}, app=${args.app || "all"}, count=${domains.length})`,
  );
  console.log(`target: ${TARGET_NS.join(", ")}`);

  const results = [];
  for (const domain of domains) {
    try {
      results.push(await syncDomain(domain, { dryRun: args.dryRun, auth }));
    } catch (err) {
      console.log(`\n${domain}`);
      console.log(`  ERROR: ${err.message}`);
      results.push({ domain, ok: false, error: err.message });
    }
  }

  console.log("\n--- summary ---");
  for (const r of results) {
    const flag = r.ok
      ? r.skipped
        ? "ok"
        : r.dryRun
          ? "dry"
          : "updated"
      : "fail";
    console.log(
      `${flag.padEnd(8)} ${r.domain}${r.error ? ` (${r.error})` : ""}`,
    );
  }

  if (results.some((r) => !r.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
