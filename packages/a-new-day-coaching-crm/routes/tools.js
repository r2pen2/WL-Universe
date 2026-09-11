const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');
const { getUser, setUser } = require('./users');

router.use(bodyParser.json());

/** Same one-shot-read approach as users.js -- see the comment there. */
async function getAllTools() {
  const snapshot = await db.collection("tools").get();
  const tools = {};
  snapshot.forEach((doc) => {
    tools[doc.id] = { ...doc.data(), id: doc.id };
  });
  return tools;
}

async function getTool(id) {
  const doc = await db.collection("tools").doc(id).get();
  return doc.exists ? { ...doc.data(), id: doc.id } : null;
}

router.post("/create", async (req, res) => {
  const title = req.body.title;
  const description = req.body.description;

  try {
    const docRef = await db.collection("tools").add({
      title,
      description,
      assignedTo: []
    });
    console.log(`Created tool with ID: ${docRef.id}`);
    res.json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding document: ", error);
    res.json({ error: error });
  }
})

router.post("/delete", async (req, res) => {
  const toolId = req.body.toolId;
  const tool = await getTool(toolId);

  if (tool?.assignedTo) {
    // Remove tool from all users
    for (const userId of tool.assignedTo) {
      const user = await getUser(userId);
      if (user) {
        delete user.tools[toolId];
        await setUser(user);
      }
    }
  }

  // Delete the tool itself
  try {
    await db.collection("tools").doc(toolId).delete();
    res.json(await getAllTools());
  } catch (error) {
    console.error("Error deleting document: ", error);
    res.json({ error: error });
  }
})

router.post("/assign-multiple", async (req, res) => {
  const toolId = req.body.toolId;
  const users = req.body.users;
  const title = req.body.title;
  const description = req.body.description;

  for (const userId of users) {
    const user = await getUser(userId);
    if (!user) { continue; }
    const tool = { id: toolId, title: title, description: description, starred: false };
    if (!user.tools) { user.tools = {}; }
    user.tools[toolId] = tool;
    await setUser(user);
  }

  try {
    const tool = (await getTool(toolId)) || { id: toolId, title, description, assignedTo: [] };
    tool.assignedTo = (tool.assignedTo || []).concat(users);
    await db.collection("tools").doc(toolId).set(tool);
    res.json(await getAllTools());
  } catch (error) {
    console.error("Error assigning tool to users: ", error);
    res.json({ error: error });
  }
})

router.post("/unassign-multiple", async (req, res) => {
  const toolId = req.body.toolId;
  const users = req.body.users;

  for (const userId of users) {
    const user = await getUser(userId);
    if (!user) { continue; }
    if (!user.tools) { user.tools = {}; }
    delete user.tools[toolId];
    await setUser(user);
  }

  try {
    const tool = await getTool(toolId);
    if (!tool) { res.json(await getAllTools()); return; }
    tool.assignedTo = (tool.assignedTo || []).filter((userId) => !users.includes(userId));
    await db.collection("tools").doc(toolId).set(tool);
    res.json(await getAllTools());
  } catch (error) {
    console.error("Error unassign tool from users: ", error);
    res.json({ error: error });
  }
})

router.post("/user-star", async (req, res) => {
  const toolId = req.body.toolId;
  const userId = req.body.userId;

  const user = await getUser(userId);
  if (!user || !user.tools?.[toolId]) { return res.json({ success: false }); }
  user.tools[toolId].starred = !user.tools[toolId].starred;
  await setUser(user);
  res.json({ success: true });
})

router.get("/", async (req, res) => { res.json(await getAllTools()); })

module.exports = { router, getAllTools };
