const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');
const { applyUserDefaults } = require('../client/src/api/db/userDefaults');

router.use(bodyParser.json());

/**
 * These used to be served from an in-memory cache kept warm by
 * db.collection("users").onSnapshot(...). That long-lived realtime stream
 * can't survive on glados -- it backs off until "Exceeded maximum number of
 * retries allowed" and the cache never populates, which is what "all student
 * profiles are gone" turned out to be (routes/users.js, forms.js, tools.js,
 * invoices.js all did this). One-shot reads/writes were never affected, so
 * everything below just reads Firestore directly on each request instead of
 * trusting a background listener to still be alive.
 *
 * Each doc is also checked against the shared defaults (see
 * client/src/api/db/userDefaults.js). If any fields are missing, write the defaults
 * back to the doc and read it again, so callers always get a complete record and the
 * doc itself gets fixed rather than tripping up the next reader.
 */
async function loadUser(doc) {
  const { record, patch } = applyUserDefaults(doc.data(), doc.id);
  if (!patch) { return { ...record, id: doc.id }; }
  try {
    await doc.ref.set(patch, { merge: true });
    const retry = await doc.ref.get();
    return { ...applyUserDefaults(retry.data(), doc.id).record, id: doc.id };
  } catch (error) {
    console.error(`users/${doc.id}: failed to write missing default fields:`, error);
    return { ...record, id: doc.id };
  }
}

async function getAllUsers() {
  const snapshot = await db.collection("users").get();
  const records = await Promise.all(snapshot.docs.map(loadUser));
  const users = {};
  for (const user of records) { users[user.id] = user; }
  return users;
}

async function getUser(id) {
  const doc = await db.collection("users").doc(id).get();
  return doc.exists ? loadUser(doc) : null;
}

async function setUser(user) {
  return db.collection("users").doc(user.id).set(user);
}

function trimUser(u, extra = {}) {
  return {
    personalData: {
      displayName: u.personalData.displayName,
      email: u.personalData.email,
      role: u.personalData.role
    },
    id: u.id,
    ...extra
  }
}

// NOTE: the CRM client no longer calls any of the routes below for its own
// roster/profile views -- it reads the `users` collection directly with the
// Firestore client SDK now (see client/src/api/db/dbUser.ts), which removes
// the dependency on this server (and on this domain being reachable at all)
// for plain reads. These routes are left in place, fixed, in case anything
// else still hits them.

router.get("/search-forms", async (req, res) => {
  const allUsers = await getAllUsers();
  const resUsers = {};
  for (const u of Object.values(allUsers)) {
    resUsers[u.id] = trimUser(u, { formAssignments: u.formAssignments });
  }
  res.json(resUsers);
})

router.get("/search-invoices", async (req, res) => {
  const allUsers = await getAllUsers();
  const resUsers = {};
  for (const u of Object.values(allUsers)) {
    if (u.personalData.role === "Student") {
      resUsers[u.id] = trimUser(u);
    }
  }
  res.json(resUsers);
})

router.get("/search-tools", async (req, res) => {
  const allUsers = await getAllUsers();
  const resUsers = {};
  for (const u of Object.values(allUsers)) {
    resUsers[u.id] = trimUser(u, { tools: u.tools });
  }
  res.json(resUsers);
})

router.get("/search-users", async (req, res) => {
  const allUsers = await getAllUsers();
  const resUsers = {};
  for (const u of Object.values(allUsers)) {
    resUsers[u.id] = trimUser(u);
  }
  res.json(resUsers);
})

router.get("/user", async (req, res) => {
  const user = await getUser(req.query.id);
  res.json(user || {});
})

router.get("/sync", async (req, res) => {
  const allUsers = await getAllUsers();
  if (req.query.code) {
    res.json({ user: Object.values(allUsers).filter((u) => u.syncCode === req.query.code)[0] });
  } else {
    // Generate a random 6 character string consisting of capital letters and numbers
    let foundNewCode = false;
    let randomString;
    while (!foundNewCode) {
      randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (Object.values(allUsers).filter((u) => u.syncCode === randomString).length <= 0) {
        foundNewCode = true;
      }
    }
    res.json({ code: randomString });
  }
})

module.exports = { router, getAllUsers, getUser, setUser };
