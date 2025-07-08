# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for your Yup.RSVP application.

## Prerequisites

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your Stripe API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

## Step 1: Environment Variables

Add these environment variables to your `starter-app/apps/web/.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# App Configuration (update with your domain)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 2: Create Stripe Products and Prices

1. **Log into your Stripe Dashboard**
2. **Navigate to Products** (https://dashboard.stripe.com/products)
3. **Create Pro Plan**:
   - Click "Add product"
   - Name: "Pro Plan"
   - Description: "Pro features for Yup.RSVP"
   - Pricing model: "Recurring"
   - Price: $9.99
   - Billing period: Monthly
   - Copy the Price ID (starts with `price_`) and use it for `STRIPE_PRO_PRICE_ID`

4. **Create Premium Plan**:
   - Click "Add product"
   - Name: "Premium Plan"
   - Description: "Premium features for Yup.RSVP"
   - Pricing model: "Recurring"
   - Price: $29.99
   - Billing period: Monthly
   - Copy the Price ID (starts with `price_`) and use it for `STRIPE_PREMIUM_PRICE_ID`

## Step 3: Set Up Webhooks

1. **Navigate to Webhooks** in your Stripe Dashboard (https://dashboard.stripe.com/webhooks)
2. **Click "Add endpoint"**
3. **Set the endpoint URL**: `https://your-domain.com/api/stripe/webhook`
   - For local development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
4. **Select events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copy the webhook signing secret** (starts with `whsec_`) and use it for `STRIPE_WEBHOOK_SECRET`

## Step 4: Local Development with ngrok (Required for Webhooks)

Since Stripe webhooks need a public URL, you'll need to use ngrok for local development:

1. **Install ngrok**: Visit [ngrok.com](https://ngrok.com) and follow installation instructions
2. **Start your Next.js app**: `pnpm dev`
3. **In another terminal, start ngrok**: `ngrok http 3001`
4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)
5. **Update your Stripe webhook endpoint** to use the ngrok URL
6. **Update your environment variable**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

## Step 5: Test the Integration

1. **Start your development server**: `pnpm dev`
2. **Navigate to** `/upgrade` in your browser
3. **Click on "Upgrade to Pro" or "Upgrade to Premium"**
4. **Complete the test payment** using Stripe's test card: `4242 4242 4242 4242`
5. **Verify the user's status is updated** in your database

## Test Credit Cards

Use these test card numbers for development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Expired card**: `4000 0000 0000 0069`

Use any valid future date for expiration and any 3-digit CVC.

## Production Deployment

1. **Switch to live API keys** in production
2. **Update webhook endpoint** to your production domain
3. **Set production environment variables** in Vercel or your hosting platform
4. **Test with real payment methods**

## Troubleshooting

### Common Issues:

1. **"Price ID not configured"**: Make sure your `STRIPE_PRO_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` are correct
2. **Webhook signature verification failed**: Ensure your `STRIPE_WEBHOOK_SECRET` is correct
3. **User status not updating**: Check your webhook endpoint is receiving events and processing them correctly

### Debug Steps:

1. **Check the browser console** for any client-side errors
2. **Check your server logs** for API errors
3. **Check Stripe Dashboard > Events** to see if webhooks are being delivered
4. **Use Stripe CLI** for webhook testing: `stripe listen --forward-to localhost:3001/api/stripe/webhook`

## Security Notes

- **Never expose your secret key** in client-side code
- **Always verify webhook signatures** (this is implemented in the webhook handler)
- **Use HTTPS in production** for all webhook endpoints
- **Keep your API keys secure** and rotate them regularly

## Support

If you encounter issues:
1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Review the webhook logs in your Stripe Dashboard
3. Check the Next.js console for any errors 