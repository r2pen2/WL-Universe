/**
 * Canonical QA / publish app catalog.
 * app-slug === compose / matrix name (e.g. beyond-the-bell).
 */

/** Legacy docs label; hosts themselves live under QA_HOST_DOMAIN for Universal SSL. */
export const QA_DOMAIN = "qa.joed.dev";

/** First-level joed.dev label so Cloudflare Universal SSL (*.joed.dev) covers QA hosts. */
export const QA_HOST_DOMAIN = "joed.dev";

/** SPA apps that sync web-legos / server-legos into the image. */
export const SPA_APPS = [
  {
    app: "nicole-levin",
    port: 3005,
    kind: "spa",
    extraVolumes: [],
    cms: true,
    siteKey: "NL",
  },
  {
    app: "a-new-day-coaching",
    port: 3007,
    kind: "spa",
    extraVolumes: [],
    cms: true,
    siteKey: "ANDC",
  },
  {
    app: "a-new-day-coaching-crm",
    port: 3008,
    kind: "spa",
    extraVolumes: ["cal"],
  },
  {
    app: "beyond-the-bell",
    port: 3000,
    kind: "spa",
    extraVolumes: [],
    cms: true,
  },
  { app: "wl-admin-portal", port: 25565, kind: "spa", extraVolumes: [] },
  {
    app: "you-can-do-it-gardening",
    port: 3003,
    kind: "spa",
    extraVolumes: [],
    cms: true,
  },
  { app: "joe-dobbelaar", port: 3002, kind: "spa", extraVolumes: [] },
  {
    app: "talk-about-dreams",
    port: 3004,
    kind: "spa",
    extraVolumes: [],
    cms: true,
    siteKey: "TAG",
  },
  {
    app: "boston-mixtape",
    port: 3010,
    kind: "spa",
    extraVolumes: [],
    cms: true,
    siteKey: "BBM",
  },
];

/** Apps that seed/cleanup prefixed Firestore CMS collections for QA. */
export function cmsQaApps() {
  return new Set(SPA_APPS.filter((a) => a.cms).map((a) => a.app));
}

export function cmsCollectionPrefix(pr) {
  return `qa-pr-${pr}-`;
}

export const EXPRESS_APPS = [
  {
    app: "site-mail",
    port: 3020,
    kind: "express",
    dockerfile: "deploy/docker/node-express.Dockerfile",
  },
  {
    app: "site-billing",
    port: 3021,
    kind: "express",
    dockerfile: "deploy/docker/node-express.Dockerfile",
  },
];

export const DOCS_APPS = [
  {
    app: "docs",
    port: 8080,
    kind: "docs",
    dockerfile: "deploy/docker/docs-static.Dockerfile",
  },
];

/** QA preview apps (no docs host). */
export const ALL_APPS = [...SPA_APPS, ...EXPRESS_APPS];

/** Prod publish / deploy matrix. */
export const PUBLISH_APPS = [...SPA_APPS, ...EXPRESS_APPS, ...DOCS_APPS];

export const APP_BY_NAME = Object.fromEntries(
  PUBLISH_APPS.map((a) => [a.app, a]),
);

export function qaHostname(pr, app) {
  // pr-N-app.joed.dev — one label under the apex so:
  // 1) `*.joed.dev` Universal SSL covers HTTPS
  // 2) a single DNS/tunnel wildcard can route all PR hosts
  // (pr-N.app.qa.joed.dev cannot work: CF wildcards match only one label, and
  // Universal SSL does not cover *.qa.joed.dev.)
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
