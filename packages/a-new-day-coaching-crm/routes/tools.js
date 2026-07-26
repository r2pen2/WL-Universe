const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');
const { getAllUsers, getUser, setUser } = require('./users');

router.use(bodyParser.json());

let allTools = {};

/** Update tools when a change is detected */
db.collection("tools").onSnapshot((querySnapshot) => {
  allTools = {};
  querySnapshot.forEach((doc) => {
    allTools[doc.id] = doc.data();
    allTools[doc.id].id = doc.id;
  });
});

router.post("/create", (req, res) => {
  const toolId = req.body.title;
  const description = req.body.description;

  db.collection("tools").add({
    title: toolId,
    description: description,
    assignedTo: []
  }).then((docRef) => {
    console.log(`Created tool with ID: ${docRef.id}`);
    res.json({ id: docRef.id });
  }).catch((error) => {
    console.error("Error adding document: ", error);
    res.json({ error: error });
  });
})

router.post("/delete", (req, res) => {
  const toolId = req.body.toolId;

  if (allTools[toolId].assignedTo) {
    // Remove tool from all users
    for (const userId of allTools[toolId].assignedTo) {
      const user = getUser(userId);
      delete user.tools[toolId];
      setUser(user);
    }
  }

  // Delete the tool itself
  db.collection("tools").doc(toolId).delete().then(() => {
    // Delete tool from all users
    res.json(allTools);
  }).catch((error) => {
    console.error("Error deleting document: ", error);
    res.json({ error: error });
  });
})

router.post("/assign-multiple", async (req, res) => {
  const toolId = req.body.toolId;
  const users = req.body.users;
  const title = req.body.title;
  const description = req.body.description;

  for (const userId of users) {
    const user = getUser(userId);
    const tool = { id: toolId, title: title, description: description, starred: false };
    if (!user.tools) { user.tools = {}; }
    user.tools[toolId] = tool;
    await setUser(user);
  }

  const tool = allTools[toolId];
  if (!tool.assignedTo) { tool.assignedTo = []; }
  tool.assignedTo = tool.assignedTo.concat(users);
  db.collection("tools").doc(toolId).set(tool).then(() => {
    res.json(allTools);
  }).catch((error) => {
    console.error("Error assigning tool to users: ", error);
    res.json({ error: error });
  });
})

router.post("/unassign-multiple", async (req, res) => {
  const toolId = req.body.toolId;
  const users = req.body.users;
  
  for (const userId of users) {
    const user = getUser(userId);
    if (!user.tools) { user.tools = {}; }
    delete user.tools[toolId];
    await setUser(user);
  }

  // Remove users from the tool
  const tool = allTools[toolId];
  if (!tool.assignedTo) { tool.assignedTo = []; }
  tool.assignedTo = tool.assignedTo.filter((userId) => !users.includes(userId));
  db.collection("tools").doc(toolId).set(tool).then(() => {
    res.json(allTools);
  }).catch((error) => {
    console.error("Error unassign tool from users: ", error);
    res.json({ error: error });
  });
})

router.post("/user-star", (req, res) => {
  const toolId = req.body.toolId;
  const userId = req.body.userId;

  const user = getUser(userId);
  user.tools[toolId].starred = !user.tools[toolId].starred;
  setUser(user);
})

router.get("/", (req, res) => { res.json(allTools); })

function getAllTools() { return allTools; }

module.exports = { router, getAllTools };