const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { requireApiKey } = require("./lib/auth");
const { listConfiguredSites, listSites } = require("./lib/sites");
const { resolveSiteMiddleware } = require("./lib/context");
const { createFormsRouter } = require("./routes/forms");
const logger = require("./lib/logger");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../../deploy/local/.env") });

const PORT = Number(process.env.PORT) || 3023;

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "wl-forms",
    sites: listSites().length,
    configured: listConfiguredSites().length,
  });
});

app.get("/liveness", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "wl-forms",
    sites: listConfiguredSites(),
    ts: new Date().toISOString(),
  });
});

app.use(requireApiKey);
app.use(resolveSiteMiddleware);
app.use("/site-forms", createFormsRouter());

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled_error", { error: err.message });
  res.status(500).json({ ok: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info("wl_forms_listening", {
    port: PORT,
    configuredSites: listConfiguredSites(),
  });
});

module.exports = app;
