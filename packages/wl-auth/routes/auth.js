const express = require("express");
const logger = require("../lib/logger");

// Every handler reads Firestore directly. These used to be served from a
// cache kept warm by collection(...).onSnapshot(...), but that long-lived
// stream can't survive on glados (see the a-new-day-coaching-crm firebase.js
// note): the cache stayed {} forever, so the admin-portal paths below -- list
// all users, and find-by-email to change a permission -- always came back
// empty / 404. One-shot reads were never affected.

/** A user's permissions, with every one switched on if they're an operator. */
function effectivePermissions(data) {
  const permissions = { ...((data && data.permissions) || {}) };
  if (permissions.op) {
    for (const k of Object.keys(permissions)) {
      permissions[k] = true;
    }
  }
  return permissions;
}

function fail(req, res, error) {
  logger.error("site_auth_error", { site: req.wlSite.slug, error: error.message });
  return res.sendStatus(500);
}

function createAuthRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const collection = req.wlCtx.db.collection(req.wlSite.usersCollection);
    try {
      const key = req.query.key;
      if (key) {
        if (!req.wlSite.userKey || key !== req.wlSite.userKey) {
          return res.sendStatus(400);
        }
        const snap = await collection.get();
        const users = {};
        for (const doc of snap.docs) {
          users[doc.id] = doc.data();
        }
        return res.json(users);
      }

      if (!req.query.id) {
        return res.sendStatus(400);
      }
      const doc = await collection.doc(String(req.query.id)).get();
      if (!doc.exists) return res.sendStatus(404);
      return res.json(effectivePermissions(doc.data()));
    } catch (error) {
      return fail(req, res, error);
    }
  });

  router.post("/", async (req, res) => {
    const collection = req.wlCtx.db.collection(req.wlSite.usersCollection);
    try {
      if (req.body.key) {
        // From the admin portal: set one permission on the user with this email.
        if (!req.wlSite.userKey || req.body.key !== req.wlSite.userKey) {
          return res.sendStatus(400);
        }
        const { email, field, value, isAdmin } = req.body;
        const matches = await collection.where("email", "==", email).get();
        if (matches.empty) {
          return res.sendStatus(404);
        }
        // Same as before: if several docs share an email, the last one wins.
        const docRef = matches.docs[matches.docs.length - 1].ref;
        const newUserData = (await docRef.get()).data();
        if (isAdmin) {
          newUserData.adminPermissions = newUserData.adminPermissions || {};
          newUserData.adminPermissions[field] = value;
        } else {
          newUserData.permissions = newUserData.permissions || {};
          newUserData.permissions[field] = value;
        }
        await docRef.set(newUserData);
        return res.sendStatus(200);
      }

      // From a site on sign-in: create the user's doc if it doesn't exist yet.
      if (!req.body.userId) {
        return res.sendStatus(400);
      }
      const permissions = req.body.permissions || {};
      const adminPermissions = req.body.adminPermissions || {};
      const docRef = collection.doc(String(req.body.userId));
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

      const snap = await docRef.get();
      if (!snap.exists) {
        await docRef.set(newUserData);
      }
      return res.sendStatus(200);
    } catch (error) {
      return fail(req, res, error);
    }
  });

  return router;
}

module.exports = { createAuthRouter, effectivePermissions };
