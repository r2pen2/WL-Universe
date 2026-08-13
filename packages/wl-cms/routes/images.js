const express = require("express");
const fs = require("fs");
const path = require("path");
const { cmsCollection } = require("../lib/cmsCollections");

function imagesCollectionName(site) {
  if (site.stack === "v2") {
    return cmsCollection(`siteImages-${site.siteKey}`);
  }
  return cmsCollection("siteImages");
}

function ensureImagesListener(ctx) {
  if (ctx.imagesListening) return;
  const name = imagesCollectionName(ctx.site);
  ctx.db.collection(name).onSnapshot((snap) => {
    const next = {};
    for (const doc of snap.docs) {
      next[doc.id] = doc.data();
    }
    ctx.imagesData = next;
  });
  ctx.imagesListening = true;
}

function createImagesRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    ensureImagesListener(req.wlCtx);
    const image = req.wlCtx.imagesData[req.query.id];
    if (image) {
      return res.json(image);
    }
    const name = imagesCollectionName(req.wlSite);
    req.wlCtx.db
      .doc(`${name}/${req.query.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.sendStatus(404);
        }
        return res.json(doc.data());
      })
      .catch(() => res.sendStatus(500));
  });

  router.post("/", (req, res) => {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ ok: false, error: "Missing file" });
    }
    const fileName = req.body.fileName;
    const firestoreId = req.body.firestoreId;
    const oldFileName = req.body.oldFileName;
    if (!fileName || !firestoreId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing fileName or firestoreId" });
    }

    const newSource = `images/${fileName}`;
    const targetPath = path.join(req.wlCtx.imagesDir, fileName);
    fs.writeFile(targetPath, req.files.file.data, (err) => {
      if (err) {
        return res.sendStatus(500);
      }
      const name = imagesCollectionName(req.wlSite);
      req.wlCtx.db
        .doc(`${name}/${firestoreId}`)
        .set({ source: newSource, fileName })
        .then(() => {
          res.sendStatus(200);
          if (oldFileName) {
            const deletePath = path.join(req.wlCtx.imagesDir, oldFileName);
            fs.rm(deletePath, () => {});
          }
        })
        .catch(() => res.sendStatus(500));
    });
  });

  return router;
}

module.exports = { createImagesRouter, imagesCollectionName };
