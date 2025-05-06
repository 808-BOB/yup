import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const plan = params.get('plan');
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Check if Stripe is properly configured
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY && 
                             !!import.meta.env.VITE_STRIPE_PRO_PRICE_ID && 
                             !!import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;
  
  // Refresh user data to get updated subscription status
  useEffect(() => {
    const updateUser = async () => {
      if (user) {
        try {
          await refreshUser();
          setIsLoading(false);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    // If Stripe is not configured, we're just simulating success for development
    if (!isStripeConfigured) {
      setIsLoading(false);
      return;
    }

    // Add a slight delay to ensure the backend has processed the webhook
    const timer = setTimeout(() => {
      updateUser();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, refreshUser, isStripeConfigured]);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  // Generate plan-specific messages
  const getPlanTitle = () => {
    if (plan === 'pro') return 'Pro';
    if (plan === 'premium') return 'Premium';
    return 'Premium';
  };

  const getPlanDescription = () => {
    if (plan === 'pro') {
      return 'You now have access to unlimited events and advanced analytics.';
    }
    if (plan === 'premium') {
      return 'You now have access to all premium features including custom branding and white-label events.';
    }
    return 'Your subscription has been activated.';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
      <Header />
      
      <main className="flex-1 overflow-auto mb-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold mb-6">Subscription Activated</h1>
          
          <Card className="bg-gray-900 border border-gray-800 mb-6">
            <CardHeader className="text-center pb-2">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <CardTitle className="text-xl">
                Welcome to Yup.RSVP {getPlanTitle()}!
              </CardTitle>
            </CardHeader>
            
            <Separator className="bg-gray-800" />
            
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <p className="text-gray-300 mb-4">
                  {getPlanDescription()}
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Your subscription is now active and ready to use.
                </p>
                
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    onClick={() => setLocation('/events/new')}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Create New Event
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/profile')}
                    className="w-full bg-transparent border-gray-700 hover:bg-gray-800"
                  >
                    Go to Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Your Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(plan === 'pro' || plan === 'premium') && (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Unlimited events</span>
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
                )}
                
                {plan === 'premium' && (
                  <>
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