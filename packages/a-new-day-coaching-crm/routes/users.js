const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');

router.use(bodyParser.json());

let allUsers = {};

/** Update users when a change is detected */
db.collection("users").onSnapshot((querySnapshot) => {
  allUsers = {};
  querySnapshot.forEach((doc) => {
    allUsers[doc.id] = doc.data();
    allUsers[doc.id].id = doc.id;
  });
});

router.get("/search-forms", (req, res) => {
  const resUsers = {}
  for (const userId of Object.keys(allUsers)) {
    const u = allUsers[userId];
    resUsers[userId] = {
      personalData: {
        displayName: u.personalData.displayName,
        email: u.personalData.email,
        role: u.personalData.role
      },
      id: u.id,
      formAssignments: u.formAssignments
    }
  }
  res.json(resUsers);
})

router.get("/search-invoices", (req, res) => {
  const resUsers = {}
  for (const userId of Object.keys(allUsers)) {
    const u = allUsers[userId];
    if (u.personalData.role === "Student") {
      resUsers[userId] = {
        personalData: {
          displayName: u.personalData.displayName,
          email: u.personalData.email,
          role: u.personalData.role
        },
        id: u.id,
      }
    }
  }
  res.json(resUsers);
})

router.get("/search-tools", (req, res) => {
  const resUsers = {}
  for (const userId of Object.keys(allUsers)) {
    const u = allUsers[userId];
    resUsers[userId] = {
      personalData: {
        displayName: u.personalData.displayName,
        email: u.personalData.email,
        role: u.personalData.role
      },
      id: u.id,
      tools: u.tools
    }
  }
  res.json(resUsers);
})

router.get("/search-users", (req, res) => {
  const resUsers = {}
  for (const userId of Object.keys(allUsers)) {
    const u = allUsers[userId];
    resUsers[userId] = {
      personalData: {
        displayName: u.personalData.displayName,
        email: u.personalData.email,
        role: u.personalData.role
      },
      id: u.id
    }
  }
  res.json(resUsers);
})

router.get("/user", (req, res) => {
  res.json(allUsers[req.query.id] ? allUsers[req.query.id] : {});
})

router.get("/sync", (req, res) => {
  if (req.query.code) {
    res.json({user: Object.values(allUsers).filter((u) => u.syncCode === req.query.code)[0]});
  } else {
    // Generate a random 6 character string consisting of capital letters and numbers
    let foundNewCode = false;
    while(!foundNewCode) {
      var randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (Object.values(allUsers).filter((u) => u.syncCode === randomString).length <= 0) {
        foundNewCode = true;
      }
    }
    res.json({ code: randomString });
  }
})

function getAllUsers() { return allUsers }
function getUser(id) { return allUsers[id]; }
async function setUser(user) { 
  return new Promise((resolve, reject) => {
    db.collection("users").doc(user.id).set(user).then(() => { 
      resolve();
    }).catch((error) => { reject(error); }); 
  }) 
}

module.exports = { router, getAllUsers, getUser, setUser };