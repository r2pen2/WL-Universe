const express = require("express");
const { cmsCollection } = require("../lib/cmsCollections");

function modelCollectionName(site, logicalName) {
  if (site.modelsStack === "v2") {
    return cmsCollection(`${logicalName}-${site.siteKey}`);
  }
  return cmsCollection(logicalName);
}

function createModelsRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const collection = req.query.collection;
    if (!collection) {
      return res.status(400).json({ ok: false, error: "Missing collection" });
    }
    if (collection === "users") {
      return res.sendStatus(403);
    }

    const ctx = req.wlCtx;
    if (ctx.modelData[collection]) {
      return res.json(ctx.modelData[collection]);
    }

    const remote = modelCollectionName(req.wlSite, collection);
    try {
      const snapshot = await ctx.db.collection(remote).get();
      const sendList = [];
      snapshot.forEach((doc) => {
        const dataWithId = doc.data();
        dataWithId.id = doc.id;
        sendList.push(dataWithId);
      });
      res.json(sendList);

      if (!ctx.modelListeners.has(collection)) {
        ctx.modelListeners.add(collection);
        ctx.db.collection(remote).onSnapshot((snap) => {
          const next = [];
          for (const doc of snap.docs) {
            const dataWithId = doc.data();
            dataWithId.id = doc.id;
            next.push(dataWithId);
          }
          ctx.modelData[collection] = next;
        });
      }
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.post("/", (req, res) => {
    const collection = req.body.collection;
    if (!collection) {
      return res.status(400).json({ ok: false, error: "Missing collection" });
    }
    if (collection === "users") {
      return res.sendStatus(403);
    }

    const remote = modelCollectionName(req.wlSite, collection);
    const db = req.wlCtx.db;

    if (req.body.action === "delete") {
      return db
        .doc(`${remote}/${req.body.documentId}`)
        .delete()
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
    }
    if (req.body.action === "create") {
      return db
        .collection(remote)
        .add(req.body.documentData)
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
    }

    return db
      .doc(`${remote}/${req.body.documentId}`)
      .set(req.body.documentData)
      .then(() => res.sendStatus(200))
      .catch(() => res.sendStatus(500));
  });

  return router;
}

module.exports = { createModelsRouter, modelCollectionName };
