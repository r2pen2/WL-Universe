const fetch = require('node-fetch')

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const siteModels = require('./adminSiteModels');
const fileUpload = require('express-fileupload');


const {db, auth} = require("./firebase")

// Init express application
const app = express();

// Allow for CORS and file upload
app.use(cors());
app.use(fileUpload());

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(25565, () => {
    console.log('Now listening on port ' + 25565);
});

// Serve static files
app.use(express.static(__dirname + "/static/"));

// BodyParser setup
app.use(bodyParser.json({ limit: "50mb"}));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));

/**
 * Allow users to securely request forms. This cannot be done form the client becuase we must keep environment variables secret.
 */
app.get("/external-forms", (req, res) => {
    // Harvest siteId and user accessToken from query
    const siteId = req.query.siteId;
    const accessToken = req.query.accessToken;
    // Validate that this GET request is coming from an authenticated user
    auth.verifyIdToken(accessToken).then(decodedToken => {
        // We made it through!
        let secret = null;
        let url = null;
        // Get the right URL and KEY from env
        switch (siteId) {
            case "BTB":
                secret = process.env.BTBFORMKEY;
                url = "https://www.beyondthebelleducation.com"
                break;
            default:
                break;
        }
        const userEmail = decodedToken.email;
        // TODO: Before this fetch, scrape AvailableSites to make sure this user has access to the requested form deck
        // Contact the correct /site-forms endpoint
        if (!url) {
            // URL is not valid— send 404
            res.sendStatus(404)
        } else {
            fetch(`${url}/site-forms?key=${secret}`).then(externalRes => {
                // Send all forms to the client
                externalRes.json().then(json => {
                    res.json(json);
                })
            })
        }
    }).catch(err => {
        res.send(403)
    })
})

/**
 * Allow users to securely request user information. This cannot be done form the client becuase we must keep environment variables secret.
 */
app.get("/external-users", (req, res) => {
    // Harvest siteId and user accessToken from query
    const siteId = req.query.siteId;
    const accessToken = req.query.accessToken;
    // Validate that this GET request is coming from an authenticated user
    auth.verifyIdToken(accessToken).then(decodedToken => {
        // We made it through!
        let secret = null;
        let url = null;
        // Get the right URL and KEY from env
        switch (siteId) {
            case "BTB":
                secret = process.env.BTBUSERKEY;
                url = "https://www.beyondthebelleducation.com"
                break;
            case "YCD":
                secret = process.env.YCDUSERKEY;
                url = "https://www.youcandoitgardening.com"
                break;
            default:
                break;
        }
        const userEmail = decodedToken.email;
        // TODO: Before this fetch, scrape AvailableSites to make sure this user has access to the requested user deck
        // Send the post body to the correct /site-auth endpoint
        if (!url) {
            // URL is not valid— send 404
            res.sendStatus(404)
        } else {
            fetch(`${url}/site-auth?key=${secret}`).then(externalRes => {
                // Send JSON response w/ site's users to the client
                externalRes.json().then(json => {
                    res.json(json);
                })
            }).catch(error => {
                // Something went wrong in our fetch— send a 404
                console.log(error)
                res.sendStatus(404)
            })
        }
    }).catch(error => {
        // We were not authenticated!
        console.log(error)
        res.sendStatus(403)
    })
})

/**
 * Allow for secure changing of user permissions on WL sites. This cannot be done form the client becuase we must keep environment variables secret.
 */
app.post("/external-users", (req, res) => {
    // First, we verify that theis POST request is coming from an authenticated user
    auth.verifyIdToken(req.body.accessToken).then(decodedToken => {
        // We made it through!
        let secret = null;
        let url = null;
        // Get the right URL and KEY from env
        switch (req.body.siteId) {
            case "BTB":
                secret = process.env.BTBUSERKEY;
                url = "https://www.beyondthebelleducation.com"
                break;
            case "YCD":
                secret = process.env.YCDUSERKEY;
                url = "https://www.youcandoitgardening.com"
                break;
            default:
                break;
        }
        const userEmail = decodedToken.email;
        // TODO: Before this fetch, scrape AvailableSites to make sure this user has access to the requested user deck
        // Build the post body and send it to the correct /site-auth endpoint
        const postBody = {
            key: secret,
            email: req.body.email,
            field: req.body.field,
            value: req.body.value,
            isAdmin: req.body.isAdmin,
          }
        fetch(`${url}/site-auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(postBody)
          }).then((response) => {
            // Response from WL server received— forward status to the client
            res.sendStatus(response.status)
          }).catch((error) => {
            // Something went wrong in our fetch— send a 404
            console.log(error)
            res.sendStatus(404)
          });
        }).catch((error) => {
            // We were not authenticated!
            console.log(error)
            res.sendStatus(403)
          })
})

app.use("/site-models", siteModels);

// Serve React build
app.use(express.static(__dirname + "/client/build"));

// Serve react app
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});