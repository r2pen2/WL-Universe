#!/usr/bin/env node
/**
 * Idempotent Cloudflare DNS for inbound mail (MX + SPF TXT).
 *
 * Reads deploy/dns/mail-zones.json and ensures each zone has the profile's
 * MX records (DNS-only / not proxied) and a single SPF TXT at the apex.
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  (required) — Zone DNS Edit on all listed zones
 *   DRY_RUN=1             print intended changes only
 *   MAIL_ZONES_PATH       optional override of config JSON path
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs
 *   DRY_RUN=1 CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CONFIG_PATH =
  process.env.MAIL_ZONES_PATH ||
  path.join(ROOT, "deploy/dns/mail-zones.json");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const API = "https://api.cloudflare.com/client/v4";

async function cf(method, apiPath, body) {
  const res = await fetch(`${API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = JSON.stringify(json.errors || json, null, 2);
    throw new Error(`Cloudflare ${method} ${apiPath} failed (${res.status}): ${err}`);
  }
  return json.result;
}

async function listAllDns(zoneId, type) {
  const out = [];
  let page = 1;
  for (;;) {
    const batch = await cf(
      "GET",
      `/zones/${zoneId}/dns_records?type=${encodeURIComponent(type)}&per_page=100&page=${page}`,
    );
    out.push(...(batch || []));
    if (!batch || batch.length < 100) break;
    page += 1;
  }
  return out;
}

function isSpf(content) {
  return /^v=spf1\b/i.test(String(content || "").replace(/^"|"$/g, ""));
}

async function ensureZoneId(zoneName) {
  const zones = await cf(
    "GET",
    `/zones?name=${encodeURIComponent(zoneName)}&status=active`,
  );
  if (!zones?.length) {
    throw new Error(`Zone not found (or token lacks access): ${zoneName}`);
  }
  return zones[0].id;
}

function resolveMx(profile, zoneName) {
  if (profile.mxMode === "outlook-protection") {
    // Microsoft 365: example.com → example-com.mail.protection.outlook.com
    const host = `${zoneName.replace(/\./g, "-")}.mail.protection.outlook.com`;
    return [{ priority: 0, content: host }];
  }
  return profile.mx || [];
}

async function ensureMx(zoneId, zoneName, desiredMx) {
  const existing = await listAllDns(zoneId, "MX");
  const desiredKeys = new Set(
    desiredMx.map((m) => `${m.priority}|${m.content.replace(/\.$/, "").toLowerCase()}`),
  );
  const existingKeys = new Set(
    existing.map(
      (r) =>
        `${r.priority}|${String(r.content).replace(/\.$/, "").toLowerCase()}`,
    ),
  );

  const actions = [];

  for (const rec of existing) {
    const key = `${rec.priority}|${String(rec.content).replace(/\.$/, "").toLowerCase()}`;
    if (!desiredKeys.has(key)) {
      console.log(`  MX delete: ${zoneName} → ${rec.priority} ${rec.content}`);
      if (!DRY_RUN) {
        await cf("DELETE", `/zones/${zoneId}/dns_records/${rec.id}`);
      }
      actions.push({ action: DRY_RUN ? "would-delete" : "deleted", type: "MX", ...rec });
    }
  }

  for (const m of desiredMx) {
    const content = m.content.replace(/\.$/, "");
    const key = `${m.priority}|${content.toLowerCase()}`;
    if (existingKeys.has(key)) {
      const match = existing.find(
        (r) =>
          Number(r.priority) === Number(m.priority) &&
          String(r.content).replace(/\.$/, "").toLowerCase() === content.toLowerCase(),
      );
      if (match?.proxied) {
        console.log(`  MX unproxy: ${zoneName} → ${m.priority} ${content}`);
        if (!DRY_RUN) {
          await cf("PUT", `/zones/${zoneId}/dns_records/${match.id}`, {
            type: "MX",
            name: zoneName,
            content,
            priority: m.priority,
            proxied: false,
          });
        }
        actions.push({ action: DRY_RUN ? "would-unproxy" : "unproxied", type: "MX", content });
      } else {
        console.log(`  MX ok: ${zoneName} → ${m.priority} ${content}`);
        actions.push({ action: "unchanged", type: "MX", content });
      }
      continue;
    }

    console.log(`  MX create: ${zoneName} → ${m.priority} ${content}`);
    if (!DRY_RUN) {
      await cf("POST", `/zones/${zoneId}/dns_records`, {
        type: "MX",
        name: zoneName,
        content,
        priority: m.priority,
        proxied: false,
        ttl: 1,
      });
    }
    actions.push({ action: DRY_RUN ? "would-create" : "created", type: "MX", content });
  }

  return actions;
}

async function ensureSpf(zoneId, zoneName, spf) {
  if (!spf) return [];
  const txts = await listAllDns(zoneId, "TXT");
  const apexSpf = txts.filter(
    (r) =>
      (r.name === zoneName || r.name === `${zoneName}.`) && isSpf(r.content),
  );
  const normalizedDesired = spf.trim();
  const actions = [];

  const already = apexSpf.find(
    (r) => String(r.content).replace(/^"|"$/g, "").trim() === normalizedDesired,
  );

  for (const r of apexSpf) {
    const content = String(r.content).replace(/^"|"$/g, "").trim();
    if (content === normalizedDesired) continue;
    console.log(`  SPF delete stale: ${zoneName} → ${content}`);
    if (!DRY_RUN) {
      await cf("DELETE", `/zones/${zoneId}/dns_records/${r.id}`);
    }
    actions.push({ action: DRY_RUN ? "would-delete" : "deleted", type: "TXT", content });
  }

  if (already) {
    console.log(`  SPF ok: ${zoneName} → ${normalizedDesired}`);
    actions.push({ action: "unchanged", type: "TXT", content: normalizedDesired });
    return actions;
  }

  console.log(`  SPF create: ${zoneName} → ${normalizedDesired}`);
  if (!DRY_RUN) {
    await cf("POST", `/zones/${zoneId}/dns_records`, {
      type: "TXT",
      name: zoneName,
      content: normalizedDesired,
      proxied: false,
      ttl: 1,
    });
  }
  actions.push({
    action: DRY_RUN ? "would-create" : "created",
    type: "TXT",
    content: normalizedDesired,
  });
  return actions;
}

async function main() {
  if (!TOKEN) {
    console.error(
      "CLOUDFLARE_API_TOKEN is required.\n" +
        "Use GitHub secret CLOUDFLARE_API_TOKEN or:\n" +
        "  export CLOUDFLARE_API_TOKEN=...\n" +
        "  # optional local (never commit): /opt/services/data/app-env/cloudflare-api.env",
    );
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const profiles = config.profiles || {};
  const zones = config.zones || [];

  if (DRY_RUN) console.log("DRY_RUN=1 — no Cloudflare writes\n");

  const summary = [];
  for (const entry of zones) {
    const profile = profiles[entry.profile];
    if (!profile) {
      throw new Error(`Unknown profile '${entry.profile}' for zone ${entry.zone}`);
    }
    console.log(`== ${entry.zone} (${profile.label || entry.profile}) ==`);
    const zoneId = await ensureZoneId(entry.zone);
    const desiredMx = resolveMx(profile, entry.zone);
    const mxActions = await ensureMx(zoneId, entry.zone, desiredMx);
    const spfActions = await ensureSpf(zoneId, entry.zone, profile.spf);
    summary.push({
      zone: entry.zone,
      profile: entry.profile,
      mx: mxActions,
      spf: spfActions,
    });
    console.log("");
  }

  const changed = summary.flatMap((s) =>
    [...s.mx, ...s.spf].filter((a) => a.action !== "unchanged"),
  );
  console.log(
    DRY_RUN
      ? `Done (dry-run). ${changed.length} change(s) would apply across ${zones.length} zone(s).`
      : `Done. ${changed.length} change(s) applied across ${zones.length} zone(s).`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
