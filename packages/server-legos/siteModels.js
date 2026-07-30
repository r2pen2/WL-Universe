const express = require('express');
const router = express.Router();

const db = require('../../firebase.js');
const { cmsCollection } = require('./cmsCollections');

const siteModelData = {};

function remoteCollection(logicalName) {
  return cmsCollection(logicalName);
}

router.get('/' , async (req, res) => {
  if (req.query.collection === "users") {
    res.sendStatus(403);
  }
  const resModels = siteModelData[req.query.collection];
  if (resModels) {
    res.json(resModels);
  } else {
    const collectionName = remoteCollection(req.query.collection);
    let sendList = [];
    const snapshot = await db.collection(collectionName).get();
    snapshot.forEach((doc) => {
      const dataWithId = doc.data();
      dataWithId.id = doc.id;
      sendList.push(dataWithId);
    });
    res.json(sendList);
    console.log("Beginning to listen to collection: " + collectionName);
    db.collection(collectionName).onSnapshot((snap) => {
      console.log("Found updated data for collection: " + collectionName);
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

router.post("/", (req, res) => {
  const collectionName = remoteCollection(req.body.collection);
  if (req.body.action) {
    if (req.body.action === "delete") {
      const docRef = db.doc(`${collectionName}/${req.body.documentId}`);
      docRef.delete().then(() => {
        res.sendStatus(200);
      })
    }
    if (req.body.action === "create") {
      db.collection(collectionName).add(req.body.documentData).then(() => {
        res.sendStatus(200);
      })
    }
  } else {
    const docRef = db.doc(`${collectionName}/${req.body.documentId}`);
    docRef.set(req.body.documentData).then(() => {
      res.sendStatus(200);
    });
  }
})

module.exports = router;
