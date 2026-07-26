const express = require('express');
const router = express.Router();

const defaultMaxUpload = 5000;

router.get("/", (req, res) => {
  res.send("<p>Specify a rule. (max-upload)</p>")
})

router.get('/max-upload' , (req, res) => {
  const maxUpload = defaultMaxUpload;
  res.json({maxUpload: maxUpload});
});

module.exports = router;
