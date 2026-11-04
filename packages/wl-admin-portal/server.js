const fetch = require('node-fetch')

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const siteModels = require('./adminSiteModels');
const { mountLiveness } = require('./libraries/Server-Legos/siteHealth');
const { umamiShellHit } = require('./libraries/Server-Legos/siteUmami');

const fileUpload = require('express-fileupload');


const {db, auth} = require("./firebase")

// Init express application
const app = express();
mountLiveness(app, "wl-admin-portal");

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
 * Site permissions live in the shared wl-auth service (packages/wl-auth) now. The
 * sites themselves became static SPAs in the August migration, so the old
 * https://www.<site>/site-auth URLs just return the site's index.html.
 */
const AUTH_SITES = {
    BTB: { slug: "beyond-the-bell", keyEnv: "BTBUSERKEY" },
    YCD: { slug: "you-can-do-it-gardening", keyEnv: "YCDUSERKEY" },
};

/** fetch() against wl-auth's /site-auth for one site, with wl-auth's API key. */
function siteAuthFetch(site, query, init = {}) {
    const base = (process.env.WL_AUTH_URL || "https://wl-auth.joed.dev").replace(/\/$/, "");
    return fetch(`${base}/site-auth${query}`, {
        ...init,
        headers: {
            ...(init.headers || {}),
            "Authorization": `Bearer ${process.env.WL_AUTH_API_KEY || ""}`,
            "X-WL-Site": site.slug,
        },
    });
}

/**
 * Allow users to securely request user information. This cannot be done form the client becuase we must keep environment variables secret.
 */
app.get("/external-users", (req, res) => {
    // Harvest siteId and user accessToken from query
    const site = AUTH_SITES[req.query.siteId];
    const accessToken = req.query.accessToken;
    // Validate that this GET request is coming from an authenticated user
    auth.verifyIdToken(accessToken).then(decodedToken => {
        // TODO: Before this fetch, scrape AvailableSites to make sure this user has access to the requested user deck
        if (!site) {
            // Site is not valid— send 404
            res.sendStatus(404)
            return;
        }
        const secret = process.env[site.keyEnv];
        siteAuthFetch(site, `?key=${encodeURIComponent(secret || "")}`).then(externalRes => {
            if (!externalRes.ok) {
                console.log(`wl-auth returned ${externalRes.status} listing ${site.slug} users`)
                res.sendStatus(externalRes.status)
                return;
            }
            // Send JSON response w/ site's users to the client
            return externalRes.json().then(json => {
                res.json(json);
            })
        }).catch(error => {
            // Something went wrong in our fetch— send a 404
            console.log(error)
            res.sendStatus(404)
        })
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
        const site = AUTH_SITES[req.body.siteId];
        // TODO: Before this fetch, scrape AvailableSites to make sure this user has access to the requested user deck
        if (!site) {
            res.sendStatus(404)
            return;
        }
        // Build the post body and send it to wl-auth's /site-auth endpoint
        const postBody = {
            key: process.env[site.keyEnv],
            email: req.body.email,
            field: req.body.field,
            value: req.body.value,
            isAdmin: req.body.isAdmin,
          }
        siteAuthFetch(site, "", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(postBody)
          }).then((response) => {
            // Response from wl-auth received— forward status to the client
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
app.get("*", umamiShellHit, (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});