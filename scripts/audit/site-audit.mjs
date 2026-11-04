#!/usr/bin/env node
/**
 * Read-only audit of the live sites, deeper than /liveness (which nginx answers
 * with a hardcoded "ok" for the static sites, and which wl-auth kept answering
 * while it had no credentials for any site).
 *
 *   node scripts/audit/site-audit.mjs
 *
 * For each marketing site: homepage + main bundle, /wl-config.js, and whether
 * wl-cms / wl-auth / wl-forms / site-mail actually serve that site. Plus the
 * platform services, www variants and TLS expiry. Never prints API keys.
 */
import tls from "node:tls";
import vm from "node:vm";

const TIMEOUT_MS = 15000;
const PROBE_ID = "__site_audit_probe__";

const SITES = [
  { slug: "nicole-levin", domain: "nicolelevin.org" },
  { slug: "beyond-the-bell", domain: "beyondthebelleducation.com" },
  { slug: "you-can-do-it-gardening", domain: "youcandoitgardening.com" },
  { slug: "talk-about-dreams", domain: "talkaboutdreams.com" },
  { slug: "boston-mixtape", domain: "bostonmixtape.com", aliases: ["bostonsoundtrack.com", "berachmusic.com", "bostonsbestmusic.com", "berachorchestra.com"] },
  { slug: "a-new-day-coaching", domain: "anewdaycoaching.com" },
];

const PLATFORM = [
  ["a-new-day-coaching-crm", "https://bluprint.anewdaycoaching.com/"],
  ["a-new-day-coaching-crm /liveness", "https://bluprint.anewdaycoaching.com/liveness"],
  ["joe-dobbelaar", "https://joed.dev/"],
  ["wl-admin-portal (joed)", "https://admin.joed.dev/"],
  ["wl-admin-portal (ycd)", "https://admin.youcandoitgardening.com/"],
  ["wl-admin-portal (btb)", "https://admin.beyondthebelleducation.com/"],
  ["wl-cms /liveness", "https://wl-cms.joed.dev/liveness"],
  ["wl-auth /liveness", "https://wl-auth.joed.dev/liveness"],
  ["wl-forms /liveness", "https://wl-forms.joed.dev/liveness"],
  ["site-mail /liveness", "https://site-mail.joed.dev/liveness"],
  ["site-billing /liveness", "https://billing.joed.dev/liveness"],
  ["docs", "https://wl-universe.joed.dev/"],
  ["umami heartbeat", "https://analytics.joed.dev/api/heartbeat"],
];

const problems = [];
function problem(where, what) {
  problems.push(`${where}: ${what}`);
  console.log(`  !! ${what}`);
}

async function get(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", signal: controller.signal, ...init, headers: { "User-Agent": "wl-site-audit/1.0", ...(init.headers || {}) } });
    const text = await res.text();
    return { status: res.status, location: res.headers.get("location"), type: res.headers.get("content-type") || "", text, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, error: error.cause?.code || error.name || String(error), text: "", ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

/** Follow redirects ourselves so we can report them. */
async function getFollow(url, hops = 5) {
  const chain = [];
  let current = url;
  for (let i = 0; i <= hops; i++) {
    const r = await get(current);
    chain.push(`${r.status || r.error} ${current}`);
    if (r.status >= 300 && r.status < 400 && r.location) {
      current = new URL(r.location, current).toString();
      continue;
    }
    return { ...r, finalUrl: current, chain };
  }
  return { status: 0, error: "too many redirects", chain, text: "" };
}

function certExpiry(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: TIMEOUT_MS }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve({ validTo: cert.valid_to, authorized: socket.authorized, authError: socket.authorizationError });
    });
    socket.on("error", (e) => resolve({ error: e.code || e.message }));
    socket.on("timeout", () => { socket.destroy(); resolve({ error: "timeout" }); });
  });
}

function parseWlConfig(js) {
  const window = {};
  vm.runInNewContext(js, { window }, { timeout: 1000 });
  return window;
}

const short = (s, n = 140) => (s || "").replace(/\s+/g, " ").slice(0, n);

async function checkTls(host, label) {
  const c = await certExpiry(host);
  if (c.error) return problem(label, `TLS to ${host} failed: ${c.error}`);
  const days = Math.round((new Date(c.validTo) - Date.now()) / 86400000);
  console.log(`  tls ${host}: expires ${c.validTo} (${days}d)${c.authorized ? "" : ` NOT TRUSTED: ${c.authError}`}`);
  if (!c.authorized) problem(label, `TLS cert for ${host} not trusted (${c.authError})`);
  else if (days < 14) problem(label, `TLS cert for ${host} expires in ${days} days`);
}

