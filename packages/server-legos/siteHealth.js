/**
 * Shared process liveness probe for WL-Universe Express apps.
 * Mount BEFORE SPA catch-all (`app.get("*", …)`).
 *
 *   const { mountLiveness } = require("./libraries/Server-Legos/siteHealth");
 *   mountLiveness(app, "beyond-the-bell");
 */
const express = require("express");

function payload(service) {
  return {
    ok: true,
    service: service || "unknown",
    ts: new Date().toISOString(),
  };
}

function mountLiveness(app, service) {
  if (!app || typeof app.get !== "function") {
    throw new Error("mountLiveness requires an Express app");
  }
  const name = service || process.env.SITE_HEALTH_SERVICE || "unknown";
  app.get("/liveness", (_req, res) => {
    res.status(200).json(payload(name));
  });
}

function createLivenessRouter(service) {
  const router = express.Router();
  const name = service || "unknown";
  router.get(["/", ""], (_req, res) => {
    res.status(200).json(payload(name));
  });
  return router;
}

module.exports = { mountLiveness, createLivenessRouter };
