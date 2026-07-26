const express = require('express');
const router = express.Router();
require("dotenv").config()

const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

router.use(bodyParser.json());


const db = require('../firebase.js');

// const ids = {
//   '1': {
//     price_data: {
//       currency: "usd",
//       product_data: {
//         name: "One Dollar",
//       },
//       unit_amount: 100 // in cents
//     },
//     quantity: 1
//   }
// }

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

router.post("/", (req, res) => {

  try {
    
    const invoiceRef = db.collection("invoices-JD").doc(req.body.id)
    invoiceRef.get().then(async (doc) => {
      if (doc.exists) {
        // Invoice document is real

        const data = doc.data();
        console.log(data)
        const item = {
          price_data: {
            currency: "usd",
            product_data: {
              name: data.name,
            },
            unit_amount: data.unitAmount // in cents
          },
          quantity: data.quantity
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: "payment", // could be "subscription"
          success_url: "https://www.joed.dev/success",
          cancel_url: "https://www.joed.dev/cancel",
          line_items: [item]
        })
        res.json({session: session})

      } else {
        console.error("No such invoice!");
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });



  } catch (e) {
    res.status(500).json({error: e.message});
  }
})

module.exports = router;