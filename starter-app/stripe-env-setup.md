# Stripe Environment Setup

## Required Environment Variables

Add these to your `starter-app/apps/web/.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Your existing Supabase vars (don't change these)
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_supabase_anon_key
```

## How to Get These Values:

### 1. Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_`)
3. Add it as `STRIPE_SECRET_KEY`

### 2. Create Products and Price IDs
1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. **Create Pro Plan:**
   - Click "Add product"
   - Name: "Pro Plan"
   - Description: "Pro features for Yup.RSVP"
   - Pricing: Recurring, $9.99/month
   - Copy the **Price ID** (starts with `price_`) → use for `STRIPE_PRO_PRICE_ID`

3. **Create Premium Plan:**
   - Click "Add product"  
   - Name: "Premium Plan"
   - Description: "Premium features for Yup.RSVP"
   - Pricing: Recurring, $29.99/month
   - Copy the **Price ID** (starts with `price_`) → use for `STRIPE_PREMIUM_PRICE_ID`

### 3. Set Up Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL:** `http://localhost:3000/api/stripe/webhook` (for local dev)
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook secret** (starts with `whsec_`) → use for `STRIPE_WEBHOOK_SECRET`

## Test Payment Flow:

### 1. Start Development Server
```bash
cd starter-app/apps/web
pnpm dev
```

### 2. Test Upgrade
1. Go to `http://localhost:3000/upgrade`
2. Click "Upgrade to Pro" or "Upgrade to Premium"
3. Use test card: `4242 4242 4242 4242`
4. Any future date for expiry, any CVC

### 3. Expected Flow:
1. ✅ Redirects to Stripe Checkout
2. ✅ Complete payment with test card
3. ✅ Returns to success page
4. ✅ User plan updated in database
5. ✅ Access to Pro/Premium features

## Production Setup:
- Replace `sk_test_` with `sk_live_` keys
- Update webhook URL to your production domain
- Test with real payment methods

## Test Cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995` 