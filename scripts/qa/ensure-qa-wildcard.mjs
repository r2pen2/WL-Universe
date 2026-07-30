#!/usr/bin/env node
/**
 * Idempotent Cloudflare bootstrap for ephemeral QA hosts:
 *   DNS:  *.joed.dev → <tunnel-id>.cfargotunnel.com (proxied)
 *   Tunnel ingress: *.joed.dev → http://traefik:80
 *
 * QA preview URLs are pr-<n>-<app>.joed.dev so they match a single-label
 * wildcard and Cloudflare Universal SSL (*.joed.dev).
 *
 * Also keeps legacy *.qa.joed.dev DNS/ingress (harmless; not used for HTTPS QA).
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  (required) — Zone DNS Edit + Account Cloudflare Tunnel Edit
 *   CLOUDFLARE_ACCOUNT_ID (optional; default: glados tunnel account)
 *   CLOUDFLARE_TUNNEL_ID  (optional; default: glados remotely-managed tunnel)
 *   CLOUDFLARE_ZONE_NAME  (optional; default: joed.dev)
 *   QA_SERVICE_URL        (optional; default: http://traefik:80)
 *   DRY_RUN=1             print intended changes only
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/qa/ensure-qa-wildcard.mjs
 */
const ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || "17b93accf9a1b21bed639fe9c60a37e4";
const TUNNEL_ID =
  process.env.CLOUDFLARE_TUNNEL_ID || "8288c8be-e08a-4f20-accb-48730959bb41";
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME || "joed.dev";
const APEX_WILDCARD = `*.${ZONE_NAME}`;
const LEGACY_QA_WILDCARD = `*.qa.${ZONE_NAME}`;
const QA_SERVICE = process.env.QA_SERVICE_URL || "http://traefik:80";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const API = "https://api.cloudflare.com/client/v4";

async function cf(method, path, body) {
  const res = await fetch(`${API}${path}`, {
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
    throw new Error(`Cloudflare ${method} ${path} failed (${res.status}): ${err}`);
  }
  return json.result;
}

async function ensureZoneId() {
  const zones = await cf(
    "GET",
    `/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`,
  );
  if (!zones?.length) throw new Error(`Zone not found: ${ZONE_NAME}`);
  return zones[0].id;
}

async function ensureDnsRecord(zoneId, fqdn, recordName, comment) {
  const target = `${TUNNEL_ID}.cfargotunnel.com`;
  const existing = await cf(
    "GET",
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fqdn)}`,
  );
  const match = (existing || []).find(
    (r) => r.type === "CNAME" && r.name === fqdn,
  );

  if (match) {
    const contentOk = match.content === target;
    const proxiedOk = match.proxied === true;
    if (contentOk && proxiedOk) {
      console.log(`DNS ok: ${fqdn} → ${target} (proxied)`);
      return { action: "unchanged", id: match.id, hostname: fqdn };
    }
    const patch = {
      type: "CNAME",
      name: recordName,
      content: target,
      proxied: true,
      comment,
    };
    console.log(`DNS update: ${fqdn} → ${target} (proxied)`);
    if (DRY_RUN) return { action: "would-update", id: match.id, patch };
    await cf("PUT", `/zones/${zoneId}/dns_records/${match.id}`, patch);
    return { action: "updated", id: match.id, hostname: fqdn };
  }

  const create = {
    type: "CNAME",
    name: recordName,
    content: target,
    proxied: true,
    comment,
  };
  console.log(`DNS create: ${fqdn} → ${target} (proxied)`);
  if (DRY_RUN) return { action: "would-create", create };
  const created = await cf("POST", `/zones/${zoneId}/dns_records`, create);
  return { action: "created", id: created.id, hostname: fqdn };
}

function normalizeIngress(ingress) {
  return Array.isArray(ingress) ? ingress.slice() : [];
}

async function ensureTunnelIngressHostnames(hostnames) {
  const current = await cf(
    "GET",
    `/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`,
  );
  const config = current?.config || {};
  const ingress = normalizeIngress(config.ingress);
  const next = ingress.slice();
  let changed = false;

  for (const hostname of hostnames) {
    const already = next.some(
      (rule) =>
        rule.hostname === hostname &&
        (rule.service === QA_SERVICE || rule.service === "http://traefik:80"),
    );
    if (already) {
      console.log(`Tunnel ingress ok: ${hostname} → ${QA_SERVICE}`);
      continue;
    }
    const catchAllIdx = next.findIndex((r) => !r.hostname);
    const rule = { hostname, service: QA_SERVICE };
    if (catchAllIdx === -1) {
      next.push(rule, { service: "http_status:404" });
    } else {
      next.splice(catchAllIdx, 0, rule);
    }
    console.log(`Tunnel ingress add: ${hostname} → ${QA_SERVICE}`);
    changed = true;
  }

  if (!changed) {
    return { action: "unchanged", ingressCount: next.length };
  }
  if (DRY_RUN) {
    return { action: "would-update", ingressCount: next.length };
  }

  await cf("PUT", `/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`, {
    config: {
      ...config,
      ingress: next,
    },
  });
  return { action: "updated", ingressCount: next.length };
}

async function main() {
  if (!TOKEN) {
    console.error(
      "CLOUDFLARE_API_TOKEN is required.\n" +
        "Create a token with:\n" +
        "  - Zone.DNS:Edit (joed.dev)\n" +
        "  - Account.Cloudflare Tunnel:Edit (or Cloudflare One Connector: cloudflared Write)\n" +
        "Store it as GitHub Actions secret CLOUDFLARE_API_TOKEN (never commit).",
    );
    process.exit(2);
  }

  console.log(
    JSON.stringify(
      {
        accountId: ACCOUNT_ID,
        tunnelId: TUNNEL_ID,
        zone: ZONE_NAME,
        hostnames: [APEX_WILDCARD, LEGACY_QA_WILDCARD],
        service: QA_SERVICE,
        dryRun: DRY_RUN,
      },
      null,
      2,
    ),
  );

  const zoneId = await ensureZoneId();
  // Apex wildcard covers pr-<n>-<app>.joed.dev + Universal SSL.
  const dnsApex = await ensureDnsRecord(
    zoneId,
    APEX_WILDCARD,
    "*",
    "WL-Universe QA + catch-all first-level subdomains → tunnel",
  );
  // Keep legacy nested wildcard for any older Traefik rules still pointing there.
  const dnsQa = await ensureDnsRecord(
    zoneId,
    LEGACY_QA_WILDCARD,
    "*.qa",
    "WL-Universe ephemeral QA wildcard (legacy)",
  );
  const tunnel = await ensureTunnelIngressHostnames([
    APEX_WILDCARD,
    LEGACY_QA_WILDCARD,
  ]);

  console.log(JSON.stringify({ ok: true, dnsApex, dnsQa, tunnel }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
