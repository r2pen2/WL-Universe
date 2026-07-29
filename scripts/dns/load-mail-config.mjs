/**
 * Load mail DNS config: shared profiles + per-app site files + extras.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DNS_DIR = path.join(ROOT, "deploy/dns");
const SITES_DIR = path.join(DNS_DIR, "sites");

export function loadProfiles() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(DNS_DIR, "profiles.json"), "utf8"),
  );
  return raw.profiles || {};
}

/**
 * @returns {Array<{ app?: string, zone: string, profile: string, notes?: string, email?: object }>}
 */
export function loadSiteZones() {
  if (!fs.existsSync(SITES_DIR)) return [];
  const out = [];
  for (const name of fs.readdirSync(SITES_DIR).sort()) {
    if (!name.endsWith(".json")) continue;
    const site = JSON.parse(fs.readFileSync(path.join(SITES_DIR, name), "utf8"));
    const email = site.email;
    if (!email?.enabled) continue;
    if (!site.zone || !email.profile) {
      throw new Error(`Invalid email site config: ${name}`);
    }
    out.push({
      app: site.app || name.replace(/\.json$/, ""),
      zone: site.zone,
      profile: email.profile,
      notes: email.notes || site.notes,
      email,
    });
  }
  return out;
}

export function loadExtraZones() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(DNS_DIR, "mail-zones.json"), "utf8"),
  );
  return (raw.extras || raw.zones || []).map((z) => ({
    app: z.app,
    zone: z.zone,
    profile: z.profile,
    notes: z.notes,
  }));
}

/**
 * @param {{ apps?: string[] }} [opts] If apps is set, only include site zones for those apps (extras omitted unless apps empty/unset for full run).
 */
export function loadMailZones(opts = {}) {
  const profiles = loadProfiles();
  const sites = loadSiteZones();
  const extras = loadExtraZones();

  let zones;
  if (opts.apps?.length) {
    const wanted = new Set(opts.apps);
    zones = sites.filter((z) => z.app && wanted.has(z.app));
  } else {
    // Full ensure: site configs win over extras for the same zone.
    const byZone = new Map();
    for (const z of extras) byZone.set(z.zone, z);
    for (const z of sites) byZone.set(z.zone, z);
    zones = [...byZone.values()];
  }

  for (const z of zones) {
    if (!profiles[z.profile]) {
      throw new Error(`Unknown mail profile '${z.profile}' for zone ${z.zone}`);
    }
  }

  return { profiles, zones, sites, extras };
}

export function listEmailEnabledApps() {
  return loadSiteZones().map((z) => z.app).filter(Boolean);
}
