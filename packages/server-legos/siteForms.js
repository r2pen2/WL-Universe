const express = require('express');

const db = require('../../firebase.js');

/** Site forms by ID, initialized to an empty dictionary */
let siteFormsData = {}

// On launch, fetch all forms from Firebase
const siteFormsCollectionRef = db.collection("siteForms");
siteFormsCollectionRef.onSnapshot((data) => {
  console.log("Found updated siteForms data");
  siteFormsData = {}; // Clear data
  for (const doc of data.docs) {
    const data = doc.data();
    siteFormsData[doc.id] = data;
  }
})

class SiteFormManager {

  constructor(formKey) {
    this.formKey = formKey;
  }

  initialize() {
    console.log("Creating new SiteFormManager with form key: " + this.formKey)
    this.router = express.Router();
    this.router.get('/' , (req, res) => {
      const key = req.query.key;
      if (key !== this.formKey || !this.formKey) {
        res.send(400)
      } else {
        res.json(siteFormsData);
      }
    });

    this.router.post("/", (req, res) => {
      if (req.body.action) {
        if (req.body.action === "delete") {
          const docRef = db.doc(`${"siteForms"}/${req.body.documentId}`);
          docRef.delete().then(() => {
            res.sendStatus(200);
          })
        }
      } else {
        db.collection("siteForms").add(req.body.documentData).then(() => {
          res.sendStatus(200);
        })
      }
    })
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteFormManager;
