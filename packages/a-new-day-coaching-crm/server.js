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
const SiteMailManager = require('./libraries/Server-Legos/siteMail');
// const document = require('./routes/document');

// Init express application
const app = express();

// Init env files
dotenv.config();

// Initialize Server-Legos mail manager
const mailManager = new SiteMailManager(
    process.env.EMAIL_USER || 'your-email@gmail.com',
    process.env.EMAIL_PASS || 'your-app-password'
);

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
app.use("/mail", mailManager.getRouter())
// app.use("/document", document)

// Allow getting images
app.get("/images/*", (req, res) => {
    res.sendFile(__dirname + "static/" + req._parsedOriginalUrl.path);
})

// Serve React build
app.use(express.static(__dirname + "/client/build"));

// Serve react app
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});