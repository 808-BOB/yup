"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { useSubscriptionSync } from "@/hooks/use-subscription-sync";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Crown from "lucide-react/dist/esm/icons/crown";
import Zap from "lucide-react/dist/esm/icons/zap";
import Header from "@/dash/header";
import { supabase } from "@/lib/supabase";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

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
  const { user, refreshUser } = useAuth();
  const branding = useBranding();
  const [upgrading, setUpgrading] = useState(false);
  
  // Auto-sync subscription when visiting upgrade page
  const { manualSync } = useSubscriptionSync();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  // Listen for subscription updates
  React.useEffect(() => {
    const handleSubscriptionUpdate = async (event: any) => {
      console.log('Subscription updated event received:', event.detail);
      await refreshUser();
      setLastSyncTime(Date.now());
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    return () => window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
  }, [refreshUser]);

  // Determine plan using flags from branding context (which reads fresh from database)
  // Force re-evaluation with lastSyncTime to ensure UI updates after changes
  const isPremium = React.useMemo(() => branding.isPremium, [branding.isPremium, lastSyncTime]);
  const isPro = React.useMemo(() => branding.isPro, [branding.isPro, lastSyncTime]);

  const currentPlan = isPremium ? "premium" : isPro ? "pro" : "free";
  
  console.log('Current plan state:', { 
    isPremium, 
    isPro, 
    currentPlan, 
    lastSyncTime,
    brandingIsPremium: branding.isPremium,
    userIsPro: (user as any)?.is_pro,
    userIsPremium: (user as any)?.is_premium,
    user: user ? { id: user.id, is_pro: (user as any)?.is_pro, is_premium: (user as any)?.is_premium } : null
  });

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
        
        // Handle specific case where user already has an active subscription
        if (response.status === 409 && errorData.hasActiveSubscription) {
          // If it's an upgrade (Pro -> Premium), use the subscription change API instead
          if (errorData.isUpgrade) {
            console.log('Detected upgrade attempt, using subscription change API...');
            await handleSubscriptionChange('change_plan', plan);
            return;
          }
          
          alert("You already have an active subscription. Please manage your existing subscription from your profile page instead of creating a new one.");
          router.push('/profile');
          return;
        }
        
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

  const handleSubscriptionChange = async (action: 'cancel' | 'change_plan', targetPlan?: string) => {
    const actionText = action === 'cancel' 
      ? 'cancel your subscription' 
      : `${targetPlan === 'free' ? 'cancel' : 'change to'} ${targetPlan}`;
      
    if (!confirm(`Are you sure you want to ${actionText}? ${action === 'cancel' || targetPlan === 'free' ? 'You will lose access to premium features at the end of your billing period.' : 'Your billing will be adjusted accordingly.'}`)) {
      return;
    }

    setUpgrading(true);
    try {
      const response = await fetch('/api/stripe/change-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetPlan })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to modify subscription');
      }

      const result = await response.json();
      
      // Show success message with details
      const accessUntil = result.details?.accessUntil 
        ? new Date(result.details.accessUntil).toLocaleDateString()
        : 'end of billing period';
        
      const message = action === 'cancel' 
        ? `Subscription cancelled successfully. You'll retain access until ${accessUntil}.`
        : `Subscription changed to ${targetPlan?.toUpperCase()} successfully. Changes take effect immediately.`;
        
      alert(message);
      
      // Immediately refresh auth context and sync subscription data
      console.log('Refreshing user data after subscription change...');
      
      // First, trigger sync to update database
      const syncResult = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (syncResult.ok) {
        const syncData = await syncResult.json();
        console.log('Post-change sync completed:', syncData);
      }
      
      // Then refresh auth context and branding context with updated data
      await refreshUser();
      await branding.refreshBranding();
      
      // Refresh the page to ensure UI is completely updated
      window.location.reload();
    } catch (error: any) {
      console.error('Error modifying subscription:', error);
      alert('Failed to modify subscription. Please try again or contact support.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = () => handleSubscriptionChange('cancel');
  
  const handleDowngrade = (targetPlan: string) => {
    if (targetPlan === 'free') {
      handleSubscriptionChange('cancel');
    } else {
      handleSubscriptionChange('change_plan', targetPlan);
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
            const isUpgrade = (key === 'pro' && !isPro && !isPremium) || (key === 'premium' && !isPremium);
            const isDowngrade = (key === 'pro' && isPremium) || (key === 'free' && (isPro || isPremium));
            const isDisabled = isCurrent || upgrading;

            return (
              <div
                key={key}
                className="flex flex-col h-full rounded-lg p-6"
                style={{
                  backgroundColor: branding.theme.secondary + 'E6', // 90% opacity
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: tier.highlight 
                    ? branding.theme.primary 
                    : branding.theme.primary + '33', // 20% opacity
                  boxShadow: tier.highlight 
                    ? `0 10px 15px -3px ${branding.theme.primary}20, 0 4px 6px -2px ${branding.theme.primary}10`
                    : 'none'
                }}
              >
                {/* Header */}
                <div className="mb-6 relative">
                  {/* Badges in top right corner - Current Plan takes priority over Most Popular */}
                  <div className="absolute -top-2 -right-2 flex flex-row gap-1 z-10">
                    {isCurrent ? (
                      <span 
                        className="text-xs px-2 py-1 rounded text-center font-medium shadow-sm whitespace-nowrap border"
                        style={{ 
                          borderColor: branding.theme.primary,
                          color: branding.theme.primary,
                          backgroundColor: branding.theme.secondary + 'E6' // 90% opacity
                        }}
                      >
                        Current Plan
                      </span>
                    ) : tier.highlight && (
                      <span 
                        className="text-white text-xs px-2 py-1 rounded text-center font-medium shadow-sm whitespace-nowrap"
                        style={{ 
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary)
                        }}
                      >
                        Most Popular
                      </span>
                    )}
                  </div>
                  
                  <div className="pr-24"> {/* Increased padding to avoid badge overlap */}
                    <h2 className="text-2xl font-bold text-white">{tier.title}</h2>
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
                  <div 
                    className="h-px mb-4"
                    style={{ backgroundColor: branding.theme.primary + '33' }} // 20% opacity
                  ></div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check 
                            className="h-5 w-5 flex-shrink-0 mt-0.5" 
                            style={{ color: branding.theme.primary }}
                          />
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
                <div className="space-y-2">
                  {!isCurrent && (
                    <button
                      onClick={() => isDowngrade ? handleDowngrade(key) : handleUpgrade(key)}
                      disabled={upgrading}
                      className="w-full py-3 px-4 rounded font-medium transition-colors"
                      style={{
                        backgroundColor: upgrading 
                          ? '#374151' 
                          : tier.highlight && !upgrading
                          ? branding.theme.primary
                          : isDowngrade
                          ? '#ea580c'
                          : branding.theme.secondary,
                        color: upgrading
                          ? '#9ca3af'
                          : tier.highlight && !upgrading
                          ? getContrastingTextColor(branding.theme.primary)
                          : isDowngrade
                          ? '#ffffff'
                          : getContrastingTextColor(branding.theme.secondary),
                        border: !tier.highlight && !isDowngrade && !upgrading ? `1px solid ${branding.theme.primary}40` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!upgrading) {
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!upgrading) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      {upgrading && selectedPlan === key ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          Processing...
                        </span>
                      ) : !user ? (
                        <span className="flex items-center justify-center gap-2">
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
                        <span className="flex items-center justify-center gap-2">
                          {key === "premium" ? (
                            <Crown className="h-4 w-4" />
                          ) : key === "pro" ? (
                            <Zap className="h-4 w-4" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {isDowngrade ? `Downgrade to ${tier.title}` : tier.ctaText}
                        </span>
                      )}
                    </button>
                  )}
                  
                  {isCurrent && (
                    <div className="space-y-2">
                      <div 
                        className="w-full py-3 px-4 rounded font-medium text-center"
                        style={{
                          backgroundColor: branding.theme.primary + '20', // 12% opacity
                          color: branding.theme.primary,
                          border: `1px solid ${branding.theme.primary}40` // 25% opacity
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" />
                          Current Plan
                        </span>
                      </div>
                      {(isPremium || isPro) && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={upgrading}
                          className="w-full py-3 px-4 rounded font-medium transition-colors"
                          style={{
                            backgroundColor: upgrading ? '#374151' : '#dc2626',
                            color: upgrading ? '#9ca3af' : '#ffffff'
                          }}
                          onMouseEnter={(e) => {
                            if (!upgrading) {
                              e.currentTarget.style.opacity = '0.9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!upgrading) {
                              e.currentTarget.style.opacity = '1';
                            }
                          }}
                        >
                          {upgrading ? "Processing..." : "Cancel Subscription"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
