import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe Price IDs - these should be set in your environment variables
export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
} as const;

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  planType: 'pro' | 'premium';
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession({
  priceId,
  userId,
  planType,
  successUrl,
  cancelUrl
}: CreateCheckoutSessionParams) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      client_reference_id: userId,
      metadata: {
        userId,
        planType,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(customerId: string, returnUrl?: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
    });

    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

export async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const planType = session.metadata?.planType as 'pro' | 'premium';
  
  if (!userId || !planType) {
    throw new Error('Missing user ID or plan type in session metadata');
  }

  return {
    userId,
    planType,
    customerId: session.customer as string,
    subscriptionId: session.subscription as string,
  };
}

// Webhook signature verification
export function verifyWebhookSignature(body: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
} 