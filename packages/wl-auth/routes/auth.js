const express = require("express");

function ensureListener(ctx) {
  if (ctx.listening) return;
  const name = ctx.site.usersCollection;
  ctx.db.collection(name).onSnapshot((snap) => {
    const next = {};
    for (const doc of snap.docs) {
      next[doc.id] = doc.data();
    }
    ctx.permissionsData = next;
  });
  ctx.listening = true;
}

function createAuthRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    ensureListener(req.wlCtx);
    const key = req.query.key;
    if (key) {
      if (!req.wlSite.userKey || key !== req.wlSite.userKey) {
        return res.sendStatus(400);
      }
      return res.json(req.wlCtx.permissionsData);
    }

    const user = req.wlCtx.permissionsData[req.query.id];
    if (user) {
      const permissions = { ...(user.permissions || {}) };
      if (permissions.op) {
        for (const k of Object.keys(permissions)) {
          permissions[k] = true;
        }
      }
      return res.json(permissions);
    }

    // Cold cache: one-shot read
    const name = req.wlSite.usersCollection;
    req.wlCtx.db
      .doc(`${name}/${req.query.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) return res.sendStatus(404);
        const data = doc.data();
        const permissions = { ...(data.permissions || {}) };
        if (permissions.op) {
          for (const k of Object.keys(permissions)) {
            permissions[k] = true;
          }
        }
        return res.json(permissions);
      })
      .catch(() => res.sendStatus(500));
  });

  router.post("/", (req, res) => {
    ensureListener(req.wlCtx);
    const collection = req.wlSite.usersCollection;

    if (req.body.key) {
      if (!req.wlSite.userKey || req.body.key !== req.wlSite.userKey) {
        return res.sendStatus(400);
      }
      const email = req.body.email;
      const field = req.body.field;
      const value = req.body.value;
      const isAdmin = req.body.isAdmin;
      let userId = null;
      for (const k of Object.keys(req.wlCtx.permissionsData)) {
        if (req.wlCtx.permissionsData[k].email === email) {
          userId = k;
        }
      }
      if (!userId) {
        return res.sendStatus(404);
      }
      const docRef = req.wlCtx.db.doc(`${collection}/${userId}`);
      return docRef
        .get()
        .then((docSnap) => {
          const newUserData = docSnap.data();
          if (isAdmin) {
            newUserData.adminPermissions = newUserData.adminPermissions || {};
            newUserData.adminPermissions[field] = value;
          } else {
            newUserData.permissions = newUserData.permissions || {};
            newUserData.permissions[field] = value;
          }
          return docRef.set(newUserData).then(() => res.sendStatus(200));
        })
        .catch(() => res.sendStatus(500));
    }

    const permissions = req.body.permissions || {};
    const adminPermissions = req.body.adminPermissions || {};
    const docRef = req.wlCtx.db.doc(`${collection}/${req.body.userId}`);
    const newUserData = {
      displayName: req.body.displayName,
      email: req.body.email,
      permissions: {},
      adminPermissions: {},
    };
    for (const permission of Object.values(permissions)) {
      newUserData.permissions[permission] = false;
    }
    for (const adminPermission of Object.values(adminPermissions)) {
      newUserData.adminPermissions[adminPermission] = true;
    }

    return docRef
      .get()
      .then((snap) => {
        if (snap.exists) {
          return res.sendStatus(200);
        }
        return docRef.set(newUserData).then(() => res.sendStatus(200));
      })
      .catch(() => res.sendStatus(500));
  });

  return router;
}

module.exports = { createAuthRouter };
