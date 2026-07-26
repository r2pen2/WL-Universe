const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const db = require('../firebase');
const { getUser, getAllUsers, setUser } = require('./users');
const nodemailer = require('nodemailer');

router.use(bodyParser.json());

// Email configuration using Server-Legos pattern
const emailConfig = {
  email: process.env.EMAIL_USER || 'your-email@gmail.com',
  password: process.env.EMAIL_PASS || 'your-app-password'
};

let allInvoices = {};

/** Update invoices when a change is detected */
db.collection("invoices").onSnapshot((querySnapshot) => {
  allInvoices = {};
  querySnapshot.forEach((doc) => {
    allInvoices[doc.id] = doc.data();
    allInvoices[doc.id].id = doc.id;
  });
});

router.get("/", (req, res) => {
  const userId = req.query.userId;
  if (!userId) { res.send("Error: No userId provided"); return; }
  const user = getUser(userId);
  if (!user) { res.send("Error: User not found"); return; }

  const retInvoices = Object.values(allInvoices).filter(invoice => user.invoices.includes(invoice.id));
  res.json(retInvoices);
});

// Get invoice by ID (for email links)
router.get("/by-id/:id", (req, res) => {
  const invoiceId = req.params.id;
  const invoice = allInvoices[invoiceId];
  
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  
  // Return invoice with user display name if assigned
  if (invoice.assignedTo) {
    const user = getUser(invoice.assignedTo);
    if (user) {
      invoice.userDisplayName = user.personalData.displayName;
    }
  }
  
  res.json(invoice);
});

router.get("/limbo", (req, res) => {
  const limboInvoices = Object.values(allInvoices).filter(invoice => invoice.limbo);
  for (const invoice of limboInvoices) {
    invoice.userDisplayName = getUser(invoice.assignedTo).personalData.displayName;
  }
  res.json(limboInvoices);
})

router.get("/unpaid", (req, res) => {
  const unpaidInvoices = Object.values(allInvoices).filter(invoice => !invoice.paid && !invoice.paidAt);
  for (const invoice of unpaidInvoices) {
    invoice.userDisplayName = getUser(invoice.assignedTo).personalData.displayName;
  }
  res.json(unpaidInvoices);
})

router.get("/paid", (req, res) => {
  const paidInvoices = Object.values(allInvoices).filter(invoice => invoice.paid);
  for (const invoice of paidInvoices) {
    invoice.userDisplayName = getUser(invoice.assignedTo).personalData.displayName;
  }
  res.json(paidInvoices);
})

router.post("/limbo", (req, res) => {
  const action = req.body.action;
  const invoiceId = req.body.id;
  const invoice = allInvoices[invoiceId];
  if (!invoice) { res.send("Error: Invoice not found"); return; }
  if (action === "accept") {
    invoice.paid = true;
    // Lower num unpaid invoices
    const user = getUser(invoice.assignedTo);
    user.numUnpaidInvoices--;
    setUser(user)
  } else {
    invoice.paid = false;
    invoice.paidAt = null;
  }
  invoice.limbo = null;
  setInvoice(invoice).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });
})

