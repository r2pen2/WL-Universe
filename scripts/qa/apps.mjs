/**
 * Canonical QA / publish app catalog.
 * app-slug === compose / matrix name (e.g. beyond-the-bell).
 */

export const QA_DOMAIN = "qa.joed.dev";

/** SPA apps that sync web-legos / server-legos into the image. */
export const SPA_APPS = [
  { app: "nicole-levin", port: 3005, kind: "spa", extraVolumes: [] },
  { app: "a-new-day-coaching", port: 3007, kind: "spa", extraVolumes: [] },
  {
    app: "a-new-day-coaching-crm",
    port: 3008,
    kind: "spa",
    extraVolumes: ["cal"],
  },
  { app: "beyond-the-bell", port: 3000, kind: "spa", extraVolumes: [] },
  { app: "wl-admin-portal", port: 25565, kind: "spa", extraVolumes: [] },
  { app: "you-can-do-it-gardening", port: 3003, kind: "spa", extraVolumes: [] },
  { app: "joe-dobbelaar", port: 3002, kind: "spa", extraVolumes: [] },
  { app: "talk-about-dreams", port: 3004, kind: "spa", extraVolumes: [] },
  { app: "boston-mixtape", port: 3010, kind: "spa", extraVolumes: [] },
];

export const EXPRESS_APPS = [
  {
    app: "site-mail",
    port: 3020,
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
  // One DNS label under qa.joed.dev so `*.qa.joed.dev` wildcard DNS/tunnel/SSL match.
  // (Cloudflare wildcards only cover a single label — pr-N.app.qa.joed.dev cannot resolve.)
  return `pr-${pr}-${app}.${QA_DOMAIN}`;
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
