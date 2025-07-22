"use client";
import * as React from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import Header from "@/dash/header";
import ViewSelector from "@/dash/view-selector";
import EventCard from "@/dash/event-card";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { useRouter } from "next/navigation";
import PlusCircle from "lucide-react/dist/esm/icons/plus-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import { Button } from "@/ui/button";
// Note: useRequireAuth is no longer needed since middleware handles authentication
import { Card, CardContent } from "@/ui/card";
import { type Event } from "@/types";

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

interface EventWithResponse extends Event {
  user_response: "yup" | "nope" | "maybe" | null;
  response_counts?: {
    yupCount: number;
    nopeCount: number;
    maybeCount: number;
  };
}

const fetchInvitedEvents = async () => {
  // Get the access token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return [];
  }

  const response = await fetch('/api/events/invited', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch invited events: ${response.status} - ${errorText}`);
  }
  
  const events = await response.json();
  return events as EventWithResponse[];
};

type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

export default function EventListPage() {
  // Note: Auth is guaranteed by middleware

  const { user } = useAuth();
  const branding = useBranding();
  const router = useRouter();
  const [filter, setFilter] = React.useState<ResponseFilter>("all");

  const { data: events, error: eventsError } = useSWR<EventWithResponse[]>(
    user ? "invited-events" : null,
    fetchInvitedEvents
  );

  // Note: Auth is guaranteed by middleware, no need to check for user existence
  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading invited events...</p>
        </div>
      </div>
    );
  }

  const isLoading = !events && !eventsError;

  const now = new Date();
  now.setDate(now.getDate() - 2); // archive threshold
  const cutoff = now.toISOString().slice(0, 10);

  const filteredEvents = (events || []).filter(event => {
    const response = event.user_response;
    const eventDateStr = event.date;
    const isPastEvent = eventDateStr < cutoff;

    if (filter === "archives") return isPastEvent;
    if (isPastEvent) return false;

    if (filter === "all") return true;
    if (filter === "yup" && response === "yup") return true;
    if (filter === "nope" && response === "nope") return true;
    if (filter === "maybe" && !response) return true;

    return false;
  });

  return (
    <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
        <ViewSelector
          activeMainTab="invited"
          activeResponseFilter={filter}
          onMainTabChange={tab => {
            if (tab === "hosting") router.push("/my-events");
          }}
          onResponseFilterChange={setFilter as any}
        />
      </div>

      <main className="flex-1 w-full pb-32 mt-6">
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
                Invited Events
                {filter !== "all" && ` - ${filter.toUpperCase()}`}
              </h2>
              <Link href="/events/create">
                <Button 
                  size="sm"
                  style={{
                    backgroundColor: branding.theme.primary,
                    color: getContrastingTextColor(branding.theme.primary),
                    border: 'none'
                  }}
                  className="hover:opacity-90"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </Link>
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
                    Loading invited events...
                  </p>
                </div>
              </div>
            ) : eventsError ? (
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
                <p className="text-xs text-red-400 mt-2">{eventsError.message}</p>
              </div>
            ) : filteredEvents.length ? (
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    showStats={false} 
                    isOwner={false} 
                    userResponse={event.user_response === "maybe" ? null : event.user_response} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p 
                  className="mb-2"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) }}
                >
                  {filter === "archives"
                    ? "No archived events"
                    : filter === "all"
                      ? "No invitations yet"
                      : `No "${filter.toUpperCase()}" responses`
                  }
                </p>
                <p 
                  className="text-sm"
                  style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                >
                  {filter === "all"
                    ? "Invited events will appear here"
                    : filter !== "archives"
                      ? "Events you've responded to will appear here"
                      : ""
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {filter !== "archives" ? (
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
        ) : (
          <button
            onClick={() => setFilter("all")}
            className="w-full mt-4 py-2 text-sm text-center hover:opacity-80 transition-opacity"
            style={{
              color: branding.theme.primary,
              backgroundColor: branding.theme.secondary + '80', // 50% opacity
              borderRadius: '0.375rem',
              border: `1px solid ${branding.theme.primary}4D` // 30% opacity
            }}
          >
            Back to Active Events
          </button>
        )}
      </main>
    </div>
  );
}