// Function to send invoice email using Server-Legos
async function sendInvoiceEmail(recipientEmail, invoiceId, amount, invoiceNumber) {
  const paymentUrl = `https://www.bluprint.anewdaycoaching.com/#invoices?invoice=${invoiceId}`;
  
  const emailText = `
A New Day Coaching - Invoice #${invoiceNumber}

You have received an invoice for $${amount}.

Click the link below to view and pay your invoice:
${paymentUrl}

If you don't have an account yet, you'll be prompted to create one to view your invoice.

If you have any questions, please contact us at billing@anewdaycoaching.com
  `;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">A New Day Coaching</h2>
      <h3>Invoice #${invoiceNumber}</h3>
      <p>You have received an invoice for <strong>$${amount}</strong>.</p>
      <p>Click the button below to view and pay your invoice:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${paymentUrl}" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Click Here to Pay</a>
      </div>
      <p style="color: #666; font-size: 14px;">If you don't have an account yet, you'll be prompted to create one to view your invoice.</p>
      <p style="color: #666; font-size: 12px;">If you have any questions, please contact us at billing@anewdaycoaching.com</p>
    </div>
  `;

  try {
    // Use the Server-Legos mail manager
    return await sendEmailWithMailManager(recipientEmail, `A New Day Coaching - Invoice #${invoiceNumber}`, emailText, emailHtml);
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Helper function to send email using Server-Legos pattern
function sendEmailWithMailManager(toAddress, subject, text, html) {
  return new Promise((resolve, reject) => {
    // Using the same pattern as Server-Legos SiteMailManager
    const transporterConfig = process.env.EMAIL_SERVICE === 'godaddy' ? {
      host: 'smtpout.secureserver.net',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    } : {
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    };
    
    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Use domain email as "from" address, but Gmail credentials for sending
    const fromAddress = process.env.DOMAIN_EMAIL || `A New Day Coaching <${emailConfig.email}>`;
    
    const mailOptions = {
      from: fromAddress,
      to: toAddress,
      subject: subject,
      text: text,
      html: html
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('Email error:', error);
        resolve(false);
      } else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
}

router.post("/create", (req, res) => {
  const invoice = req.body.invoice;
  const recipientEmail = req.body.recipientEmail; // New field for email-only invoices

  // Check if this is an email-only invoice (no user assigned yet)
  if (!invoice.assignedTo && recipientEmail) {
    // Create invoice without user assignment
    invoice.assignedTo = null;
    invoice.recipientEmail = recipientEmail;
    
    if (invoice.invoiceNumber === -1) {
      // Generate a unique invoice number based on total invoices
      invoice.invoiceNumber = Object.keys(allInvoices).length + 1;
    }
    
    db.collection("invoices").add(invoice).then(async (ref) => {
      const invoiceId = ref.id;
      
      // Send email notification
      const emailSent = await sendInvoiceEmail(recipientEmail, invoiceId, invoice.amount, invoice.invoiceNumber);
      
      res.json({ 
        success: true, 
        id: invoiceId, 
        emailSent: emailSent,
        message: emailSent ? 'Invoice created and email sent successfully' : 'Invoice created but email failed to send'
      });
    }).catch((error) => {
      console.error(error);
      res.json({ success: false });
    });
    
  } else if (invoice.assignedTo) {
    // Existing flow for user-assigned invoices
    const user = getUser(invoice.assignedTo);
    user.numUnpaidInvoices++;
    if (invoice.invoiceNumber === -1) {
      invoice.invoiceNumber = user.invoices.length + 1;
    }
    db.collection("invoices").add(invoice).then(async (ref) => {
      // We have a ref to the invoice
      const invoiceId = ref.id;
      user.invoices.push(invoiceId);
      
      // Send email if user has email notification enabled
      let emailSent = false;
      if (user.settings?.invoices?.newInvoiceEmailNotification && user.personalData?.email) {
        emailSent = await sendInvoiceEmail(user.personalData.email, invoiceId, invoice.amount, invoice.invoiceNumber);
      }
      
      setUser(user).then(() => {
        res.json({ success: true, id: invoiceId, emailSent: emailSent });
      }).catch((error) => {
        console.error(error);
        res.json({ success: false });
      });
    }).catch((error) => {
      console.error(error);
      res.json({ success: false });
    });
  } else {
    res.json({ success: false, error: 'Either assignedTo user ID or recipientEmail must be provided' });
  }
})

router.post("/update", (req, res) => {
  setInvoice(req.body.invoice).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });
})

router.post("/delete", (req, res) => {
  const invoice = req.body.invoice;
  const user = getUser(invoice.assignedTo);
  user.numUnpaidInvoices--;
  setUser(user).then(() => {
    db.collection("invoices").doc(invoice.id).delete().then(() => {
      res.json({ success: true });
    }).catch((error) => {
      console.error(error);
      res.json({ success: false });
    });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false });
  });
})

// Link invoice to user (when user creates account from email)
router.post("/link-to-user", (req, res) => {
  const { invoiceId, userId } = req.body;
  
  if (!invoiceId || !userId) {
    res.json({ success: false, error: 'Invoice ID and User ID are required' });
    return;
  }
  
  const invoice = allInvoices[invoiceId];
  const user = getUser(userId);
  
  if (!invoice) {
    res.json({ success: false, error: 'Invoice not found' });
    return;
  }
  
  if (!user) {
    res.json({ success: false, error: 'User not found' });
    return;
  }
  
  // Check if invoice email matches user email (security check)
  if (invoice.recipientEmail && invoice.recipientEmail.toLowerCase() !== user.personalData.email.toLowerCase()) {
    res.json({ success: false, error: 'Email mismatch' });
    return;
  }
  
  // Link the invoice to the user
  invoice.assignedTo = userId;
  user.invoices.push(invoiceId);
  user.numUnpaidInvoices++;
  
  // Remove the recipientEmail field since it's now assigned
  delete invoice.recipientEmail;
  
  Promise.all([setInvoice(invoice), setUser(user)]).then(() => {
    res.json({ success: true });
  }).catch((error) => {
    console.error(error);
    res.json({ success: false, error: 'Failed to link invoice' });
  });
});

router.get("/stripe-complete", (req, res) => {
  const invoiceId = req.query.id;
  const invoice = allInvoices[invoiceId];
  if (!invoice) { res.send("Error: Invoice not found"); return; }
  invoice.paid = true;
  invoice.paidAt = new Date();
  invoice.paidAt = getOrthodoxDate(invoice.paidAt).toString();
  setInvoice(invoice).then(() => {
    res.redirect("https://www.bluprint.anewdaycoaching.com/#thanks");
  }).catch((error) => {
    console.error(error);
    res.send("Error");
  });
})

function getAllInvoices() { return allInvoices }
function getInvoiceById(id) { return allInvoices[id] }
async function setInvoice(invoice) { return new Promise((resolve, reject) => { db.collection("invoices").doc(invoice.id).set(invoice).then((ref) => { resolve(ref); }).catch((error) => { reject(error); }); }) }

module.exports = { router, getAllInvoices, getInvoiceById, setInvoice };

function getOrthodoxDate(date) {
  if(date["nanoseconds"] !== undefined && date["seconds"] !== undefined) {
    return new Date(date["seconds"] * 1000 + date["nanoseconds"] / 1000000)
  }
  if(date["_nanoseconds"] !== undefined && date["_seconds"] !== undefined) {
    return new Date(date["_seconds"] * 1000 + date["_nanoseconds"] / 1000000)
  }
  return !date.toDate ? date : date.toDate()
}