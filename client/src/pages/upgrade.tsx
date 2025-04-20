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

// Define the features for each tier
const tierFeatures = {
  free: {
    title: "Free",
    description: "Perfect for casual events",
    price: "$0",
    period: "forever",
    features: [
      { name: "Create up to 2 events per month", included: true },
      { name: "Up to 75 RSVPs per event", included: true },
      { name: "Basic event customization", included: true },
      { name: "Basic RSVP form (name + email)", included: true },
      { name: "Yup/Nope/Maybe responses", included: true },
      { name: "Guest list export (CSV)", included: true },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "Calendar integration", included: false },
      { name: "Reminders & follow-ups", included: false },
      { name: "SMS notifications", included: false },
      { name: "Custom branding", included: false },
    ],
    ctaText: "Current Plan",
    ctaDisabled: true,
    highlight: false,
  },
  pro: {
    title: "Pro",
    description: "For power users and small businesses",
    price: "$5",
    period: "per month",
    features: [
      { name: "Unlimited events", included: true },
      { name: "Up to 1,000 RSVPs per event", included: true },
      { name: "Logo + brand color customization", included: true },
      { name: "Advanced RSVP fields (+1s, preferences)", included: true },
      { name: "Email & SMS reminders", included: true },
      { name: "Calendar integration", included: true },
      { name: "RSVP auto-close feature", included: true },
      { name: "Enhanced analytics dashboard", included: true },
      { name: "Remove YUP.rsvp branding", included: true },
      { name: "Email support", included: true },
      { name: "Custom subdomain (add-on)", included: true },
      { name: "White-labeling", included: false },
    ],
    ctaText: "Upgrade to Pro",
    ctaDisabled: false,
    highlight: false,
  },
  premium: {
    title: "Premium",
    description: "Complete white-label solution",
    price: "$25",
    period: "per month",
    features: [
      { name: "Everything in Pro, plus:", included: true },
      { name: "5,000+ RSVPs per event", included: true },
      { name: "Full branding customization", included: true },
      { name: "Fully customizable RSVP forms", included: true },
      { name: "Higher SMS notification limits", included: true },
      { name: "Complete white-labeling", included: true },
      { name: "Custom domain support", included: true },
      { name: "Full analytics & guest behavior", included: true },
      { name: "Replace with your branding", included: true },
      { name: "Custom subdomain included", included: true },
      { name: "Priority dedicated support", included: true },
      { name: "Agency-ready features", included: true },
    ],
    ctaText: "Upgrade to Premium",
    ctaDisabled: false,
    highlight: true,
  },
};

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleActionClick = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    return handleUpgrade;
  };

  // Determine current plan
  const getCurrentPlan = () => {
    if (user.isPremium) return "premium";
    if (user.isPro) return "pro";
    return "free";
  };

  const currentPlan = getCurrentPlan();

  // Handle plan upgrade
  const handleUpgrade = async (plan: string) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
    setUpgrading(true);

    try {
      // This is just for demonstration, in a real app this would connect to a payment processor
      // We're using our test endpoints for now
      let endpoint = "";

      if (plan === "premium") {
        endpoint = `/api/make-premium/${user.username}`;
      } else if (plan === "pro") {
        endpoint = `/api/make-pro/${user.username}`;
      } else {
        endpoint = `/api/make-free/${user.username}`;
      }

      const response = await apiRequest("GET", endpoint);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "✨ Upgrade Successful!",
          description: result.message || `You are now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`,
          variant: "default",
        });

        // Refresh the page after a short delay to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to upgrade plan");
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
              <Card 
                key={key} 
                className={`flex flex-col h-full transition-all ${
                  tier.highlight 
                    ? "border-primary shadow-md shadow-primary/20" 
                    : ""
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="text-2xl font-bold">
                      {tier.title}
                    </CardTitle>
                    {tier.highlight && (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="border-primary text-primary">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {tier.period}
                    </span>
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
                        <span 
                          className={feature.included ? "" : "text-muted-foreground"}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan !== key && currentPlan !== 'free' && key === 'free' && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      Taking a break? No worries! Your premium features will be waiting when you're ready to upgrade again.
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    onClick={() => handleUpgrade(key)}
                    disabled={isDisabled}
                    className={`w-full ${
                      tier.highlight && !isDisabled 
                        ? "bg-primary hover:bg-primary/90" 
                        : ""
                    }`}
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    {upgrading && selectedPlan === key ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Processing...
                      </span>
                    ) : isCurrent ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Current Plan
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {key === "premium" ? (
                          <Crown className="h-4 w-4" />
                        ) : key === "pro" ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        {tier.ctaText}
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-2">Need Something Else?</h3>
          <p className="text-muted-foreground mb-4">
            Contact us for custom plans or if you have any questions.
          </p>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="text-primary hover:text-primary"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}