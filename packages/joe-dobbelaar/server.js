const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const payments = require('./routes/payments');
const fileUpload = require('express-fileupload');

// Init express application
const app = express();

// Allow for CORS and file upload
app.use(cors());
app.use(fileUpload());

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(3002, () => {
    console.log('Now listening on port ' + 3002);
});

// Serve static files
app.use(express.static(__dirname + "/static/"));

app.use("/payments", payments)

// Allow getting images
app.get("/images/*", (req, res) => {
    res.sendFile(__dirname + "static/" + req._parsedOriginalUrl.path);
})

app.get("/resume", (req, res) => {
    res.sendFile(__dirname + "/static/JoeDobbelaarResume.pdf");

    // const light = req.query["light"] === "true" ? true : false;

    // if (light) {
    //     res.sendFile(__dirname + "/static/JoeDobbelaarResumeLight.pdf");
    // } else {
    // }
})

app.use(bodyParser.json());
app.post("/ping", (req, res) => {
    console.log("Ping received");
    console.log(req.body)
    res.send("Pong!");
})

// // Allow post to /images, placing an image in the static folder
// app.post("/images/*", (req, res) => {
//     const targetPath = __dirname + "static/" + req._parsedUrl.path;
//     fs.writeFile(targetPath, req.files.file.data, (err) => {
//         if (err) {
//             console.log(err);
//             res.sendStatus(500)
//         } else {
//             res.sendStatus(200)
//         }
//     });
// })

// app.post("/delete-img", (req, res) => {
//     const targetPath = __dirname + "/images/" + req._parsedUrl.query.substring(req._parsedUrl.query.indexOf("=") + 1)

//     fs.rm(targetPath, (err) => {
//         if (err) {
//             console.log(err);
//             res.sendStatus(500);
//         } else {
//             res.sendStatus(200);
//         }
//     })
// })

// Serve React build
app.use(express.static(__dirname + "/client/build"));

// Serve react app
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});