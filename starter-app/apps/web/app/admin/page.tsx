"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, RefreshCw, CheckCircle, AlertCircle, XCircle, TrendingUp, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Progress } from "@/ui/progress";
import Header from "@/dash/header";
import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import MakeAdmin from "./make-admin";
import MakePremium from "./make-premium";

interface SystemMetrics {
  totalUsers: number;
  totalEvents: number;
  totalResponses: number;
  systemUptime: string;
  lastUpdated: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="sticky top-0 z-50 page-container pt-8">
          <Header />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Please log in to access admin settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
      <div className="sticky top-0 z-50 page-container pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight mb-6">Admin Panel</h1>

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Premium Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upgrade your account to premium to access branding customization features.
              </p>
              <MakePremium />
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/branding")}
                className="w-full"
                variant="outline"
                disabled={!(user as any)?.is_premium}
              >
                Go to Branding Settings
              </Button>
              <Button
                onClick={() => router.push("/profile")}
                className="w-full"
                variant="outline"
              >
                Go to Profile
              </Button>
              <Button
                onClick={() => router.push("/upgrade")}
                className="w-full"
                variant="outline"
              >
                View Pricing Plans
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Username:</strong> {(user as any)?.username || 'N/A'}</p>
                <p><strong>Display Name:</strong> {(user as any)?.display_name || 'N/A'}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Premium Status:</strong> {(user as any)?.is_premium ? '✓ Premium' : '✗ Free'}</p>
                <p><strong>Admin Status:</strong> {(user as any)?.is_admin ? '✓ Admin' : '✗ Regular User'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
