"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import Header from "@/dash/header";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";
import { Camera, Edit2, Check, X, CreditCard, Crown, Zap } from "lucide-react";

interface AccountStats {
  createdEvents: number;
  totalResponses: number;
  loading: boolean;
}

interface SubscriptionData {
  plan: string;
  status: string;
  loading: boolean;
  hasActiveSubscription: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [accountStats, setAccountStats] = useState<AccountStats>({
    createdEvents: 0,
    totalResponses: 0,
    loading: true
  });
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    plan: "Free Plan",
    status: "Active",
    loading: true,
    hasActiveSubscription: false
  });
  
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const isLoading = !user;

  // Fetch account statistics
  const fetchAccountStats = async () => {
    if (!user?.id) return;

    try {
      // Get created events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id);

      // Get total responses count for user's events
      const { data: userEvents } = await supabase
        .from('events')
        .select('id')
        .eq('host_id', user.id);

      let totalResponses = 0;
      if (userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(e => e.id);
        const { count: responsesCount } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds);
        
        totalResponses = responsesCount || 0;
      }

      setAccountStats({
        createdEvents: eventsCount || 0,
        totalResponses,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching account stats:', error);
      setAccountStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user?.id) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('is_pro, is_premium, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      let currentPlan = "Free Plan";
      let hasActiveSubscription = false;
      
      if (userData?.is_premium) {
        currentPlan = "Premium Plan";
        hasActiveSubscription = Boolean(userData.stripe_subscription_id);
      } else if (userData?.is_pro) {
        currentPlan = "Pro Plan";
        hasActiveSubscription = Boolean(userData.stripe_subscription_id);
      }

      setSubscriptionData({
        plan: currentPlan,
        status: "Active",
        loading: false,
        hasActiveSubscription
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle manage subscription (opens Stripe customer portal)
  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      alert("Failed to open subscription management. Please try again.");
    } finally {
      setIsManagingSubscription(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAccountStats();
      fetchSubscriptionData();
      setNewDisplayName((user as any)?.display_name || "");
      setProfileImageUrl((user as any)?.profile_image_url || null);
    }
  }, [user?.id]);

  // Handle display name update
  const handleUpdateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ display_name: newDisplayName })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      await supabase.auth.updateUser({
        data: { display_name: newDisplayName },
      });

      alert("Display name updated successfully!");
      setIsEditingDisplayName(false);
      window.location.reload();
    } catch (error: any) {
      alert("Failed to update display name: " + error.message);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file: File) => {
    if (!user || !file) return;

    setIsUploadingImage(true);

    try {
      // Convert file to base64 for now (avoiding storage bucket complexity)
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update user profile with base64 image
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: base64Image })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update auth metadata
      await supabase.auth.updateUser({
        data: { profile_image_url: base64Image },
      });

      setProfileImageUrl(base64Image);
      alert("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to update profile picture: " + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      handleProfilePictureUpload(file);
    }
  };

  // Generate user's initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || !user) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 overflow-auto mb-6">
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  const displayName = (user as any)?.display_name ?? (user as any)?.user_metadata?.display_name ?? user?.email ?? "";
  const username = (user as any)?.username ?? (user as any)?.user_metadata?.username ?? "";

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Profile</h1>

        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="h-16 w-16 border border-primary bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={displayName} 
                    className="h-16 w-16 rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-primary text-xl font-medium">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
              
              {/* Camera overlay for upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute -bottom-1 -right-1 bg-primary hover:bg-primary/90 rounded-full p-2 border-2 border-gray-950 transition-colors disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white truncate">{displayName}</h2>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
              {isEditingDisplayName ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter display name"
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateDisplayName}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingDisplayName(false);
                      setNewDisplayName((user as any)?.display_name || "");
                    }}
                    className="border-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white">{displayName}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDisplayName(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <span className="text-white">{user?.email}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
              <span className="text-gray-400 text-sm font-mono">{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Account Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {accountStats.loading ? "..." : accountStats.createdEvents}
              </div>
              <div className="text-sm text-gray-400">Events Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {accountStats.loading ? "..." : accountStats.totalResponses}
              </div>
              <div className="text-sm text-gray-400">Total Responses</div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Subscription</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Plan</span>
              <div className="flex items-center gap-2">
                {subscriptionData.plan === "Premium Plan" && <Crown className="w-4 h-4 text-yellow-400" />}
                {subscriptionData.plan === "Pro Plan" && <Zap className="w-4 h-4 text-blue-400" />}
                <span className="text-white font-medium">
                  {subscriptionData.loading ? "..." : subscriptionData.plan}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400">
                {subscriptionData.loading ? "..." : subscriptionData.status}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {subscriptionData.hasActiveSubscription ? (
                <>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isManagingSubscription}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                  >
                    {isManagingSubscription ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Opening...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Manage Subscription
                      </div>
                    )}
                  </Button>
                  <Button
                    onClick={() => router.push("/upgrade")}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    View All Plans
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => router.push("/upgrade")}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
