const express = require('express');
const router = express.Router();
const fs = require('fs');

const db = require('../../firebase.js');
const { cmsCollection } = require('./cmsCollections');

/** Site images by ID, initialized to an empty dictionary */
let siteImagesData = {}

const siteImagesCollectionName = cmsCollection("siteImages");
console.log(`siteImages listening on collection: ${siteImagesCollectionName}`);
const siteImagesCollectionRef = db.collection(siteImagesCollectionName);
siteImagesCollectionRef.onSnapshot((data) => {
  console.log("Found updated siteImages data");
  siteImagesData = {}; // Clear data
  for (const doc of data.docs) {
      const data = doc.data();
      siteImagesData[doc.id] = data;
  }
})

router.get('/' , (req, res) => {
  const resImage = siteImagesData[req.query.id];
  if (resImage) {
    res.json(resImage);
  } else {
    res.sendStatus(404);
  }
});

router.post("/", (req, res) => {
  console.log(req)
  const newSource = "images/" + req.body.fileName
  const targetPath = __dirname + "/../../images/" + req.body.fileName;
  fs.writeFile(targetPath, req.files.file.data, (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(500)
    } else {
      const firestoreId = req.body.firestoreId;
      const siteImageDocumentRef = db.doc(`${siteImagesCollectionName}/${firestoreId}`);
      siteImageDocumentRef.set({source: newSource, fileName: req.body.fileName}).then(() => {
        res.sendStatus(200);
        const deletePath = __dirname + "/../../images/" + req.body.oldFileName;
        fs.rm(deletePath, (err) => {
          if (err) {
            console.log(err);
          }
        })
      });
    }
  });
})

module.exports = router;
