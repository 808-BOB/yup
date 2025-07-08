"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { CheckCircle, Crown, Zap } from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import Header from "@/dash/header";

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const plan = searchParams.get('plan');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated subscription status
    const updateUserData = async () => {
      if (user && refreshUser) {
        try {
          // Wait a bit for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          await refreshUser();
        } catch (error) {
          console.error('Error refreshing user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    updateUserData();
  }, [user, refreshUser]);

  // Redirect if no session ID (shouldn't happen in normal flow)
  useEffect(() => {
    if (!isLoading && !sessionId) {
      router.push('/upgrade');
    }
  }, [isLoading, sessionId, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="sticky top-0 z-50 page-container pt-8">
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Processing your upgrade...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
      <div className="sticky top-0 z-50 page-container pt-8">
        <Header />
      </div>

      <main className="flex-1 flex items-center justify-center animate-fade-in">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to {plan === 'premium' ? 'Premium' : 'Pro'}!
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-white">
                {plan === 'premium' ? (
                  <Crown className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Zap className="w-5 h-5 text-blue-500" />
                )}
                {plan === 'premium' ? 'Premium Plan' : 'Pro Plan'} Activated
              </div>
              <p className="text-gray-400">
                Your upgrade was successful! You now have access to all {plan} features.
              </p>
            </div>

            <div className="space-y-3 text-sm text-left bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white">What's included:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Unlimited events</li>
                <li>• Advanced analytics</li>
                {plan === 'premium' && (
                  <>
                    <li>• Custom branding</li>
                    <li>• White-label events</li>
                    <li>• Custom domain support</li>
                  </>
                )}
                <li>• Priority support</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/events')}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Start Creating Events
              </Button>
              
              {plan === 'premium' && (
                <Button
                  onClick={() => router.push('/branding')}
                  variant="outline"
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
                >
                  Customize Your Branding
                </Button>
              )}

              <Button
                onClick={() => router.push('/profile')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 