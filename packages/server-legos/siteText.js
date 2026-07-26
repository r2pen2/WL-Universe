const express = require('express');
const router = express.Router();

const db = require('../../firebase.js');

/** Site text by ID, initialized to an empty dictionary */
let siteTextData = {}

// On launch, fetch testimonial, offering, and staff data from Firebase
const siteTextCollectionRef = db.collection("siteText");
siteTextCollectionRef.onSnapshot((data) => {
  console.log("Found updated siteText data");
  siteTextData = {}; // Clear data
  for (const doc of data.docs) {
      const data = doc.data();
      siteTextData[doc.id] = data.text;
  }
})

router.get('/' , (req, res) => {
  const resText = siteTextData[req.query.id];
  if (resText) {
    res.send(resText);
  } else {
    res.sendStatus(404);
  }
});

router.post("/", (req, res) => {
  const firestoreId = req.body.id;
  const newText = req.body.newText;
  const siteTextDocumentRef = db.doc(`siteText/${firestoreId}`);
  siteTextDocumentRef.set({text: newText});
})

module.exports = router;
