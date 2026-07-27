const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

const { requireApiKey } = require("./lib/auth");
const { getSiteProfile, listConfiguredSites } = require("./lib/profiles");
const { sendMail } = require("./lib/send");
const logger = require("./lib/logger");

// Load optional local .env for development (production uses compose env_file)
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.PORT) || 3020;
const LOG_DIR =
  process.env.SITE_MAIL_LOG_DIR ||
  "/opt/services/data/app-assets/site-mail";

function appendSendLog(entry) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const line = `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`;
    fs.appendFileSync(path.join(LOG_DIR, "send.log"), line);
  } catch (error) {
    logger.warn("send_log_write_failed", { error: error.message });
  }
}

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.SITE_MAIL_RATE_LIMIT) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests" },
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "site-mail",
    sites: listConfiguredSites().length,
  });
});

app.post("/v1/send", sendLimiter, requireApiKey, async (req, res) => {
  const { site, to, subject, text, html } = req.body || {};

  if (!site || typeof site !== "string") {
    return res.status(400).json({ ok: false, error: "Missing or invalid 'site'" });
  }
  if (!to || typeof to !== "string") {
    return res.status(400).json({ ok: false, error: "Missing or invalid 'to'" });
  }
  if (!subject || typeof subject !== "string") {
    return res.status(400).json({ ok: false, error: "Missing or invalid 'subject'" });
  }
  if ((text == null || text === "") && (html == null || html === "")) {
    return res.status(400).json({
      ok: false,
      error: "Provide at least one of 'text' or 'html'",
    });
  }

  const profile = getSiteProfile(site);
  if (!profile) {
    logger.warn("unknown_site", { site });
    return res.status(400).json({
      ok: false,
      error: `Unknown or unconfigured site '${site}'`,
    });
  }

  try {
    const info = await sendMail(profile, { to, subject, text, html });
    appendSendLog({
      site: profile.site,
      to,
      subject,
      messageId: info.messageId,
      ok: true,
    });
    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
      site: profile.site,
    });
  } catch (error) {
    appendSendLog({
      site: profile.site,
      to,
      subject,
      ok: false,
      error: error.message,
    });
    return res.status(502).json({
      ok: false,
      error: "Failed to send email",
      detail: error.message,
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled_error", { error: err.message });
  res.status(500).json({ ok: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info("site_mail_listening", {
    port: PORT,
    sites: listConfiguredSites(),
  });
});

module.exports = app;
