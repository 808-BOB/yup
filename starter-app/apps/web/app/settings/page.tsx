"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import Header from "@/dash/header";
import { useAuth } from "@/utils/auth-context";
import { getSupabaseClient } from "@/lib/supabase";

interface SystemMetrics {
  totalUsers: number;
  totalEvents: number;
  totalResponses: number;
  activeUsers: number;
  loading: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalEvents: 0,
    totalResponses: 0,
    activeUsers: 0,
    loading: true
  });
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Get total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get total responses
      const { count: responsesCount } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true });

      // Get active users (users who created events or responses in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeEventUsers } = await supabase
        .from('events')
        .select('host_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: activeResponseUsers } = await supabase
        .from('responses')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeUserIds = new Set([
        ...(activeEventUsers?.map(e => e.host_id) || []),
        ...(activeResponseUsers?.map(r => r.user_id) || [])
      ]);

      setMetrics({
        totalUsers: usersCount || 0,
        totalEvents: eventsCount || 0,
        totalResponses: responsesCount || 0,
        activeUsers: activeUserIds.size,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  // Upgrade to premium
  const handleUpgradeToPremium = async () => {
    if (!user) return;
    
    setIsUpgrading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', user.id);

      if (error) throw error;

      alert('Successfully upgraded to Premium!');
      window.location.reload();
    } catch (error: any) {
      alert('Error upgrading to premium: ' + error.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  // Note: Auth is guaranteed by middleware, so we only need to check if user is loaded
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isAdmin = (user as any)?.is_admin;
  const isPremium = (user as any)?.is_premium;

  return (
    <div className="w-full max-w-2xl mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6">
        <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

        {/* User Status Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Your Account Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="text-white">{(user as any)?.username || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Display Name:</span>
              <span className="text-white">{(user as any)?.display_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Premium Status:</span>
              <span className={isPremium ? "text-green-400" : "text-red-400"}>
                {isPremium ? '✓ Premium' : '✗ Free'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Admin Status:</span>
              <span className={isAdmin ? "text-green-400" : "text-gray-400"}>
                {isAdmin ? '✓ Admin' : '✗ Regular User'}
              </span>
            </div>
          </div>
        </div>

        {/* Premium Upgrade Card */}
        {!isPremium && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Premium Access</h2>
            <p className="text-gray-400 mb-4">
              Upgrade your account to premium to access branding customization features.
            </p>
            <Button
              onClick={handleUpgradeToPremium}
              disabled={isUpgrading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isUpgrading ? 'Upgrading...' : 'Upgrade to Premium'}
            </Button>
          </div>
        )}

        {/* System Metrics (for admins) */}
        {isAdmin && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">System Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.loading ? "..." : metrics.totalUsers}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Total Events</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.loading ? "..." : metrics.totalEvents}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Total Responses</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.loading ? "..." : metrics.totalResponses}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Active Users (30d)</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.loading ? "..." : metrics.activeUsers}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Navigation</h2>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/branding")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              disabled={!isPremium}
            >
              {isPremium ? 'Go to Branding Settings' : 'Branding Settings (Premium Only)'}
            </Button>
            <Button
              onClick={() => router.push("/profile")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              Go to Profile
            </Button>
            <Button
              onClick={() => router.push("/upgrade")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              View Pricing Plans
            </Button>
            <Button
              onClick={() => router.push("/my-events")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              My Events
            </Button>
            {isAdmin && (
              <Button
                onClick={() => router.push("/admin")}
                className="w-full bg-red-800 hover:bg-red-700 text-white border border-red-700"
              >
                Developer Admin Dashboard
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 