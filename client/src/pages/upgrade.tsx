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
    description: "Basic RSVP functionality",
    price: "$0",
    period: "forever",
    features: [
      { name: "Create up to 3 events", included: true },
      { name: "Basic event customization", included: true },
      { name: "Email invitations", included: true },
      { name: "Guest RSVP tracking", included: true },
      { name: "Standard event pages", included: true },
      { name: "Limited analytics", included: true },
      { name: "Custom branding", included: false },
      { name: "Priority support", included: false },
      { name: "Unlimited events", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom domain", included: false },
      { name: "White-label events", included: false },
    ],
    ctaText: "Current Plan",
    ctaDisabled: true,
    highlight: false,
  },
  pro: {
    title: "Pro",
    description: "Everything in Free plus more features",
    price: "$9.99",
    period: "per month",
    features: [
      { name: "Create up to 3 events", included: true },
      { name: "Basic event customization", included: true },
      { name: "Email invitations", included: true },
      { name: "Guest RSVP tracking", included: true },
      { name: "Standard event pages", included: true },
      { name: "Limited analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Unlimited events", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom domain", included: false },
      { name: "Custom branding", included: false },
      { name: "White-label events", included: false },
    ],
    ctaText: "Upgrade to Pro",
    ctaDisabled: false,
    highlight: false,
  },
  premium: {
    title: "Premium",
    description: "Full featured white-label solution",
    price: "$29.99",
    period: "per month",
    features: [
      { name: "Create up to 3 events", included: true },
      { name: "Basic event customization", included: true },
      { name: "Email invitations", included: true },
      { name: "Guest RSVP tracking", included: true },
      { name: "Standard event pages", included: true },
      { name: "Limited analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Unlimited events", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom domain", included: true },
      { name: "Custom branding", included: true },
      { name: "White-label events", included: true },
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

  const getCurrentPlan = () => {
    // For non-logged in users, we don't show any "current plan" indicators
    if (!user) return "";
    if (user.isPremium) return "premium";
    if (user.isPro) return "pro";
    return "free";
  };

  const currentPlan = getCurrentPlan();

  const handleUpgrade = async (plan: string) => {
    // Redirect to login if user is not logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to upgrade your plan.",
        variant: "default",
      });
      setLocation("/login");
      return;
    }

    if (plan === currentPlan) return;
    
    // For downgrading to free, we'll continue to use the test endpoint
    if (plan === "free") {
      setSelectedPlan(plan);
      setUpgrading(true);
      
      try {
        const endpoint = `/api/make-free/${user.username}`;
        const response = await apiRequest("GET", endpoint);
        const result = await response.json();
  
        if (result.success) {
          toast({
            title: "Plan Updated",
            description: `You've been downgraded to the Free plan.`,
            variant: "default",
          });
  
          // Reload to refresh user status
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          throw new Error(result.message || "Failed to downgrade plan");
        }
      } catch (error: any) {
        console.error("Error downgrading plan:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to downgrade plan. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setUpgrading(false);
      }
      
      return;
    }
    
    // For upgrading to paid plans, redirect to the subscription page
    setSelectedPlan(plan);
    setUpgrading(true);
    
    try {
      // Redirect to the subscription page with the selected plan
      setLocation(`/subscribe?plan=${plan}`);
    } catch (error: any) {
      console.error("Error navigating to subscription page:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription page. Please try again later.",
        variant: "destructive",
      });
      setUpgrading(false);
    }
  };

  // We allow viewing plans even when not logged in

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <PageTitle title="Upgrade Your Plan" />

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
                    ) : !user ? (
                      <span className="flex items-center gap-2">
                        {key === "premium" ? (
                          <Crown className="h-4 w-4" />
                        ) : key === "pro" ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Sign Up Now
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