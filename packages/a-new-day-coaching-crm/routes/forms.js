const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');
const { getUser, setUser } = require('./users');

router.use(bodyParser.json());

const confettiRecipients = {}

router.get("/confetti", (req, res) => {
  const uid = req.query.userId
  if (confettiRecipients[uid]) {
    res.json({ formId: confettiRecipients[uid] });
    delete confettiRecipients[uid];
  } else {
    res.json({ formId: null });
  }
})

router.post("/started", (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = getUser(userId);
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {
      formAssignment.started = true;
    }
  }
  setUser(user);
})

router.post("/submitted", (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = getUser(userId);
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {
      formAssignment.completed = true;
      formAssignment.completedDate = new Date();
      confettiRecipients[userId] = formId;
    }
  }
  setUser(user);
})

router.post("/assign", (req, res) => {
  
  const formData = req.body.formData;
  const userId = req.body.userId;

  const user = getUser(userId);
  // Check if the form is already assigned & uncompleted
  const userHasFormInList = user.formAssignments.filter(formAssignment => formAssignment.formId === formData.formId).length > 0;
  const existingForm = user.formAssignments.filter(formAssignment => formAssignment.formId === formData.formId)[0];
  
  if (userHasFormInList && !existingForm.completed) { return; }
  if (userHasFormInList && existingForm.completed) {
    // Mark the form as uncompleted
    existingForm.completed = false;
    db.collection("users").doc(userId).set(user);
    return;
  }
  
  // Add the form
  user.formAssignments.push(formData);
  setUser(user).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });
})


router.post("/unassign", (req, res) => {
  
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = getUser(userId);
  // Remove the form
  user.formAssignments = user.formAssignments.filter(fa => fa.formId !== formId);

  setUser(user).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });
})

router.post("/incomplete", (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = getUser(userId);
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {
      
      console.log(`Marking form ${formId} as incomplete for user ${userId}...`)

      formAssignment.completed = false;
      formAssignment.completedDate = null;
      formAssignment.started = false;
    }
  }
  setUser(user).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });;
})

module.exports = router;