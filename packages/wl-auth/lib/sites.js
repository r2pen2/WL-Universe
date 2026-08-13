const path = require("path");
const fs = require("fs");

const REPO_ROOT = path.resolve(__dirname, "../../..");

/**
 * Auth site registry.
 * authStack v2 → users-{siteKey}; v1 → users
 * userKeyEnv: legacy env name still accepted; also WL_AUTH_USERKEY_<SLUG>
 */
const SITE_REGISTRY = {
  "nicole-levin": {
    slug: "nicole-levin",
    siteKey: "NL",
    authStack: "v2",
    userKeyEnv: "NLUSERKEY",
  },
  "talk-about-dreams": {
    slug: "talk-about-dreams",
    siteKey: "TAG",
    authStack: "v2",
    userKeyEnv: "TAGUSERKEY",
  },
  "boston-mixtape": {
    slug: "boston-mixtape",
    siteKey: "BBM",
    authStack: "v2",
    userKeyEnv: "BBMUSERKEY",
  },
  "a-new-day-coaching": {
    slug: "a-new-day-coaching",
    siteKey: "ANDC",
    authStack: "v2",
    userKeyEnv: "ANDCUSERKEY",
  },
  "beyond-the-bell": {
    slug: "beyond-the-bell",
    siteKey: null,
    authStack: "v1",
    userKeyEnv: "BTBUSERKEY",
  },
  "you-can-do-it-gardening": {
    slug: "you-can-do-it-gardening",
    siteKey: null,
    authStack: "v1",
    userKeyEnv: "YCDUSERKEY",
  },
};

function envSaKey(slug) {
  return `WL_AUTH_SA_${slug.replace(/-/g, "_").toUpperCase()}`;
}

function envUserKey(slug) {
  return `WL_AUTH_USERKEY_${slug.replace(/-/g, "_").toUpperCase()}`;
}

function resolveServiceAccountPath(slug) {
  const fromEnv = process.env[envSaKey(slug)];
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  // Fall back to CMS SA path / package config (same Firebase project per site)
  const cmsEnv = process.env[`WL_CMS_SA_${slug.replace(/-/g, "_").toUpperCase()}`];
  if (cmsEnv && fs.existsSync(cmsEnv)) return cmsEnv;
  const defaultPath = path.join(
    REPO_ROOT,
    "packages",
    slug,
    "config",
    "serviceAccountKey.json",
  );
  if (fs.existsSync(defaultPath)) return defaultPath;
  const hostPath = path.join(
    "/opt/services/data/app-env",
    `${slug}-serviceAccountKey.json`,
  );
  if (fs.existsSync(hostPath)) return hostPath;
  return null;
}

function resolveUserKey(site) {
  return (
    process.env[envUserKey(site.slug)] ||
    process.env[site.userKeyEnv] ||
    ""
  );
}

function usersCollection(site) {
  if (site.authStack === "v2") {
    return `users-${site.siteKey}`;
  }
  return "users";
}

function getSite(slug) {
  if (!slug || typeof slug !== "string") return null;
  const normalized = slug.trim().toLowerCase();
  const base = SITE_REGISTRY[normalized];
  if (!base) return null;
  return {
    ...base,
    serviceAccountPath: resolveServiceAccountPath(normalized),
    userKey: resolveUserKey({ ...base, slug: normalized }),
    usersCollection: usersCollection(base),
  };
}

function listSites() {
  return Object.keys(SITE_REGISTRY);
}

function listConfiguredSites() {
  return listSites().filter((slug) => resolveServiceAccountPath(slug));
}

module.exports = {
  SITE_REGISTRY,
  REPO_ROOT,
  getSite,
  listSites,
  listConfiguredSites,
  resolveServiceAccountPath,
  usersCollection,
};
