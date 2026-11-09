const fs = require("fs");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getSite } = require("./sites");
const logger = require("./logger");

const dbBySlug = new Map();

const appBySlug = new Map();

/** The firebase-admin app for a site's Firebase project (Firestore users + Auth ID tokens). */
function getAppForSite(slug) {
  if (appBySlug.has(slug)) return appBySlug.get(slug);
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site '${slug}'`);
  if (!site.serviceAccountPath) {
    throw new Error(`No Firebase service account for site '${slug}'`);
  }
  const serviceAccount = JSON.parse(
    fs.readFileSync(site.serviceAccountPath, "utf8"),
  );
  const appName = `wl-auth-${slug}`;
  const existing = getApps().find((a) => a.name === appName);
  const app =
    existing ||
    initializeApp({ credential: cert(serviceAccount) }, appName);
  appBySlug.set(slug, app);
  return app;
}

function getDbForSite(slug) {
  if (dbBySlug.has(slug)) return dbBySlug.get(slug);
  const db = getFirestore(getAppForSite(slug));
  dbBySlug.set(slug, db);
  logger.info("firebase_app_ready", { site: slug, app: `wl-auth-${slug}` });
  return db;
}

module.exports = { getDbForSite, getAppForSite };
