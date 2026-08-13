const express = require("express");

const FORMS_COLLECTION = "siteForms";

function ensureListener(ctx) {
  if (ctx.listening) return;
  ctx.db.collection(FORMS_COLLECTION).onSnapshot((snap) => {
    const next = {};
    for (const doc of snap.docs) {
      next[doc.id] = doc.data();
    }
    ctx.formsData = next;
  });
  ctx.listening = true;
}

function createFormsRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    ensureListener(req.wlCtx);
    const key = req.query.key;
    if (!req.wlSite.formKey || key !== req.wlSite.formKey) {
      return res.sendStatus(400);
    }
    return res.json(req.wlCtx.formsData);
  });

  router.post("/", (req, res) => {
    ensureListener(req.wlCtx);
    if (req.body.action === "delete") {
      return req.wlCtx.db
        .doc(`${FORMS_COLLECTION}/${req.body.documentId}`)
        .delete()
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
    }
    return req.wlCtx.db
      .collection(FORMS_COLLECTION)
      .add(req.body.documentData)
      .then(() => res.sendStatus(200))
      .catch(() => res.sendStatus(500));
  });

  return router;
}

module.exports = { createFormsRouter };
