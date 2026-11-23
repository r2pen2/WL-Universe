import fs from "node:fs";

/**
 * Canonical QA / publish app catalog.
 * app-slug === compose / matrix name (e.g. beyond-the-bell).
 */

/** Legacy docs label; hosts themselves live under QA_HOST_DOMAIN for Universal SSL. */
export const QA_DOMAIN = "qa.joed.dev";

/** First-level joed.dev label so Cloudflare Universal SSL (*.joed.dev) covers QA hosts. */
export const QA_HOST_DOMAIN = "joed.dev";


/**
 * The catalog itself is deploy/apps.json, which the r2pen2/devops QA preview workflows read too.
 * Fields beyond devops's (siteKey, provision) are WL-only and ignored there.
 */
const CATALOG = JSON.parse(fs.readFileSync(new URL("../../deploy/apps.json", import.meta.url), "utf8"));
const byKind = (...kinds) => CATALOG.apps.filter((a) => kinds.includes(a.kind));

/** SPA apps that sync web-legos into the image. */
export const SPA_APPS = byKind("spa", "spa-static");

/** Apps that seed/cleanup prefixed Firestore CMS collections for QA. */
export function cmsQaApps() {
  return new Set(SPA_APPS.filter((a) => a.cms).map((a) => a.app));
}

export function cmsCollectionPrefix(pr) {
  return `qa-pr-${pr}-`;
}

export const EXPRESS_APPS = byKind("express");

export const DOCS_APPS = byKind("docs");

/**
 * Static sites with no WL services: the component catalog (tools/storybook, WL-7). It renders
 * web-legos and every site's client source, so detect-changed-apps rebuilds it when any of those change.
 */
export const STATIC_APPS = byKind("static");

/** QA preview apps (no docs host). */
export const ALL_APPS = [...SPA_APPS, ...EXPRESS_APPS, ...STATIC_APPS];

/** Prod publish / deploy matrix. */
export const PUBLISH_APPS = [...SPA_APPS, ...EXPRESS_APPS, ...DOCS_APPS, ...STATIC_APPS];

export const APP_BY_NAME = Object.fromEntries(
  PUBLISH_APPS.map((a) => [a.app, a]),
);

export function qaHostname(pr, app) {
  return `pr-${pr}-${app}.${QA_HOST_DOMAIN}`;
}

export function qaUrl(pr, app) {
  return `https://${qaHostname(pr, app)}`;
}

export function qaProjectName(pr, app) {
  return `qa-pr-${pr}-${app}`;
}

export function qaContainerName(pr, app) {
  return `qa-pr-${pr}-${app}`;
}

export function qaRouterName(pr, app) {
  return `qa-pr-${pr}-${app}`;
}

export function imageName(owner, app) {
  return `ghcr.io/${owner.toLowerCase()}/wl-universe-${app}`;
}

export function dockerfileFor(appEntry) {
  return appEntry.dockerfile || "deploy/docker/node-react-express.Dockerfile";
}
