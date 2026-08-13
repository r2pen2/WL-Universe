const express = require("express");

const defaultMaxUpload = 5000;

function createRulesRouter() {
  const router = express.Router();

  router.get("/", (_req, res) => {
    res.send("<p>Specify a rule. (max-upload)</p>");
  });

  router.get("/max-upload", (_req, res) => {
    res.json({ maxUpload: defaultMaxUpload });
  });

  return router;
}

module.exports = { createRulesRouter };
