/**
 * Canonical QA / publish app catalog.
 * Source of truth for CI: deploy/apps.json (shared with deploy-infra-actions).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(__dirname, "../../deploy/apps.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

/** Legacy docs label; hosts themselves live under QA_HOST_DOMAIN for Universal SSL. */
export const QA_DOMAIN = "qa.joed.dev";

/** First-level joed.dev label so Cloudflare Universal SSL (*.joed.dev) covers QA hosts. */
export const QA_HOST_DOMAIN = catalog.qaHostDomain || "joed.dev";

export const SPA_APPS = catalog.apps.filter((a) => a.kind === "spa");
export const EXPRESS_APPS = catalog.apps.filter((a) => a.kind === "express");
export const DOCS_APPS = catalog.apps.filter((a) => a.app === "docs");

/** Apps that seed/cleanup prefixed Firestore CMS collections for QA. */
export function cmsQaApps() {
  return new Set(SPA_APPS.filter((a) => a.cms).map((a) => a.app));
}

export function cmsCollectionPrefix(pr) {
  return `qa-pr-${pr}-`;
}

/** QA preview apps (no docs host). */
export const ALL_APPS = catalog.apps.filter(
  (a) => a.qa !== false && a.image !== false,
);

/** Prod publish / deploy matrix. */
export const PUBLISH_APPS = catalog.apps;

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
