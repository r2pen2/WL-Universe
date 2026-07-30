const express = require('express');
const router = express.Router();

const db = require('../../firebase.js');
const { cmsCollection } = require('./cmsCollections');

const siteModelData = {};

class SiteModelManager {

  constructor(siteKey) {
    this.siteKey = siteKey;
  }

  initialize() {
    console.log("Creating new SiteModelManager with site key: " + this.siteKey)
    this.router = express.Router();

    this.router.get('/' , async (req, res) => {

      const remoteCollection = cmsCollection(req.query.collection + "-" + this.siteKey);

      if (req.query.collection === "users") {
        res.sendStatus(403);
      }
      const resModels = siteModelData[req.query.collection];
      if (resModels) {
        res.json(resModels);
      } else {
        let sendList = [];
        const snapshot = await db.collection(remoteCollection).get();
        snapshot.forEach((doc) => {
          const dataWithId = doc.data();
          dataWithId.id = doc.id;
          sendList.push(dataWithId);
        });
        res.json(sendList);
        console.log("Beginning to listen to collection: " + remoteCollection);
        db.collection(remoteCollection).onSnapshot((snap) => {
          console.log("Found updated data for collection: " + remoteCollection);
          let newList = [];
          for (const doc of snap.docs) {
            const dataWithId = doc.data();
            dataWithId.id = doc.id;
            newList.push(dataWithId);
          }
          siteModelData[req.query.collection] = newList;
        })
      }
    });

    this.router.post("/", (req, res) => {


      const remoteCollection = cmsCollection(req.body.collection + "-" + this.siteKey);

      if (req.body.action) {
        if (req.body.action === "delete") {
          const docRef = db.doc(`${remoteCollection}/${req.body.documentId}`);
          docRef.delete().then(() => {
            res.sendStatus(200);
          })
        }
        if (req.body.action === "create") {
          db.collection(remoteCollection).add(req.body.documentData).then(() => {
            res.sendStatus(200);
          })
        }
      } else {
        const docRef = db.doc(`${remoteCollection}/${req.body.documentId}`);
        docRef.set(req.body.documentData).then(() => {
          res.sendStatus(200);
        });
      }
    })
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteModelManager;
