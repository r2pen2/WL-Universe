const { getAuth } = require("firebase-admin/auth");
const { getAppForSite } = require("./firebase");
const logger = require("./logger");

// joed.dev SSO (Lumos, served by access.joed.dev) decides who administers which site: anyone Lumos gives
// the site's app (app id = site slug), and every Lumos admin, is an operator of that site. The email comes
// from Firebase Auth (verified), never from the users collection, which any API-key holder can write.

const CACHE_MS = 60 * 1000;
const cache = new Map(); // `${slug}\n${uid}` -> { at, value }

function accessUrl() {
  return (process.env.ACCESS_INTERNAL_URL || "http://access:3000").replace(/\/$/, "");
}

/** The verified email Firebase Auth has for this uid on this site's project, or "". */
async function verifiedEmail(slug, uid) {
  const user = await getAuth(getAppForSite(slug)).getUser(String(uid));
  return user.email && user.emailVerified ? user.email.toLowerCase() : "";
}

/** Whether Lumos gives this email the site's app (or makes them an admin). */
async function lumosGrants(email, slug, fetchImpl = fetch) {
  const url = `${accessUrl()}/internal/access?email=${encodeURIComponent(email)}&app=${encodeURIComponent(slug)}`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`access ${res.status}`);
  const json = await res.json();
  return Boolean(json.admin || json.access);
}

/**
 * Whether the user with this uid is an SSO admin of the site. Fails closed (false) if Firebase or
 * access.joed.dev can't answer; cached for a minute per site and user.
 */
async function isSsoSiteAdmin(slug, uid, deps = {}) {
  const key = `${slug}\n${uid}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  let value = false;
  try {
    const email = await (deps.verifiedEmail || verifiedEmail)(slug, uid);
    value = email ? await (deps.lumosGrants || lumosGrants)(email, slug) : false;
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      logger.warn("sso_admin_lookup_failed", { site: slug, error: error.message });
    }
    return false; // not cached, so the next request retries
  }
  cache.set(key, { at: Date.now(), value });
  return value;
}

/**
 * A user's effective permissions on a site: what the users collection says, with every one switched on
 * (and op set) for operators, including SSO admins.
 */
async function effectivePermissionsFor(slug, uid, data, deps = {}) {
  const permissions = { ...((data && data.permissions) || {}) };
  if (!permissions.op && (await isSsoSiteAdmin(slug, uid, deps))) {
    permissions.op = true;
  }
  if (permissions.op) {
    for (const k of Object.keys(permissions)) permissions[k] = true;
  }
  return permissions;
}

module.exports = { isSsoSiteAdmin, effectivePermissionsFor, lumosGrants, _cache: cache };
