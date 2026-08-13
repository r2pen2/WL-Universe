const express = require("express");
const { cmsCollection } = require("../lib/cmsCollections");

function textCollectionName(site) {
  if (site.stack === "v2") {
    return cmsCollection(`siteText-${site.siteKey}`);
  }
  return cmsCollection("siteText");
}

function ensureTextListener(ctx) {
  if (ctx.textListening) return;
  const name = textCollectionName(ctx.site);
  ctx.db.collection(name).onSnapshot((snap) => {
    const next = {};
    for (const doc of snap.docs) {
      next[doc.id] = doc.data().text;
    }
    ctx.textData = next;
  });
  ctx.textListening = true;
}

function createTextRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    ensureTextListener(req.wlCtx);
    const text = req.wlCtx.textData[req.query.id];
    if (text != null && text !== undefined) {
      return res.send(text);
    }
    // Listener may not have fired yet — read once
    const name = textCollectionName(req.wlSite);
    req.wlCtx.db
      .doc(`${name}/${req.query.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.sendStatus(404);
        }
        return res.send(doc.data().text);
      })
      .catch(() => res.sendStatus(500));
  });

  router.post("/", (req, res) => {
    const firestoreId = req.body.id;
    const newText = req.body.newText;
    if (!firestoreId) {
      return res.status(400).json({ ok: false, error: "Missing id" });
    }
    const name = textCollectionName(req.wlSite);
    req.wlCtx.db
      .doc(`${name}/${firestoreId}`)
      .set({ text: newText })
      .then(() => res.sendStatus(200))
      .catch(() => res.sendStatus(500));
  });

  return router;
}

module.exports = { createTextRouter, textCollectionName };
