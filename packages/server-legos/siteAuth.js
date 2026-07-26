const express = require('express');

const db = require('../../firebase.js');

/** Site text by ID, initialized to an empty dictionary */
let sitePermissionsData = {}

// On launch, fetch testimonial, offering, and staff data from Firebase
const usersCollectionRef = db.collection("users");
usersCollectionRef.onSnapshot((data) => {
  console.log("Found updated users data");
  sitePermissionsData = {}; // Clear data
  for (const doc of data.docs) {
      sitePermissionsData[doc.id] = doc.data();
  }
})

class SiteAuthenticationManager {

  constructor(userKey) {
    this.userKey = userKey;
  }

  initialize() {
    console.log("Creating new SiteAuthenticationManager with user key: " + this.userKey)
    this.router = express.Router();

    this.router.get('/' , (req, res) => {
      const key = req.query.key;
      console.log(key)
      if (key) {
        if (key !== this.userKey || !this.userKey) {
          res.send(400)
        } else {
          res.json(sitePermissionsData);
        }
      } else {
        const user = sitePermissionsData[req.query.id];
        if (user) {
          if (user.permissions.op) {
            for (const key of Object.keys(user.permissions)) {
              user.permissions[key] = true;
            }
          }
          res.json(user.permissions);
        } else {
          res.sendStatus(404);
        }
      }
    });

    this.router.post("/", (req, res) => {

      if (req.body.key) {
        // This is coming from the admin portal
        const key = req.body.key;

        if (key !== this.userKey || !this.userKey) {
          res.send(400)
        } else {
          const email = req.body.email;
          const field = req.body.field;
          const value = req.body.value;
          const isAdmin = req.body.isAdmin;
          let userId = null;
          for (const k of Object.keys(sitePermissionsData)) {
            if (sitePermissionsData[k].email === email) {
              userId = k;
            }
          }
          const docRef = db.doc(`users/${userId}`);
          docRef.get().then(docSnap => {
            const newUserData = docSnap.data();
            if (isAdmin) {
              newUserData.adminPermissions[field] = value;
            } else {
              newUserData.permissions[field] = value;
            }
            docRef.set(newUserData).then(() => {
              res.sendStatus(200);
            });
          })
        }
      } else {
        const permissions = req.body.permissions;
        const adminPermissions = req.body.adminPermissions;
        const docRef = db.doc(`users/${req.body.userId}`);
        const newUserData = {};
        newUserData.displayName = req.body.displayName;
        newUserData.email = req.body.email;
        newUserData.permissions = {};
        newUserData.adminPermissions = {};
        for (const permission of Object.values(permissions)) {
          newUserData.permissions[permission] = false;
        }
        for (const admminPermission of Object.values(adminPermissions)) {
          newUserData.adminPermissions[admminPermission] = true;
        }

        docRef.get().then(snap => {
          if (snap.exists) {
            res.sendStatus(200);
          } else {
            docRef.set(newUserData).then(() => {
              res.sendStatus(200);
            });
          }
        })
      }
    })
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteAuthenticationManager;
