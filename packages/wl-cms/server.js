const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");

const { requireApiKey } = require("./lib/auth");
const { listConfiguredSites, listSites, assetsRoot } = require("./lib/sites");
const { resolveSiteMiddleware } = require("./lib/context");
const { createTextRouter } = require("./routes/text");
const { createImagesRouter } = require("./routes/images");
const { createModelsRouter } = require("./routes/models");
const { createRulesRouter } = require("./routes/rules");
const {
  attachPublicAssets,
  attachLegacyImageFs,
} = require("./routes/assets");
const { createLiveRouter } = require("./routes/live");
const logger = require("./lib/logger");

dotenv.config({ path: path.join(__dirname, ".env") });
// Also load monorepo local stack env when present
dotenv.config({ path: path.join(__dirname, "../../deploy/local/.env") });

const PORT = Number(process.env.PORT) || 3021;

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(fileUpload());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "wl-cms",
    sites: listSites().length,
    configured: listConfiguredSites().length,
  });
});

app.get("/liveness", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "wl-cms",
    sites: listConfiguredSites(),
    assets: assetsRoot(),
    ts: new Date().toISOString(),
  });
});

// Public image blobs (no Bearer — used by <img src>)
attachPublicAssets(app);

// CMS API (Bearer + site)
app.use(requireApiKey);
app.use(resolveSiteMiddleware);

app.use("/site-text", createTextRouter());
app.use("/site-images", createImagesRouter());
app.use("/site-models", createModelsRouter());
app.use("/site-rules", createRulesRouter());
attachLegacyImageFs(app);
app.use(createLiveRouter());

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled_error", { error: err.message });
  res.status(500).json({ ok: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info("wl_cms_listening", {
    port: PORT,
    configuredSites: listConfiguredSites(),
    assets: assetsRoot(),
  });
});

module.exports = app;
