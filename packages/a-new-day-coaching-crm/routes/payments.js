const express = require('express');
const router = express.Router();
require("dotenv").config()

const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

router.use(bodyParser.json());

const db = require('../firebase.js');
const { getInvoiceById } = require('./invoices.js');

router.get("/getInvoiceById" , (req, res) => {
  console.log(req.query.id)
  const invoiceRef = db.collection("invoices-JD").doc(req.query.id)
  invoiceRef.get().then((doc) => {
    if (doc.exists) {
      res.json(doc.data())
    } else {
      console.error("No such invoice!");
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
  });
})

router.post("/", async (req, res) => {

  const invoice = getInvoiceById(req.body.id);
  if (!invoice) { return res.status(404).json({error: "Invoice not found"}); }

  const item = {
    price_data: {
      currency: "usd",
      product_data: {
        name: `A New Day Coaching Invoice #${invoice.invoiceNumber}`,
      },
      unit_amount: invoice.amount * 100 // in cents
    },
    quantity: 1
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: "payment", // could be "subscription"
    success_url: `https://www.bluprint.anewdaycoaching.com/invoices/stripe-complete?id=${req.body.id}`,
    cancel_url: "https://www.bluprint.anewdaycoaching.com/#invoices",
    line_items: [item],
    
  })
  res.json({session: session})
})

module.exports = router;