const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const siteImages = require('./libraries/Server-Legos/siteImages');
const siteText = require('./libraries/Server-Legos/siteText');
const siteModels = require('./libraries/Server-Legos/siteModels');
const SiteAuthenticationManager = require('./libraries/Server-Legos/siteAuth');
const fileUpload = require('express-fileupload');

// Init express application
const app = express();

// Allow for CORS and file upload
app.use(cors());
app.use(fileUpload());

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(3003, () => {
    console.log('Now listening on port ' + 3003);
});

// Serve static files
app.use(express.static(__dirname + "/static/"));

// BodyParser setup
app.use(bodyParser.json({ limit: "50mb"}));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));

// Server site text
app.use("/site-text", siteText);
// Server site images
app.use("/site-images", siteImages);
// Server site models
app.use("/site-models", siteModels);
// Server site authentication
const siteAuthenticationManager = new SiteAuthenticationManager(process.env.YCDUSERKEY);
const siteAuthenticationRouter = siteAuthenticationManager.getRouter();
app.use("/site-auth", siteAuthenticationRouter);

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

// Serve React build
app.use(express.static(__dirname + "/client/build"));

// Serve react app
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});