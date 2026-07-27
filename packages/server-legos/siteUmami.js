/**
 * Optional fire-and-forget Umami pageview for SPA document/shell hits.
 *
 * Opt-in via UMAMI_SERVER_TRACKING=1 plus:
 *   UMAMI_URL (default https://analytics.joed.dev)
 *   UMAMI_WEBSITE_ID (required when enabled)
 *
 * Default off. Does not block responses; no PII / secrets in payload.
 * Complement to client AnalyticsManager — not a substitute for SPA routes.
 *
 *   const { mountUmamiShellTracking } = require("./libraries/Server-Legos/siteUmami");
 *   mountUmamiShellTracking(app);
 *
 * Prefer wrapping the SPA catch-all instead:
 *   app.get("*", umamiShellHit, (req, res) => res.sendFile(...));
 */
const DEFAULT_UMAMI_URL = "https://analytics.joed.dev";

function isEnabled() {
  const flag = process.env.UMAMI_SERVER_TRACKING;
  return flag === "1" || flag === "true";
}

function collectorUrl() {
  return String(process.env.UMAMI_URL || DEFAULT_UMAMI_URL).replace(/\/$/, "");
}

function websiteId() {
  return String(process.env.UMAMI_WEBSITE_ID || "").trim();
}

/**
 * Fire-and-forget POST /api/send for a document hit.
 * @param {import("express").Request} req
 * @param {{ path?: string }} [opts]
 */
function sendShellHit(req, opts = {}) {
  if (!isEnabled()) return;
  const id = websiteId();
  if (!id) return;

  const hostname =
    (req.hostname && String(req.hostname)) ||
    (req.headers && String(req.headers.host || "").split(":")[0]) ||
    "unknown";

  // Default: no tracking on *.qa.joed.dev even if flag is set.
  if (/(^|\.)qa\.joed\.dev$/i.test(hostname)) return;

  const urlPath =
    opts.path ||
    (req.originalUrl && String(req.originalUrl).split("?")[0]) ||
    "/";

  // Omit `name` so Umami records a pageview (a name makes it a custom event).
  const body = JSON.stringify({
    type: "event",
    payload: {
      website: id,
      hostname,
      language: "en-US",
      referrer: "",
      screen: "0x0",
      title: "",
      url: urlPath === "" ? "/" : urlPath,
    },
  });

  const endpoint = `${collectorUrl()}/api/send`;
  const ua =
    (req.headers && req.headers["user-agent"]) ||
    "Mozilla/5.0 (compatible; WL-Universe-Server/1.0)";

  // Node 18+ global fetch — never await from request path callers.
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": String(ua),
      "x-umami-website-id": id,
      "x-umami-hostname": hostname,
    },
    body,
  }).catch(() => {
    /* swallow */
  });
}

/**
 * Express middleware: after response starts finishing for HTML shell GETs,
 * send a beacon. Safe to place before sendFile handlers.
 */
function umamiShellHit(req, res, next) {
  if (!isEnabled() || req.method !== "GET") {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      sendShellHit(req);
    }
  });
  next();
}

/**
 * Convenience: wrap an existing SPA catch-all handler.
 * @param {(req: any, res: any, next?: any) => void} handler
 */
function withUmamiShellHit(handler) {
  return function umamiWrappedShell(req, res, next) {
    umamiShellHit(req, res, () => handler(req, res, next));
  };
}

module.exports = {
  sendShellHit,
  umamiShellHit,
  withUmamiShellHit,
  isUmamiServerTrackingEnabled: isEnabled,
};
