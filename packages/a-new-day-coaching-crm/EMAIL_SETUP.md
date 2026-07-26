# Email Setup Guide for Invoice Notifications

This guide will help you configure email notifications for the invoice feature using either GoDaddy or Gmail.

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

### For GoDaddy Email:
```env
EMAIL_SERVICE=godaddy
EMAIL_USER=billing@yourdomain.com
EMAIL_PASS=your-email-password
```

### For Gmail with Domain Alias:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
DOMAIN_EMAIL=A New Day Coaching <billing@yourdomain.com>
```

## 📧 GoDaddy Email Setup

### Step 1: Create a Professional Email
1. Log into your GoDaddy account
2. Go to **Email & Office** → **Email**
3. Create a professional email like `billing@yourdomain.com`
4. Set a strong password

### Step 2: SMTP Settings
GoDaddy uses these SMTP settings (automatically configured):
- **Host:** `smtpout.secureserver.net`
- **Port:** `587`
- **Security:** STARTTLS
- **Authentication:** Required

### Step 3: Environment Configuration
```env
EMAIL_SERVICE=godaddy
EMAIL_USER=billing@yourdomain.com
EMAIL_PASS=your-actual-email-password
```

## 📧 Gmail + Domain Alias Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**

### Step 2: Create App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** and **Other (custom name)**
3. Enter "A New Day Coaching CRM"
4. Copy the generated 16-character password

### Step 3: Configure Gmail to Send From Your Domain
1. Go to **Gmail Settings** → **Accounts and Import**
2. In **"Send mail as"** → Click **"Add another email address"**
3. Add your domain email: `billing@yourdomain.com`
4. Choose **"Send through Gmail"**
5. Verify ownership (via forwarding or DNS)

### Step 4: Environment Configuration
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=generated-app-password
DOMAIN_EMAIL=A New Day Coaching <billing@yourdomain.com>
```

## 🚀 Testing the Setup

### 1. Restart the Server
After setting up your `.env` file:
```bash
npm run dev
# or restart your server
```

### 2. Test Email Invoice
1. Go to **Invoice Management**
2. Enter an email address that doesn't have a user account
3. Fill out invoice details and submit
4. You should see the modal asking to send as email
5. Click "Send Email Invoice"
6. Check for success/error notifications

### 3. Verify Email Delivery
- Check the recipient's inbox (including spam folder)
- The email should have the subject: "A New Day Coaching - Invoice #[number]"
- It should contain a "Click Here to Pay" button

## 🔍 Troubleshooting

### Common Issues:

#### "Email Failed" Notification
- **Check credentials:** Verify EMAIL_USER and EMAIL_PASS are correct
- **Check service:** Ensure EMAIL_SERVICE matches your provider
- **Check server logs:** Look for detailed error messages in console

#### Gmail Issues:
- **Use App Password:** Don't use your regular Gmail password
- **Enable 2FA:** App passwords require 2-factor authentication
- **Check "Less Secure Apps":** Shouldn't be needed with app passwords

#### GoDaddy Issues:
- **Verify email exists:** Make sure the email account is created in GoDaddy
- **Check password:** Use the actual email password, not your GoDaddy account password
- **Domain verification:** Ensure your domain is properly set up

#### Network Issues:
- **Firewall:** Ensure port 587 is open for outbound connections
- **Corporate networks:** Some networks block SMTP ports

## 📝 Email Template Customization

The email template is defined in `routes/invoices.js` in the `sendInvoiceEmail` function. You can customize:

- **Company branding**
- **Email styling**
- **Button colors**
- **Footer information**

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use app passwords** for Gmail instead of account passwords
3. **Regularly rotate passwords**
4. **Monitor email logs** for suspicious activity
5. **Use professional email addresses** (billing@yourdomain.com vs personal Gmail)

## 🎯 Recommended Setup

For professional use, we recommend:
1. **GoDaddy professional email** for better deliverability
2. **Domain-based email** (billing@yourdomain.com) for brand consistency
3. **Regular monitoring** of email delivery rates
4. **Backup email service** in case of provider issues

## 📞 Support

If you encounter issues:
1. Check the server console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email client first to verify credentials
4. Contact your email provider if authentication fails 