#!/usr/bin/env node
/**
 * Idempotent Cloudflare bootstrap for analytics.joed.dev:
 *   DNS:  analytics.joed.dev → <tunnel-id>.cfargotunnel.com (proxied)
 *   Tunnel ingress: analytics.joed.dev → http://traefik:80
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  (required for API path)
 *   CLOUDFLARE_ACCOUNT_ID (optional; default: glados tunnel account)
 *   CLOUDFLARE_TUNNEL_ID  (optional; default: glados remotely-managed tunnel)
 *   CLOUDFLARE_ZONE_NAME  (optional; default: joed.dev)
 *   ANALYTICS_HOSTNAME    (optional; default: analytics.joed.dev)
 *   ANALYTICS_SERVICE_URL (optional; default: http://traefik:80)
 *   DRY_RUN=1
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/analytics/ensure-analytics-hostname.mjs
 *
 * Dashboard fallback (if token unavailable):
 *   Zero Trust → Networks → Tunnels → glados tunnel → Public Hostname
 *     Subdomain: analytics  Domain: joed.dev  Service: http://traefik:80
 *   DNS CNAME analytics → <tunnel-id>.cfargotunnel.com (proxied) is usually auto-created.
 */
const ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || "17b93accf9a1b21bed639fe9c60a37e4";
const TUNNEL_ID =
  process.env.CLOUDFLARE_TUNNEL_ID || "8288c8be-e08a-4f20-accb-48730959bb41";
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME || "joed.dev";
const HOSTNAME = process.env.ANALYTICS_HOSTNAME || `analytics.${ZONE_NAME}`;
const SERVICE = process.env.ANALYTICS_SERVICE_URL || "http://traefik:80";
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

async function ensureDns(zoneId) {
  const target = `${TUNNEL_ID}.cfargotunnel.com`;
  const existing = await cf(
    "GET",
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(HOSTNAME)}`,
  );
  const match = (existing || []).find(
    (r) => r.type === "CNAME" && r.name === HOSTNAME,
  );

  if (match) {
    const contentOk = match.content === target;
    const proxiedOk = match.proxied === true;
    if (contentOk && proxiedOk) {
      console.log(`DNS ok: ${HOSTNAME} → ${target} (proxied)`);
      return { action: "unchanged", id: match.id };
    }
    const patch = {
      type: "CNAME",
      name: HOSTNAME,
      content: target,
      proxied: true,
    };
    console.log(`DNS update: ${HOSTNAME} → ${target} (proxied)`);
    if (DRY_RUN) return { action: "would-update", id: match.id, patch };
    await cf("PUT", `/zones/${zoneId}/dns_records/${match.id}`, patch);
    return { action: "updated", id: match.id };
  }

  const create = {
    type: "CNAME",
    name: "analytics",
    content: target,
    proxied: true,
    comment: "WL-Universe Umami analytics",
  };
  console.log(`DNS create: ${HOSTNAME} → ${target} (proxied)`);
  if (DRY_RUN) return { action: "would-create", create };
  const created = await cf("POST", `/zones/${zoneId}/dns_records`, create);
  return { action: "created", id: created.id };
}

function normalizeIngress(ingress) {
  return Array.isArray(ingress) ? ingress.slice() : [];
}

async function ensureTunnelIngress() {
  const current = await cf(
    "GET",
    `/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`,
  );
  const config = current?.config || {};
  const ingress = normalizeIngress(config.ingress);

  const already = ingress.some(
    (rule) =>
      rule.hostname === HOSTNAME &&
      (rule.service === SERVICE || rule.service === "http://traefik:80"),
  );

  if (already) {
    console.log(`Tunnel ingress ok: ${HOSTNAME} → ${SERVICE}`);
    return { action: "unchanged", ingressCount: ingress.length };
  }

  const catchAllIdx = ingress.findIndex((r) => !r.hostname);
  const rule = { hostname: HOSTNAME, service: SERVICE };
  const next = ingress.slice();
  if (catchAllIdx === -1) {
    next.push(rule, { service: "http_status:404" });
  } else {
    next.splice(catchAllIdx, 0, rule);
  }

  console.log(`Tunnel ingress add: ${HOSTNAME} → ${SERVICE}`);
  if (DRY_RUN) return { action: "would-update", ingress: next };

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
      "CLOUDFLARE_API_TOKEN is required for programmatic setup.\n" +
        "Create a token with Zone.DNS:Edit (joed.dev) and Account Cloudflare Tunnel:Edit.\n" +
        "Store as GitHub secret CLOUDFLARE_API_TOKEN (never commit).\n\n" +
        "Dashboard fallback:\n" +
        "  Zero Trust → Tunnels → glados → Public Hostname\n" +
        "  Subdomain: analytics  Domain: joed.dev  Service: http://traefik:80",
    );
    process.exit(2);
  }

  console.log(
    JSON.stringify(
      {
        accountId: ACCOUNT_ID,
        tunnelId: TUNNEL_ID,
        zone: ZONE_NAME,
        hostname: HOSTNAME,
        service: SERVICE,
        dryRun: DRY_RUN,
      },
      null,
      2,
    ),
  );

  const zoneId = await ensureZoneId();
  const dns = await ensureDns(zoneId);
  const tunnel = await ensureTunnelIngress();
  console.log(JSON.stringify({ ok: true, dns, tunnel }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
