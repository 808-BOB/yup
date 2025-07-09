"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Crown from "lucide-react/dist/esm/icons/crown";
import Zap from "lucide-react/dist/esm/icons/zap";
import Header from "@/dash/header";
import { supabase } from "@/lib/supabase";

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

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const branding = useBranding();
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Determine plan using flags already merged into the auth user object.
  const isPremium = branding.isPremium; // branding checks row fields itself
  const isPro = Boolean((user as any)?.is_pro);

  const currentPlan = isPremium ? "premium" : isPro ? "pro" : "free";

  const handleUpgrade = async (plan: string) => {
    if (!user) {
      alert("Please log in to upgrade your plan.");
      router.push("/auth/login");
      return;
    }

    if (plan === currentPlan) return;

    if (plan === "free") {
      setSelectedPlan(plan);
      setUpgrading(true);
      alert("Plan downgrade functionality is coming soon.");
      setUpgrading(false);
      return;
    }

    setSelectedPlan(plan);
    setUpgrading(true);

    try {
      // Get the access token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Please log in to upgrade your plan.");
        router.push("/auth/login");
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planType: plan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout process. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4 text-white">Choose the Right Plan for You</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Unlock powerful features to take your events to the next level with our premium plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {Object.entries(tierFeatures).map(([key, tier]) => {
            const isCurrent = currentPlan === key;
            const isDisabled = isCurrent || upgrading;

            return (
              <div
                key={key}
                className={`flex flex-col h-full bg-gray-900 border rounded-lg p-6 ${
                  tier.highlight
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-gray-800"
                }`}
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-white">{tier.title}</h2>
                    {tier.highlight && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                        Most Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="border border-primary text-primary text-xs px-2 py-1 rounded">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-4">{tier.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                    <span className="ml-2 text-sm text-gray-400">
                      {tier.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-grow mb-6">
                  <div className="h-px bg-gray-700 mb-4"></div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={feature.included ? "text-gray-200" : "text-gray-500"}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={isDisabled}
                  className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                    tier.highlight && !isDisabled
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : isDisabled
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                  }`}
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
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-2 text-white">Need Something Else?</h3>
          <p className="text-gray-400 mb-4">
            Contact us for custom plans or if you have any questions.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-800 hover:bg-gray-700 text-primary border border-gray-700 py-2 px-4 rounded"
          >
            Contact Support
          </button>
        </div>
      </main>
    </div>
  );
}
