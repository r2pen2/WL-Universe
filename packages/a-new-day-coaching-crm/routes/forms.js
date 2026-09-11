const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
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

router.post("/started", async (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user) { return res.json({ success: false, error: "User not found" }); }
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {
      formAssignment.started = true;
    }
  }
  await setUser(user);
  res.json({ success: true });
})

router.post("/submitted", async (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user) { return res.json({ success: false, error: "User not found" }); }
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {
      formAssignment.completed = true;
      formAssignment.completedDate = new Date();
      confettiRecipients[userId] = formId;
    }
  }
  await setUser(user);
  res.json({ success: true });
})

router.post("/assign", async (req, res) => {

  const formData = req.body.formData;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user) { return res.json({ success: false, error: "User not found" }); }
  // Check if the form is already assigned & uncompleted
  const userHasFormInList = user.formAssignments.filter(formAssignment => formAssignment.formId === formData.formId).length > 0;
  const existingForm = user.formAssignments.filter(formAssignment => formAssignment.formId === formData.formId)[0];

  if (userHasFormInList && !existingForm.completed) { return res.json({ success: true }); }
  if (userHasFormInList && existingForm.completed) {
    // Mark the form as uncompleted
    existingForm.completed = false;
    await setUser(user);
    return res.json({ success: true });
  }

  // Add the form
  user.formAssignments.push(formData);
  try {
    await setUser(user);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
})


router.post("/unassign", async (req, res) => {

  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user) { return res.json({ success: false, error: "User not found" }); }
  // Remove the form
  user.formAssignments = user.formAssignments.filter(fa => fa.formId !== formId);

  try {
    await setUser(user);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
})

router.post("/incomplete", async (req, res) => {
  const formId = req.body.formId;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user) { return res.json({ success: false, error: "User not found" }); }
  for (const formAssignment of user.formAssignments) {
    if (formAssignment.formId === formId) {

      console.log(`Marking form ${formId} as incomplete for user ${userId}...`)

      formAssignment.completed = false;
      formAssignment.completedDate = null;
      formAssignment.started = false;
    }
  }
  try {
    await setUser(user);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
})

module.exports = router;
