"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Header from "@/dash/header";
import ViewSelector from "@/dash/view-selector";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { useRouter } from "next/navigation";
import PlusCircle from "lucide-react/dist/esm/icons/plus-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Crown from "lucide-react/dist/esm/icons/crown";
import Zap from "lucide-react/dist/esm/icons/zap";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Link from "next/link";
import { Button } from "@/ui/button";
// Note: useRequireAuth is no longer needed since middleware handles authentication
import { Card, CardContent } from "@/ui/card";
import EventCard from "@/dash/event-card";
import { supabase } from "@/lib/supabase";

interface EventRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  location: string;
  created_at?: string;
}

interface UserPlan {
  is_premium: boolean;
  is_pro: boolean;
}

const fetchEvents = async () => {
  // Get the user from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return [];
  }

  const response = await fetch('/api/events/my', {
    headers: {
      'x-user-id': session.user.id,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  
  const events = await response.json();
  return events as EventRow[];
};

type ResponseFilter = "all" | "archives";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

export default function MyEventsPage() {
  // Note: Auth is guaranteed by middleware

  const { user } = useAuth();
  const branding = useBranding();
  const router = useRouter();
  const [filter, setFilter] = useState<ResponseFilter>("all");
  const [userPlan, setUserPlan] = useState<UserPlan>({ is_premium: false, is_pro: false });

  const { data: events, error } = useSWR<EventRow[]>(user ? "my-events" : null, fetchEvents);

  // Fetch user plan information
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_premium, is_pro')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserPlan(data);
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, [user]);

  // Note: Auth is guaranteed by middleware, no need to check for user existence
  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading your events...</p>
        </div>
      </div>
    );
  }

  const isLoading = !events && !error;
  const isFreeUser = !userPlan.is_premium && !userPlan.is_pro;
  const hasUnlimitedEvents = userPlan.is_premium || userPlan.is_pro;
  const eventCount = events?.length || 0;
  const freeEventLimit = 3;
  const isNearLimit = isFreeUser && eventCount >= freeEventLimit - 1;
  const hasReachedLimit = isFreeUser && eventCount >= freeEventLimit;

  // Archive threshold logic: an event is considered archived only if
  // (a) its event date is in the past *and* (b) it was created more than 2
  //     days ago. This ensures that users still see newly-created events even
  //     if they accidentally pick a past date.

  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const now = new Date();

  const visible = (events || []).filter(ev => {
    const eventDate = new Date(ev.date);
    const createdAt = new Date(ev.created_at || ev.date);
    const isPast = eventDate < now;
    const isOld = now.getTime() - createdAt.getTime() > twoDaysMs;
    const archived = isPast && isOld;

    if (filter === "archives") return archived;
    return !archived;
  });

  const getPlanDisplayName = () => {
    if (userPlan.is_premium) return "Premium";
    if (userPlan.is_pro) return "Pro";
    return "Free";
  };

  const getPlanColor = () => {
    if (userPlan.is_premium) return branding.theme.primary;
    if (userPlan.is_pro) return branding.theme.primary;
    return "#9ca3af";
  };

  return (
    <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
        <ViewSelector
          activeMainTab="hosting"
          activeResponseFilter={filter}
          onMainTabChange={tab => {
            if (tab === "invited") router.push("/event-list");
          }}
          onResponseFilterChange={setFilter as any}
        />
      </div>

      <main className="flex-1 w-full pb-32">
        {/* Plan Status Card */}
        <div className="mb-6">
          <div 
            className="border rounded-lg p-4"
            style={{
              backgroundColor: branding.theme.secondary + 'E6', // 90% opacity
              borderColor: branding.theme.primary + '33' // 20% opacity
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {userPlan.is_premium && <Crown className="h-4 w-4" style={{ color: branding.theme.primary }} />}
                  {userPlan.is_pro && <Zap className="h-4 w-4" style={{ color: branding.theme.primary }} />}
                  <span 
                    className="text-sm font-medium"
                    style={{ color: getPlanColor() }}
                  >
                    {getPlanDisplayName()} Plan
                  </span>
                </div>
                
                <div 
                  className="text-sm"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                >
                  {hasUnlimitedEvents ? (
                    `${eventCount} events`
                  ) : (
                    <span className={hasReachedLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : ""}>
                      {eventCount}/{freeEventLimit} events
                    </span>
                  )}
                </div>
              </div>

              {isFreeUser && (
                <div className="flex items-center gap-2">
                  {hasReachedLimit && (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <Button
                    size="sm"
                    onClick={() => router.push('/upgrade')}
                    style={{
                      backgroundColor: branding.theme.primary,
                      color: getContrastingTextColor(branding.theme.primary),
                      border: 'none'
                    }}
                    className="hover:opacity-90"
                  >
                    {hasReachedLimit ? 'Upgrade Now' : 'Upgrade'}
                  </Button>
                </div>
              )}
            </div>

            {/* Free plan warnings */}
            {isFreeUser && (
              <div 
                className="mt-3 pt-3 border-t"
                style={{ borderColor: branding.theme.primary + '33' }} // 20% opacity
              >
                {hasReachedLimit ? (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Event limit reached. Upgrade to create more events.</span>
                  </div>
                ) : isNearLimit ? (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>You're close to your event limit. Consider upgrading for unlimited events.</span>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    <span>Upgrade to Pro or Premium for unlimited events and advanced analytics.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Card 
          className="w-full backdrop-blur-sm border shadow-lg"
          style={{
            backgroundColor: branding.theme.secondary + 'F2', // 95% opacity
            borderColor: branding.theme.primary + '33' // 20% opacity
          }}
        >
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
              <h2 
                className="text-xl font-bold tracking-tight uppercase"
                style={{ color: branding.theme.primary }}
              >
                Hosting
              </h2>
              <Button 
                size="sm"
                onClick={() => {
                  if (hasReachedLimit) {
                    window.location.href = '/upgrade';
                  } else {
                    router.push('/events/create');
                  }
                }}
                style={{
                  backgroundColor: branding.theme.primary,
                  color: getContrastingTextColor(branding.theme.primary),
                  border: 'none'
                }}
                className="hover:opacity-90"
              >
                {hasReachedLimit ? (
                  <Crown className="h-4 w-4" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 
                    className="h-8 w-8 animate-spin mx-auto mb-2" 
                    style={{ color: branding.theme.primary }}
                  />
                  <p 
                    className="text-sm"
                    style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                  >
                    Loading your events...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p 
                  className="mb-2"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) }}
                >
                  Failed to load events
                </p>
                <p 
                  className="text-sm"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                >
                  Please try refreshing the page
                </p>
                <p className="text-xs text-red-400 mt-2">Error: {error.message}</p>
              </div>
            ) : visible.length ? (
              <div className="space-y-4">
                {visible.map(e => (
                  <EventCard key={e.id} event={e as any} showStats isOwner userResponse={null} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p 
                  className="mb-2"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) }}
                >
                  {filter === "archives" ? "No archived events" : "No events yet"}
                </p>
                {filter !== "archives" && !hasReachedLimit && (
                  <p 
                    className="text-sm mb-4"
                    style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                  >
                    Create your first event to get started
                  </p>
                )}
                {filter !== "archives" && hasReachedLimit && (
                  <p className="text-sm text-red-400 mb-4">
                    Upgrade your plan to create more events
                  </p>
                )}
                {filter !== "archives" && (
                  <Link href={hasReachedLimit ? "/upgrade" : "/events/create"}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-700"
                      style={{
                        borderColor: branding.theme.primary,
                        color: branding.theme.primary
                      }}
                    >
                      {hasReachedLimit ? (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {filter !== "archives" && (
          <button
            onClick={() => setFilter("archives")}
            className="w-full mt-4 py-2 text-sm text-center hover:opacity-80 transition-opacity"
            style={{
              color: branding.theme.primary,
              backgroundColor: branding.theme.secondary + '80', // 50% opacity
              borderRadius: '0.375rem',
              border: `1px solid ${branding.theme.primary}4D` // 30% opacity
            }}
          >
            View Archives
          </button>
        )}
      </main>
    </div>
  );
}
