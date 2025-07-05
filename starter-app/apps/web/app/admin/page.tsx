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

export default function Page() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState(new Date().toLocaleTimeString());
  const [metrics, setMetrics] = React.useState<SystemMetrics>({
    totalUsers: 0,
    totalEvents: 0,
    totalResponses: 0,
    systemUptime: "99.9%",
    lastUpdated: new Date().toLocaleTimeString()
  });

  // Check admin status from database
  React.useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setIsAdmin(Boolean(data?.is_admin));
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin status.",
          variant: "destructive"
        });
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user, toast]);

  React.useEffect(() => {
    if (isLoading) return;

    if (!user) {
      toast({
        title: "Access Denied",
        description: "Please log in to access the admin dashboard.",
        variant: "destructive"
      });
      router.push("/auth/login");
      return;
    }
  }, [user, router, toast, isLoading]);

  const refreshData = async () => {
    setLastUpdated(new Date().toLocaleTimeString());
    try {
      // Get users count
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id');

      // Get events count
      const { data: events, error: eventError } = await supabase
        .from('events')
        .select('id');

      // Get responses count
      const { data: responses, error: responseError } = await supabase
        .from('responses')
        .select('id');

      if (userError || eventError || responseError) throw new Error('Failed to fetch metrics');

      setMetrics(prev => ({
        ...prev,
        totalUsers: users?.length || 0,
        totalEvents: events?.length || 0,
        totalResponses: responses?.length || 0,
        lastUpdated: new Date().toLocaleTimeString()
      }));

      toast({
        title: "Success",
        description: "Metrics updated successfully.",
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch metrics.",
        variant: "destructive"
      });
    }
  };

  const makePremium = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You are now a premium user. You can access branding features.",
      });

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error making premium:', error);
      toast({
        title: "Error",
        description: "Failed to set premium status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show loading state while auth is being checked
  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  // If no user, return null (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">System Management</p>
          </div>
        </div>

        {!isAdmin ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Become an Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">You currently don't have admin privileges. Click below to become an admin:</p>
              <MakeAdmin />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* System Metrics Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.totalUsers}</div>
                    <div className="text-xs text-gray-400">Total Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.totalEvents}</div>
                    <div className="text-xs text-gray-400">Total Events</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.totalResponses}</div>
                    <div className="text-xs text-gray-400">Total RSVPs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{metrics.systemUptime}</div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                </div>

                <Button
                  onClick={refreshData}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            {/* Premium Features Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">Make your account premium to test branding features:</p>
                <MakePremium />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
