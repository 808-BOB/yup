# SendGrid Email Integration Setup

## 🎯 Overview
This guide shows how to integrate your verified SendGrid sender with the Yup.RSVP event invitation system.

## 📧 Your Verified Sender
Based on your SendGrid dashboard:
- **Sender Email**: `no-reply@yup.rsvp`
- **Sender Name**: `Subourbon` (can be customized)
- **Status**: ✅ Verified

## 🔧 Environment Variables Needed

Add these to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=no-reply@yup.rsvp
SENDGRID_FROM_NAME=Yup.RSVP

# Optional: Fallback to Nodemailer (if SendGrid fails)
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 📦 Install SendGrid Package

```bash
cd starter-app
pnpm add @sendgrid/mail
```

## 🎯 How It Works

### **1. Event Invitations**
- Uses your verified `no-reply@yup.rsvp` sender
- Supports custom branding for Premium users
- Automatic template replacement (event name, date, RSVP link)

### **2. Email Templates**
- **Free/Pro Users**: Standard Yup.RSVP branding
- **Premium Users**: Custom colors, logos, and branding

### **3. Deliverability Benefits**
- ✅ **Verified sender**: Better inbox delivery
- ✅ **Domain reputation**: Using your own domain
- ✅ **SendGrid reliability**: Enterprise email service
- ✅ **Tracking**: Message IDs for delivery tracking

## 🚀 Next Steps

1. **Get your SendGrid API key** from dashboard
2. **Add environment variables** to your `.env` file
3. **Install the package**: `pnpm add @sendgrid/mail`
4. **Test email sending** using the event share feature

## 🔍 Testing

After setup, test by:
1. Creating an event
2. Clicking "Share" → "Email"
3. Adding recipient emails
4. Sending invitations

Check SendGrid dashboard for delivery statistics and any issues.
