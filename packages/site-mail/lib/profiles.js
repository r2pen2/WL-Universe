/**
 * Site profile loader.
 *
 * Env keys (per site slug):
 *   SITE_<SLUG>_USER
 *   SITE_<SLUG>_PASS
 *   SITE_<SLUG>_FROM
 *   SITE_<SLUG>_SERVICE   (optional: gmail | godaddy | custom)
 *   SITE_<SLUG>_HOST      (optional SMTP host)
 *   SITE_<SLUG>_PORT      (optional SMTP port)
 *
 * Slug aliases map request `site` values to env prefixes.
 */

const SLUG_ALIASES = {
  "beyond-the-bell": "BEYOND_THE_BELL",
  btb: "BEYOND_THE_BELL",
  "a-new-day-coaching": "ANDC",
  andc: "ANDC",
  "boston-mixtape": "BBM",
  bbm: "BBM",
  "a-new-day-coaching-crm": "CRM",
  crm: "CRM",
  "talk-about-dreams": "TALK_ABOUT_DREAMS",
  tad: "TALK_ABOUT_DREAMS",
};

function slugToEnvPrefix(site) {
  if (!site || typeof site !== "string") {
    return null;
  }
  const normalized = site.trim().toLowerCase();
  if (SLUG_ALIASES[normalized]) {
    return SLUG_ALIASES[normalized];
  }
  return normalized
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function envKey(prefix, suffix) {
  return `SITE_${prefix}_${suffix}`;
}

/**
 * @param {string} site
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ site: string, prefix: string, user: string, pass: string, from: string, service?: string, host?: string, port?: number } | null}
 */
function getSiteProfile(site, env = process.env) {
  const prefix = slugToEnvPrefix(site);
  if (!prefix) {
    return null;
  }

  const user = env[envKey(prefix, "USER")];
  const pass = env[envKey(prefix, "PASS")];
  if (!user || !pass) {
    return null;
  }

  const from = env[envKey(prefix, "FROM")] || `${user}`;
  const service = env[envKey(prefix, "SERVICE")] || undefined;
  const host = env[envKey(prefix, "HOST")] || undefined;
  const portRaw = env[envKey(prefix, "PORT")];
  const port = portRaw ? Number(portRaw) : undefined;

  return {
    site: String(site).trim().toLowerCase(),
    prefix,
    user,
    pass,
    from,
    service,
    host,
    port: Number.isFinite(port) ? port : undefined,
  };
}

function listConfiguredSites(env = process.env) {
  const prefixes = new Set();
  for (const key of Object.keys(env)) {
    const match = /^SITE_([A-Z0-9_]+)_USER$/.exec(key);
    if (match) {
      prefixes.add(match[1]);
    }
  }
  return [...prefixes].sort();
}

module.exports = {
  SLUG_ALIASES,
  slugToEnvPrefix,
  getSiteProfile,
  listConfiguredSites,
};
