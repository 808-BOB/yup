"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Crown from "lucide-react/dist/esm/icons/crown";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import Header from "@/dash/header";

function UpgradeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sessionId = searchParams.get("session_id");
  const plan = searchParams.get("plan") || "premium";

  const benefits = [
    {
      icon: Crown,
      title: "Premium Features",
      description: "Access to advanced customization and branding options"
    },
    {
      icon: Zap,
      title: "Enhanced Analytics",
      description: "Detailed insights into your event performance"
    },
    {
      icon: CheckCircle,
      title: "Priority Support",
      description: "Get help faster with our priority support queue"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to {plan === 'pro' ? 'Yup Pro' : 'Yup Premium'}!
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Your subscription has been successfully activated. You now have access to all premium features.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-4">
                    <IconComponent className="w-8 h-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg text-white">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => router.push("/my-events")}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Go to My Events
            </Button>
            
            <div>
              <Button
                variant="outline"
                onClick={() => router.push("/branding")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Customize Your Branding
              </Button>
            </div>
          </div>

          {sessionId && (
            <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400">
                Session ID: <span className="font-mono">{sessionId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <UpgradeSuccessContent />
    </React.Suspense>
  );
} 