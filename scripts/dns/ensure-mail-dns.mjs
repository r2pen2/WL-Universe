#!/usr/bin/env node
/**
 * Idempotent Cloudflare DNS for inbound mail (MX + SPF TXT + Outlook autodiscover).
 *
 * Loads:
 *   deploy/dns/profiles.json
 *   deploy/dns/sites/<app>.json   (email.enabled apps)
 *   deploy/dns/mail-zones.json    (extras without an app site file)
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  (required) — Zone DNS Edit
 *   DRY_RUN=1             print intended changes only
 *   MAIL_APPS             optional comma-separated app slugs (same as --apps)
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs
 *   CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs --apps beyond-the-bell,you-can-do-it-gardening
 */
import { loadMailZones } from "./load-mail-config.mjs";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const API = "https://api.cloudflare.com/client/v4";

function parseArgs(argv) {
  const apps = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--apps" && argv[i + 1]) {
      apps.push(
        ...String(argv[++i])
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
  }
  if (process.env.MAIL_APPS) {
    apps.push(
      ...String(process.env.MAIL_APPS)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  return { apps: [...new Set(apps)] };
}

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

async function ensureCname(zoneId, zoneName, name, content) {
  const fqdn = name === "@" ? zoneName : `${name}.${zoneName}`;
  const existing = await cf(
    "GET",
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fqdn)}`,
  );
  const match = (existing || []).find((r) => r.type === "CNAME");
  const desired = content.replace(/\.$/, "");
  if (match) {
    const current = String(match.content).replace(/\.$/, "").toLowerCase();
    if (current === desired.toLowerCase() && match.proxied === false) {
      console.log(`  CNAME ok: ${fqdn} → ${desired}`);
      return { action: "unchanged", type: "CNAME", name: fqdn };
    }
    console.log(`  CNAME update: ${fqdn} → ${desired}`);
    if (!DRY_RUN) {
      await cf("PUT", `/zones/${zoneId}/dns_records/${match.id}`, {
        type: "CNAME",
        name: fqdn,
        content: desired,
        proxied: false,
        ttl: 1,
      });
    }
    return { action: DRY_RUN ? "would-update" : "updated", type: "CNAME", name: fqdn };
  }
  console.log(`  CNAME create: ${fqdn} → ${desired}`);
  if (!DRY_RUN) {
    await cf("POST", `/zones/${zoneId}/dns_records`, {
      type: "CNAME",
      name: fqdn,
      content: desired,
      proxied: false,
      ttl: 1,
    });
  }
  return { action: DRY_RUN ? "would-create" : "created", type: "CNAME", name: fqdn };
}

async function main() {
  if (!TOKEN) {
    console.error(
      "CLOUDFLARE_API_TOKEN is required.\n" +
        "Use GitHub secret CLOUDFLARE_API_TOKEN or:\n" +
        "  export CLOUDFLARE_API_TOKEN=...\n",
    );
    process.exit(1);
  }

  const { apps } = parseArgs(process.argv.slice(2));
  const { profiles, zones } = loadMailZones(apps.length ? { apps } : {});

  if (!zones.length) {
    console.log(
      apps.length
        ? `No email-enabled site configs for apps: ${apps.join(", ")}`
        : "No mail zones configured.",
    );
    return;
  }

  if (DRY_RUN) console.log("DRY_RUN=1 — no Cloudflare writes\n");
  if (apps.length) console.log(`Scoped to apps: ${apps.join(", ")}\n`);

  const summary = [];
  for (const entry of zones) {
    const profile = profiles[entry.profile];
    const label = entry.app ? `${entry.zone} [${entry.app}]` : entry.zone;
    console.log(`== ${label} (${profile.label || entry.profile}) ==`);
    const zoneId = await ensureZoneId(entry.zone);
    const desiredMx = resolveMx(profile, entry.zone);
    const mxActions = await ensureMx(zoneId, entry.zone, desiredMx);
    const spfActions = await ensureSpf(zoneId, entry.zone, profile.spf);
    const extra = [];
    if (profile.mxMode === "outlook-protection") {
      extra.push(
        await ensureCname(
          zoneId,
          entry.zone,
          "autodiscover",
          "autodiscover.outlook.com",
        ),
      );
    }
    summary.push({
      zone: entry.zone,
      profile: entry.profile,
      mx: mxActions,
      spf: spfActions,
      extra,
    });
    console.log("");
  }

  const changed = summary.flatMap((s) =>
    [...s.mx, ...s.spf, ...(s.extra || [])].filter((a) => a.action !== "unchanged"),
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
