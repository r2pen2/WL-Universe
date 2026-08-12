const express = require("express");

function ensureLiveListener(ctx, collectionName) {
  if (ctx.liveListeners.has(collectionName)) return;
  ctx.liveListeners.add(collectionName);
  ctx.liveData[collectionName] = [];
  ctx.db.collection(collectionName).onSnapshot((snap) => {
    const next = [];
    for (const doc of snap.docs) {
      const dataWithId = doc.data();
      dataWithId.id = doc.id;
      next.push(dataWithId);
    }
    ctx.liveData[collectionName] = next;
  });
}

/**
 * BTB-style live collection GETs: /testimonials, /offerings, /staff
 * Only served when the resolved site declares liveCollections.
 */
function createLiveRouter() {
  const router = express.Router();

  function handleLive(collectionName) {
    return (req, res) => {
      const allowed = req.wlSite.liveCollections || [];
      if (!allowed.includes(collectionName)) {
        return res.status(404).json({
          ok: false,
          error: `Site '${req.wlSite.slug}' does not expose /${collectionName}`,
        });
      }
      ensureLiveListener(req.wlCtx, collectionName);
      const cached = req.wlCtx.liveData[collectionName];
      if (cached && cached.length) {
        return res.json(cached);
      }
      req.wlCtx.db
        .collection(collectionName)
        .get()
        .then((snap) => {
          const list = [];
          snap.forEach((doc) => {
            const dataWithId = doc.data();
            dataWithId.id = doc.id;
            list.push(dataWithId);
          });
          res.json(list);
        })
        .catch(() => res.sendStatus(500));
    };
  }

  router.get("/testimonials", handleLive("testimonials"));
  router.get("/offerings", handleLive("offerings"));
  router.get("/staff", handleLive("staff"));

  return router;
}

module.exports = { createLiveRouter };
