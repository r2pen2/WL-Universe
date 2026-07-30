const express = require('express');
const db = require('../../firebase.js');
const { cmsCollection } = require('./cmsCollections');

/** Site text by ID, initialized to an empty dictionary */
let siteTextData = {}

let siteTextCollectionRef = null;
let siteTextCollectionName = null;
function listen() {
  siteTextCollectionRef.onSnapshot((data) => {
    console.log("Found updated siteText data");
    siteTextData = {}; // Clear data
    for (const doc of data.docs) {
        const data = doc.data();
        siteTextData[doc.id] = data.text;
    }
  })
}

class SiteTextManager {

  constructor(siteKey) {
    this.siteKey = siteKey;
  }

  initialize() {
    siteTextCollectionName = cmsCollection(`siteText-${this.siteKey}`);
    console.log("Creating new SiteTextManager with site key: " + this.siteKey + " collection: " + siteTextCollectionName)
    this.router = express.Router();

    this.router.get('/' , (req, res) => {
      const resText = siteTextData[req.query.id];
      if (resText) {
        res.send(resText);
      } else {
        res.sendStatus(404);
      }
    });

    this.router.post("/", (req, res) => {
      const firestoreId = req.body.id;
      const newText = req.body.newText;
      const siteTextDocumentRef = db.doc(`${siteTextCollectionName}/${firestoreId}`);
      siteTextDocumentRef.set({text: newText});
    })

    siteTextCollectionRef = db.collection(siteTextCollectionName);
    listen()
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteTextManager;
