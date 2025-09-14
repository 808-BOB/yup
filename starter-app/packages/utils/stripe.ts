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
  cancelUrl,
  customerId,
  customerEmail
}: CreateCheckoutSessionParams & { customerId?: string; customerEmail?: string }) {
  try {
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `https://${process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000'}/upgrade/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: cancelUrl || `https://${process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000'}/upgrade`,
      client_reference_id: userId,
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
        },
      },
      // Prevent multiple subscriptions
      allow_promotion_codes: false,
    };

    // Use existing customer if provided, otherwise create new one
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
  } catch (error: any) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

// Check for and cancel duplicate subscriptions for a customer
export async function ensureSingleSubscription(customerId: string, keepSubscriptionId?: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    if (subscriptions.data.length <= 1) {
      return { success: true, cancelledCount: 0 };
    }

    // If we have multiple active subscriptions, cancel all except the one we want to keep
    let cancelledCount = 0;
    
    for (const subscription of subscriptions.data) {
      if (keepSubscriptionId && subscription.id === keepSubscriptionId) {
        continue; // Keep this one
      }
      
      // Cancel older subscriptions or all if no specific one to keep
      if (!keepSubscriptionId || subscription.id !== keepSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscription.id);
          cancelledCount++;
          console.log(`Cancelled duplicate subscription: ${subscription.id}`);
        } catch (error) {
          console.error(`Failed to cancel subscription ${subscription.id}:`, error);
        }
      }
    }

    return { success: true, cancelledCount };
  } catch (error: any) {
    console.error('Error ensuring single subscription:', error);
    return { success: false, error: error.message, cancelledCount: 0 };
  }
}

// Get active subscription for a customer
export async function getActiveSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error('Error getting active subscription:', error);
    return null;
  }
} 