const express = require('express');
const router = express.Router();
require("dotenv").config()

const serviceAccountKey = require("../config/cal.json")

const { google } = require('googleapis');

const bodyParser = require('body-parser');

router.use(bodyParser.json());

const GOOGLE_CALENDAR_ID = "rdayanim@gmail.com"
  
const jwtClient = new google.auth.JWT(
  serviceAccountKey.client_email,
  './service_account.json',
  serviceAccountKey.private_key,
  ['https://www.googleapis.com/auth/calendar']
);

router.get("/events" , (req, res) => {

  const calendar = google.calendar({ version: 'v3', auth: jwtClient });

  const inviteeEmail = req.query.invitee;

  calendar.events.list({ 
    calendarId: GOOGLE_CALENDAR_ID, 
    timeMin: (new Date()).toISOString(), 
    maxResults: 16, 
    singleEvents: true, 
    orderBy: 'startTime', 
    q: inviteeEmail,
    timeMin: (new Date())
  }, (error, result) => { 
    if (error) { 
      res.send(JSON.stringify({ error: error })); 
    } else { 
      if (result.data.items.length) {
        const events = result.data.items;
        res.json({ events: events }); 
      } else { 
        res.json(({ events: [] })); 
      } 
    } 
  }); 
})

module.exports = router;