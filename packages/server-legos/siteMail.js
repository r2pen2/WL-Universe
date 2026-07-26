const express = require('express');

const nodemailer = require('nodemailer');


class SiteMailManager {

  constructor(fromAddress, fromPassword) {
    this.password = fromPassword;
    this.email = fromAddress;
  }

  initialize() {
    this.router = express.Router();
    this.router.post("/", (req, res) => {
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.email,
          pass: this.password
        }
      });
      var mailOptions = {
        from: `joed.dev Forms <forms@joed.dev>`,
        to: req.body.toAddress,
        subject: req.body.subject,
        text: req.body.text
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    })
  }

  getRouter() {
    this.initialize();
    return this.router;
  }
}

module.exports = SiteMailManager;
