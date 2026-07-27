const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const db = require('./firebase.js');
require('dotenv').config();
const fileUpload = require('express-fileupload');

const siteModels = require("./libraries/Server-Legos/siteModels.js")
const siteText = require("./libraries/Server-Legos/siteText.js");
const siteImages = require("./libraries/Server-Legos/siteImages.js");
const siteRules = require("./libraries/Server-Legos/siteRules.js")
const SiteFormManager = require("./libraries/Server-Legos/siteForms.js")
const SiteAuthenticationManager = require("./libraries/Server-Legos/siteAuth.js")

// Init express application
const app = express();

// Allow for CORS and file upload
app.use(cors());
app.use(fileUpload());

/** Always up-to-date testimonial data from Firebase */
let testimonialData = [];
/** Always up-to-date class offering data from Firebase */
let offeringData = [];
/** Always up-to-date staff data from Firebase */
let staffData = [];

// On launch, fetch testimonial, offering, and staff data from Firebase
const testimonialCollectionRef = db.collection("testimonials");
testimonialCollectionRef.onSnapshot((data) => {
    console.log("Found updated testimonial data");
    testimonialData = []; // Clear data
    for (const doc of data.docs) {
        const dataWithId = doc.data();
        dataWithId["id"] = doc.id;
        testimonialData.push(dataWithId);
    }
})
const offeringCollectionRef = db.collection("offerings");
offeringCollectionRef.onSnapshot((data) => {
    console.log("Found updated class offering data");
    offeringData = []; // Clear data
    for (const doc of data.docs) {
        const dataWithId = doc.data();
        dataWithId["id"] = doc.id;
        offeringData.push(dataWithId);
    }
})
const staffCollectionRef = db.collection("staff");
staffCollectionRef.onSnapshot((data) => {
    console.log("Found updated staff data");
    staffData = []; // Clear data
    for (const doc of data.docs) {
        const dataWithId = doc.data();
        dataWithId["id"] = doc.id;
        staffData.push(dataWithId);
    }
})

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(3000, () => {
    console.log('Now listening on port ' + 3000);
});

// BodyParser setup
app.use(bodyParser.json({ limit: "50mb"}));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));

// Serve static files
app.use(express.static(__dirname + "/static/"));

// Server site text
app.use("/site-text", siteText);
// Server site images
app.use("/site-images", siteImages);
// Server site models
app.use("/site-models", siteModels);
// Server site rules
app.use("/site-rules", siteRules);
// Mail is handled by the site-mail microservice (see packages/site-mail)
// Server site forms
const siteFormManager = new SiteFormManager(process.env.BTBFORMKEY);
const siteFormRouter = siteFormManager.getRouter();
app.use("/site-forms", siteFormRouter);
// Server site authentication
const siteAuthenticationManager = new SiteAuthenticationManager(process.env.BTBUSERKEY);
const siteAuthenticationRouter = siteAuthenticationManager.getRouter();
app.use("/site-auth", siteAuthenticationRouter);

// Serve React build
app.use(express.static(__dirname + "/client/build"));

app.get("/testimonials", (req, res) => {
    console.log("Sending testimoninial data...")
    res.send(testimonialData);
})
app.get("/offerings", (req, res) => {
    console.log("Sending offering data...")
    res.send(offeringData);
})
app.get("/staff", (req, res) => {
    console.log("Sending staff data...")
    res.send(staffData);
})

app.get("/images/*", (req, res) => {
    res.sendFile(__dirname + req._parsedOriginalUrl.path);
})

app.post("/images/*", (req, res) => {
    const targetPath = __dirname + req._parsedUrl.path;
    fs.writeFile(targetPath, req.files.file.data, (err) => {
        if (err) {
            console.log(err);
            res.sendStatus(500)
        } else {
            res.sendStatus(200)
        }
    });
})

app.post("/delete-img", (req, res) => {
    const targetPath = __dirname + "/images/" + req._parsedUrl.query.substring(req._parsedUrl.query.indexOf("=") + 1)

    fs.rm(targetPath, (err) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    })
})


// Serve react app
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});