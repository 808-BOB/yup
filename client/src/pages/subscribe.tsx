import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
import { Stripe } from '@stripe/stripe-js';
let stripePromise: Promise<Stripe | null> | null = null;
if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
}

const SubscribeForm = ({ priceId, plan }: { priceId: string, plan: 'pro' | 'premium' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success?plan=${plan}`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-primary/30 rounded-lg p-6 bg-black/20">
        <PaymentElement />
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setLocation('/upgrade')}
          className="bg-transparent border-gray-700 hover:bg-gray-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading} 
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? "Processing..." : `Subscribe to ${plan === 'pro' ? 'Pro' : 'Premium'}`}
        </Button>
      </div>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { plan } = useParams<{ plan: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check if Stripe is properly configured
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY && 
                             !!import.meta.env.VITE_STRIPE_PRO_PRICE_ID && 
                             !!import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;

  // Handle invalid plan parameter
  useEffect(() => {
    if (plan !== 'pro' && plan !== 'premium') {
      setLocation('/upgrade');
    }
  }, [plan, setLocation]);

  // Get price ID based on plan
  const getPriceId = () => {
    if (plan === 'pro') {
      return import.meta.env.VITE_STRIPE_PRO_PRICE_ID;
    } else if (plan === 'premium') {
      return import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;
    }
    return '';
  };

  useEffect(() => {
    // Early return if no user
    if (!user) return;
    
    const priceId = getPriceId();
    if (!priceId) {
      setError("Price ID not found. Please try again.");
      setIsLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-checkout-session", { priceId })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create checkout session');
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error creating checkout session:', err);
        setError("Failed to initialize payment. Please try again.");
        setIsLoading(false);
        
        toast({
          title: "Error",
          description: "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [user, plan, toast]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
      <Header />
      
      <main className="flex-1 overflow-auto mb-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold mb-6">
            Subscribe to {plan === 'pro' ? 'Pro' : 'Premium'}
          </h1>
          
          <Card className="bg-gray-900 border border-gray-800 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                {plan === 'pro' ? 'Pro Plan' : 'Premium Plan'} Subscription
              </CardTitle>
              <CardDescription className="text-gray-400">
                {plan === 'pro' 
                  ? 'Unlock unlimited events and analytics' 
                  : 'Get full white-label customization and branding'}
              </CardDescription>
            </CardHeader>
            
            <Separator className="bg-gray-800" />
            
            <CardContent className="pt-6">
              {!isStripeConfigured ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Stripe Not Configured</h3>
                  <p className="text-gray-400 mb-4">
                    The payment system is currently being set up. Please check back later.
                  </p>
                  <Button onClick={() => setLocation('/upgrade')}>
                    Return to Plans
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Payment Error</h3>
                  <p className="text-gray-400 mb-4">{error}</p>
                  <Button onClick={() => setLocation('/upgrade')}>
                    Return to Plans
                  </Button>
                </div>
              ) : (
                clientSecret && stripePromise && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SubscribeForm priceId={getPriceId()} plan={plan as 'pro' | 'premium'} />
                  </Elements>
                )
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Subscription Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan === 'pro' ? (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited events (Free tier limited to 3)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Advanced event analytics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>All Pro features included</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>White-label event pages</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom branding colors</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Custom logo upload</span>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}