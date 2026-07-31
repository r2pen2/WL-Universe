const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

const { requireApiKey } = require("./lib/auth");
const { listSites, policy, loadCatalog } = require("./lib/catalog");
const { statusSummary } = require("./lib/entitlement");
const { constructEvent, handleStripeEvent, applyStatusForSite } = require("./lib/webhooks");
const { createPortalSession, createSubscription } = require("./lib/portal");
const { reconcileFromStripe } = require("./lib/reconcile");
const { enforceAll } = require("./lib/enforcer");
const logger = require("./lib/logger");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.PORT) || 3021;
const RECONCILE_MS =
  Number(process.env.SITE_BILLING_RECONCILE_MS) || 60 * 60 * 1000;
const ENFORCE_MS =
  Number(process.env.SITE_BILLING_ENFORCE_MS) || 5 * 60 * 1000;

const app = express();
app.set("trust proxy", 1);
app.use(cors());

// Stripe webhooks need the raw body for signature verification.
app.post(
  "/v1/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.get("stripe-signature");
    if (!signature) {
      return res.status(400).json({ ok: false, error: "Missing stripe-signature" });
    }
    try {
      const event = constructEvent(req.body, signature);
      const result = await handleStripeEvent(event);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("webhook_failed", { error: error.message });
      return res.status(400).json({ ok: false, error: error.message });
    }
  },
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const opsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.SITE_BILLING_RATE_LIMIT) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests" },
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "site-billing",
    sites: listSites().length,
  });
});

app.get("/liveness", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "site-billing",
    sites: listSites().length,
    ts: new Date().toISOString(),
  });
});

app.get("/paused", (_req, res) => {
  const file = path.join(__dirname, "public", "paused.html");
  let html = fs.readFileSync(file, "utf8");
  html = html.replaceAll("CONTACT_EMAIL_PLACEHOLDER", policy().contactEmail);
  res.status(402).type("html").send(html);
});

app.get("/v1/status", opsLimiter, requireApiKey, (_req, res) => {
  res.status(200).json(statusSummary());
});

app.post("/v1/portal-session", opsLimiter, requireApiKey, async (req, res) => {
  const { site, returnUrl } = req.body || {};
  if (!site || typeof site !== "string") {
    return res.status(400).json({ ok: false, error: "Missing or invalid 'site'" });
  }
  try {
    const result = await createPortalSession(site, returnUrl);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post("/v1/subscribe", opsLimiter, requireApiKey, async (req, res) => {
  try {
    const result = await createSubscription(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post("/v1/reconcile", opsLimiter, requireApiKey, async (_req, res) => {
  try {
    const result = await reconcileFromStripe();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
});

app.post("/v1/enforce", opsLimiter, requireApiKey, (_req, res) => {
  const result = enforceAll();
  res.status(200).json({ ok: true, ...result });
});

/** Test/ops helper: set Stripe-like status without a live webhook. */
app.post("/v1/debug/set-status", opsLimiter, requireApiKey, (req, res) => {
  if (process.env.SITE_BILLING_ALLOW_DEBUG !== "true") {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  const { site, stripeStatus } = req.body || {};
  if (!site || !stripeStatus) {
    return res.status(400).json({
      ok: false,
      error: "site and stripeStatus are required",
    });
  }
  try {
    const result = applyStatusForSite(site, stripeStatus, "debug");
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled_error", { error: err.message });
  res.status(500).json({ ok: false, error: "Internal server error" });
});

function startBackgroundJobs() {
  // Initial enforce so Traefik file exists even with empty blocks.
  try {
    loadCatalog();
    enforceAll();
  } catch (error) {
    logger.error("startup_enforce_failed", { error: error.message });
  }

  setInterval(() => {
    try {
      enforceAll();
    } catch (error) {
      logger.error("enforce_tick_failed", { error: error.message });
    }
  }, ENFORCE_MS).unref?.();

  if (process.env.STRIPE_SECRET_KEY) {
    setInterval(() => {
      reconcileFromStripe().catch((error) => {
        logger.error("reconcile_tick_failed", { error: error.message });
      });
    }, RECONCILE_MS).unref?.();
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info("site_billing_listening", {
      port: PORT,
      sites: listSites().map((s) => s.id),
    });
    startBackgroundJobs();
  });
}

module.exports = app;
