const express = require('express');
const router = express.Router();
require("dotenv").config()

const serviceAccountKey = require("../config/cal.json")

const { google } = require('googleapis');

const bodyParser = require('body-parser');

router.use(bodyParser.json());

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];

const oauth2Client = google.auth.fromJSON(serviceAccountKey)

router.get("/", (req, res) => {

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const documentId = req.query.id

  // docs.documents.get({documentId: documentId}).then(response => {
  //   if (response.status === 403) {
  //     res.send(403);
  //   }
  //   // res.send(doc)
  // })

  console.log(drive)

  drive.files.get({fileId: documentId}).then(response => {
    if (response.status === 403) {
      res.send(403);
    }
    res.send(response.data)
  })
})


module.exports = router;