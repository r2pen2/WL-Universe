const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const payments = require('./routes/payments');
const calendar = require('./routes/calendar');
const forms = require("./routes/forms");
const { router: tools } = require('./routes/tools');
const { router: users } = require('./routes/users');
const { router: invoices } = require('./routes/invoices');
const { mountLiveness } = require('./libraries/Server-Legos/siteHealth');
const { umamiShellHit } = require('./libraries/Server-Legos/siteUmami');

// const document = require('./routes/document');

// Init express application
const app = express();
mountLiveness(app, "a-new-day-coaching-crm");

// Init env files
dotenv.config();

// Start listening on defined port
app.listen(3008, () => {
    console.log('Now listening on port ' + 3008);
});

// Cors
app.use(cors());

// Serve static files
app.use(express.static(__dirname + "/static/"));

// BodyParser setup
app.use(bodyParser.json({ limit: "50mb"}));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));

app.use("/payments", payments)
app.use("/calendar", calendar)
app.use("/forms", forms)
app.use("/tools", tools)
app.use("/users", users)
app.use("/invoices", invoices)
// Mail is handled by the site-mail microservice (SITE_MAIL_URL)
// app.use("/document", document)

// Allow getting images
app.get("/images/*", (req, res) => {
    res.sendFile(__dirname + "static/" + req._parsedOriginalUrl.path);
})

// Serve React build
app.use(express.static(__dirname + "/client/build"));

// Serve react app
app.get("*", umamiShellHit, (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});