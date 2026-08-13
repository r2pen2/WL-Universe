const path = require("path");
const fs = require("fs");

const REPO_ROOT = path.resolve(__dirname, "../../..");

/** Sites that mount /site-forms today */
const SITE_REGISTRY = {
  "beyond-the-bell": {
    slug: "beyond-the-bell",
    formKeyEnv: "BTBFORMKEY",
  },
  "boston-mixtape": {
    slug: "boston-mixtape",
    formKeyEnv: "BBMFORMKEY",
  },
  "a-new-day-coaching": {
    slug: "a-new-day-coaching",
    formKeyEnv: "ANDCFORMKEY",
  },
};

function envSaKey(slug) {
  return `WL_FORMS_SA_${slug.replace(/-/g, "_").toUpperCase()}`;
}

function envFormKey(slug) {
  return `WL_FORMS_FORMKEY_${slug.replace(/-/g, "_").toUpperCase()}`;
}

function resolveServiceAccountPath(slug) {
  const fromEnv = process.env[envSaKey(slug)];
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
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

function resolveFormKey(site) {
  return (
    process.env[envFormKey(site.slug)] ||
    process.env[site.formKeyEnv] ||
    ""
  );
}

function getSite(slug) {
  if (!slug || typeof slug !== "string") return null;
  const normalized = slug.trim().toLowerCase();
  const base = SITE_REGISTRY[normalized];
  if (!base) return null;
  return {
    ...base,
    serviceAccountPath: resolveServiceAccountPath(normalized),
    formKey: resolveFormKey({ ...base, slug: normalized }),
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
};
