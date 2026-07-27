#!/usr/bin/env node
/**
 * Idempotent Umami website provisioning + registry write.
 *
 * Creates one Umami website per SPA app-slug, then writes
 * deploy/analytics/websites.json (website UUIDs are not secrets).
 *
 * Env:
 *   UMAMI_URL              (default https://analytics.joed.dev)
 *   UMAMI_ADMIN_USER       (default admin)
 *   UMAMI_ADMIN_PASSWORD   (required) — or load from umami.env via --env-file
 *   UMAMI_ENV_FILE         (optional path; default /opt/services/data/app-env/umami.env)
 *
 * Usage:
 *   node scripts/analytics/provision-websites.mjs
 *   UMAMI_ADMIN_PASSWORD=... node scripts/analytics/provision-websites.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const registryPath = path.join(repoRoot, "deploy/analytics/websites.json");
const tsRegistryPath = path.join(
  repoRoot,
  "packages/web-legos/api/umamiRegistry.ts",
);

/** SPA apps that get client AnalyticsManager beacons (skip site-mail / docs). */
const SITES = [
  { slug: "beyond-the-bell", name: "Beyond the Bell", domain: "beyondthebelleducation.com" },
  { slug: "joe-dobbelaar", name: "Joe Dobbelaar", domain: "joed.dev" },
  { slug: "nicole-levin", name: "Nicole Levin", domain: "nicolelevin.org" },
  { slug: "you-can-do-it-gardening", name: "You Can Do It Gardening", domain: "youcandoitgardening.com" },
  { slug: "talk-about-dreams", name: "Talk About Dreams", domain: "talkaboutdreams.com" },
  { slug: "boston-mixtape", name: "Boston Mixtape", domain: "bostonmixtape.com" },
  { slug: "a-new-day-coaching", name: "A New Day Coaching", domain: "anewdaycoaching.com" },
  { slug: "a-new-day-coaching-crm", name: "A New Day Coaching CRM", domain: "bluprint.anewdaycoaching.com" },
  { slug: "wl-admin-portal", name: "WL Admin Portal", domain: "admin.joed.dev" },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadEnvFile(
  process.env.UMAMI_ENV_FILE || "/opt/services/data/app-env/umami.env",
);
const UMAMI_URL = (process.env.UMAMI_URL || "https://analytics.joed.dev").replace(
  /\/$/,
  "",
);
const USER = process.env.UMAMI_ADMIN_USER || fileEnv.UMAMI_ADMIN_USER || "admin";
const PASSWORD =
  process.env.UMAMI_ADMIN_PASSWORD || fileEnv.UMAMI_ADMIN_PASSWORD || "";

async function login() {
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.token) {
    throw new Error(
      `Umami login failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return json.token;
}

async function listWebsites(token) {
  const res = await fetch(`${UMAMI_URL}/api/websites?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`List websites failed (${res.status}): ${JSON.stringify(json)}`);
  }
  // Umami returns { data: [...], count } or a bare array depending on version.
  return Array.isArray(json) ? json : json.data || [];
}

async function createWebsite(token, { name, domain }) {
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, domain }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Create website ${name} failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return json;
}

async function main() {
  if (!PASSWORD) {
    console.error(
      "UMAMI_ADMIN_PASSWORD is required (env or umami.env).\n" +
        "After first boot, change the default admin/umami password and set UMAMI_ADMIN_PASSWORD.",
    );
    process.exit(2);
  }

  const token = await login();
  const existing = await listWebsites(token);
  const byDomain = new Map(
    existing.map((w) => [String(w.domain || "").toLowerCase(), w]),
  );
  const byName = new Map(
    existing.map((w) => [String(w.name || "").toLowerCase(), w]),
  );

  const publicUrl = "https://analytics.joed.dev";
  const registry = {
    umamiUrl: publicUrl,
    updatedAt: new Date().toISOString(),
    websites: {},
  };

  for (const site of SITES) {
    let website =
      byDomain.get(site.domain.toLowerCase()) ||
      byName.get(site.name.toLowerCase()) ||
      byName.get(site.slug.toLowerCase());

    if (!website) {
      console.log(`Creating website: ${site.slug} (${site.domain})`);
      website = await createWebsite(token, {
        name: site.name,
        domain: site.domain,
      });
    } else {
      console.log(`Website exists: ${site.slug} → ${website.id}`);
    }

    registry.websites[site.slug] = {
      websiteId: website.id,
      domain: site.domain,
      name: site.name,
    };
  }

  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`Wrote ${path.relative(repoRoot, registryPath)}`);

  const ts = `/**
 * Non-secret Umami website IDs (mirrors deploy/analytics/websites.json).
 * Regenerated by scripts/analytics/provision-websites.mjs — do not edit by hand
 * unless you know the dashboard UUID.
 */
export const UMAMI_URL = ${JSON.stringify(publicUrl)};

/** @type {Record<string, { websiteId: string, domain: string, name: string }>} */
export const UMAMI_WEBSITES = ${JSON.stringify(registry.websites, null, 2)};

export function umamiConfigFor(appSlug: string) {
  const entry = UMAMI_WEBSITES[appSlug];
  return {
    url: UMAMI_URL,
    websiteId: entry?.websiteId || "",
  };
}
`;
  fs.writeFileSync(tsRegistryPath, ts);
  console.log(`Wrote ${path.relative(repoRoot, tsRegistryPath)}`);
  console.log(
    JSON.stringify(
      { ok: true, count: Object.keys(registry.websites).length },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
