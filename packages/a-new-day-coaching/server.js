const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const SiteImageManager = require('./libraries/Server-Legos/siteImagesV2');
const SiteTextManager = require('./libraries/Server-Legos/siteTextV2');
const siteModels = require('./libraries/Server-Legos/siteModels');
const siteRules = require('./libraries/Server-Legos/siteRules');
const SiteAuthenticationManager = require('./libraries/Server-Legos/siteAuthV2');
const fileUpload = require('express-fileupload');

const SiteMailManager = require('./libraries/Server-Legos/siteMail.js');
const SiteFormManager = require('./libraries/Server-Legos/siteForms.js');

const serverKey = "ANDC"

// Init express application
const app = express();

// Allow for CORS and file upload
app.use(cors());
app.use(fileUpload());

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(3007, () => {
    console.log('Now listening on port ' + 3007);
});

// Serve static files
app.use(express.static(__dirname + "/static/"));

// BodyParser setup
app.use(bodyParser.json({ limit: "50mb"}));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));

// Server site text
const siteTextManager = new SiteTextManager(serverKey);
const siteTextRouter = siteTextManager.getRouter();
app.use("/site-text", siteTextRouter);

// Server site images
const siteImageManager = new SiteImageManager(serverKey);
const siteImageRouter = siteImageManager.getRouter();
app.use("/site-images", siteImageRouter);

// Server site mail
const siteMailManager = new SiteMailManager("joedobbelaar@gmail.com", process.env.ANDCEMAILPASSWORD);
const siteMailRouter = siteMailManager.getRouter();
app.use("/site-mail", siteMailRouter);

// Server site forms
const siteFormManager = new SiteFormManager(process.env.ANDCFORMKEY);
const siteFormRouter = siteFormManager.getRouter();
app.use("/site-forms", siteFormRouter);

// Server site models
app.use("/site-models", siteModels);
// Server site rules
app.use("/site-rules", siteRules);
// Server site mail
// app.use("/site-mail", siteMail);

// Server site authentication
const siteAuthenticationManager = new SiteAuthenticationManager(process.env.ANDCUSERKEY, serverKey);
const siteAuthenticationRouter = siteAuthenticationManager.getRouter();
app.use("/site-auth", siteAuthenticationRouter);

// Allow getting images
app.get("/images/*", (req, res) => {
    res.sendFile(__dirname + "static/" + req._parsedOriginalUrl.path);
})


// Allow post to /images, placing an image in the static folder
app.post("/images/*", (req, res) => {
    const targetPath = __dirname + "static/" + req._parsedUrl.path;
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