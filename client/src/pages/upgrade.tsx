import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, ArrowRight, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import PageTitle from "@/components/page-title";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

const tierFeatures = {
  free: {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    icon: <ArrowRight className="w-5 h-5" />,
    features: [
      { name: "Create up to 3 events", included: true },
      { name: "Basic event management", included: true },
      { name: "Standard email notifications", included: true },
      { name: "Community support", included: true },
      { name: "Custom branding", included: false },
      { name: "Analytics dashboard", included: false },
    ],
    priceId: null,
  },
  pro: {
    name: "Pro",
    price: "9.99",
    description: "For power users and small teams",
    icon: <Zap className="w-5 h-5" />,
    features: [
      { name: "Unlimited events", included: true },
      { name: "Advanced event management", included: true },
      { name: "Priority email notifications", included: true },
      { name: "Priority support", included: true },
      { name: "Basic analytics", included: true },
      { name: "Custom branding", included: false },
    ],
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  premium: {
    name: "Premium", 
    price: "19.99",
    description: "For businesses and organizations",
    icon: <Crown className="w-5 h-5" />,
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Custom branding", included: true },
      { name: "Advanced analytics", included: true },
      { name: "API access", included: true },
      { name: "24/7 phone support", included: true },
      { name: "Custom integrations", included: true },
    ],
    priceId: "price_premium", // Replace with your actual Stripe price ID
  },
};

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const getCurrentPlan = () => {
    if (!user) return "free";
    if (user.isPremium) return "premium";
    if (user.isPro) return "pro";
    return "free";
  };

  const currentPlan = getCurrentPlan();

  const handleUpgrade = async (plan: string) => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (plan === currentPlan) return;

    setSelectedPlan(plan);
    setUpgrading(true);

    try {
      const tier = tierFeatures[plan as keyof typeof tierFeatures];

      if (!tier.priceId) {
        // Handle downgrade to free
        const response = await apiRequest("GET", `/api/make-free/${user.username}`);
        const result = await response.json();

        if (result.success) {
          toast({
            title: "Plan Updated",
            description: "Successfully downgraded to Free plan",
            variant: "default",
          });
          setTimeout(() => window.location.reload(), 2000);
        }
        return;
      }

      // Create Stripe checkout session
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        priceId: tier.priceId,
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Upgrade Failed",
        description: "There was an error upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <PageTitle title="Plans" />

      <div className="max-w-5xl mx-auto mt-8 mb-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose the Right Plan for You</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful features to take your events to the next level with our premium plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {Object.entries(tierFeatures).map(([key, tier]) => {
            const isCurrent = currentPlan === key;
            const isDisabled = isCurrent || upgrading;

            return (
              <Card key={key} className={isCurrent ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tier.icon}
                      <CardTitle>{tier.name}</CardTitle>
                    </div>
                    {isCurrent && (
                      <Badge variant="default">Current Plan</Badge>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <Separator className="mb-4" />
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isDisabled}
                    onClick={() => handleUpgrade(key)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : upgrading
                      ? "Processing..."
                      : `Upgrade to ${tier.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}