async function auditSite(site) {
  const label = site.slug;
  console.log(`\n== ${label} (${site.domain})`);
  const home = await getFollow(`https://${site.domain}/`);
  console.log(`  home: ${home.chain.join(" -> ")} (${home.ms}ms, ${home.text.length} bytes)`);
  if (home.status !== 200) return problem(label, `homepage returned ${home.status || home.error}`);
  const title = /<title>([^<]*)<\/title>/i.exec(home.text)?.[1];
  console.log(`  title: ${short(title)}`);

  const bundle = /<script[^>]+src="([^"]*\/static\/js\/main[^"]*\.js)"/i.exec(home.text)?.[1];
  if (!bundle) problem(label, "no main JS bundle referenced in index.html");
  else {
    const b = await get(new URL(bundle, home.finalUrl).toString());
    console.log(`  bundle ${bundle}: ${b.status || b.error} (${b.text.length} bytes)`);
    if (b.status !== 200) problem(label, `main bundle returned ${b.status || b.error}`);
  }

  for (const host of [`www.${site.domain}`, ...(site.aliases || [])]) {
    const r = await getFollow(`https://${host}/`);
    console.log(`  ${host}: ${r.chain.join(" -> ")}`);
    if (r.status !== 200) problem(label, `${host} returned ${r.status || r.error}`);
  }
  const http = await get(`http://${site.domain}/`);
  console.log(`  http://${site.domain}: ${http.status || http.error}${http.location ? ` -> ${http.location}` : ""}`);
  await checkTls(site.domain, label);

  const cfgRes = await get(new URL("/wl-config.js", home.finalUrl).toString());
  if (cfgRes.status !== 200 || !/__WL_/.test(cfgRes.text)) {
    return problem(label, `/wl-config.js missing or not a config (${cfgRes.status}, ${short(cfgRes.type)})`);
  }
  let cfg;
  try { cfg = parseWlConfig(cfgRes.text); } catch (e) { return problem(label, `wl-config.js does not parse: ${e.message}`); }

  for (const [name, key] of [["cms", "__WL_CMS__"], ["auth", "__WL_AUTH__"], ["forms", "__WL_FORMS__"], ["mail", "__WL_SITE_MAIL__"]]) {
    const c = cfg[key] || {};
    console.log(`  config ${name}: url=${c.url || "(empty)"} site=${c.site || "(empty)"} apiKey=${c.apiKey ? `set (${c.apiKey.length} chars)` : "(empty)"}`);
  }

  const call = (svc, path) => {
    const c = cfg[svc] || {};
    const base = (c.url || "").replace(/\/$/, "");
    const siteSlug = c.site || site.slug;
    if (!base) return Promise.resolve({ status: 0, error: "no url in wl-config", text: "" });
    const url = new URL(base + path);
    url.searchParams.set("site", siteSlug);
    return get(url.toString(), { headers: { Authorization: `Bearer ${c.apiKey || ""}`, "X-WL-Site": siteSlug } });
  };

  // wl-cms: unknown text id -> 404 means it read Firestore for this site; 503 = no credentials.
  const text = await call("__WL_CMS__", `/site-text?id=${PROBE_ID}`);
  console.log(`  wl-cms  site-text probe: ${text.status || text.error} ${short(text.text, 120)}`);
  if (text.status !== 404) problem(label, `wl-cms can't serve this site (site-text probe ${text.status || text.error}: ${short(text.text, 120)})`);

  // wl-auth: unknown user -> 404 means it can read this site's users.
  const auth = await call("__WL_AUTH__", `/site-auth?id=${PROBE_ID}`);
  console.log(`  wl-auth site-auth probe: ${auth.status || auth.error} ${short(auth.text, 120)}`);
  if (auth.status !== 404) problem(label, `wl-auth can't serve this site (site-auth probe ${auth.status || auth.error}: ${short(auth.text, 120)}) -> no one can edit`);

  if ((cfg.__WL_FORMS__ || {}).url) {
    const forms = await call("__WL_FORMS__", `/site-forms?key=${PROBE_ID}`);
    // Wrong key -> 400 means it resolved the site; 503 = no credentials.
    console.log(`  wl-forms probe (wrong key): ${forms.status || forms.error} ${short(forms.text, 120)}`);
    if (forms.status !== 400) problem(label, `wl-forms can't serve this site (${forms.status || forms.error}: ${short(forms.text, 120)})`);
  }

  const mail = cfg.__WL_SITE_MAIL__ || {};
  if (mail.url) {
    const m = await get(`${mail.url.replace(/\/$/, "")}/liveness`);
    console.log(`  site-mail liveness: ${m.status || m.error} ${short(m.text, 120)}`);
    if (m.status !== 200) problem(label, `site-mail at ${mail.url} returned ${m.status || m.error}`);
  }
}

async function main() {
  console.log(`site audit ${new Date().toISOString()}`);
  for (const site of SITES) await auditSite(site);

  console.log(`\n== platform`);
  for (const [label, url] of PLATFORM) {
    const r = await getFollow(url);
    console.log(`  ${label}: ${r.chain.join(" -> ")} (${r.ms}ms) ${/json/.test(r.type) ? short(r.text, 300) : ""}`);
    if (r.status !== 200) problem(label, `returned ${r.status || r.error}`);
    if (/json/.test(r.type)) {
      try {
        const body = JSON.parse(r.text);
        if (body.ok === false) problem(label, `reports ok:false ${short(r.text, 200)}`);
        if (Array.isArray(body.sites) && body.sites.length === 0) problem(label, "reports no configured sites");
      } catch { /* not JSON after all */ }
    }
  }
  for (const host of ["joed.dev", "bluprint.anewdaycoaching.com", "admin.joed.dev", "wl-auth.joed.dev"]) await checkTls(host, host);

  console.log(`\n== ${problems.length} problem(s)`);
  for (const p of problems) console.log(`- ${p}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
