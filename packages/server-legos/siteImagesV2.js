const express = require('express');
const db = require('../../firebase.js');
const fs = require('fs');

/** Site text by ID, initialized to an empty dictionary */
let siteImagesData = {}

// On launch, fetch testimonial, offering, and staff data from Firebase
let siteImagesCollectionRef = null;
function listen() {
  siteImagesCollectionRef.onSnapshot((data) => {
    console.log("Found updated siteImages data");
    siteImagesData = {}; // Clear data
    for (const doc of data.docs) {
      const data = doc.data();
      siteImagesData[doc.id] = data;
    }
  })
}

class SiteImageManager {

  constructor(siteKey) {
    this.siteKey = siteKey;
  }

  initialize() {
    console.log("Creating new SiteImageManager with site key: " + this.siteKey)
    this.router = express.Router();

    this.router.get('/' , (req, res) => {
      const resImage = siteImagesData[req.query.id];
      if (resImage) {
        res.json(resImage);
      } else {
        res.sendStatus(404);
      }
    });

    this.router.post("/", (req, res) => {
      const newSource = "images/" + req.body.fileName
      const targetPath = __dirname + "/../../static/images/" + req.body.fileName;
      fs.writeFile(targetPath, req.files.file.data, (err) => {
        if (err) {
          console.log(err);
          res.sendStatus(500)
        } else {
          const firestoreId = req.body.firestoreId;
          const siteImageDocumentRef = db.doc(`siteImages-${this.siteKey}/${firestoreId}`);
          siteImageDocumentRef.set({source: newSource, fileName: req.body.fileName}).then(() => {
            res.sendStatus(200);
            const deletePath = __dirname + "/../../static/images/" + req.body.oldFileName;
            fs.rm(deletePath, (err) => {
              if (err) {
                console.log(err);
              }
            })
          });
        }
      });
    })

    siteImagesCollectionRef = db.collection(`siteImages-${this.siteKey}`);
    listen()
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteImageManager;
