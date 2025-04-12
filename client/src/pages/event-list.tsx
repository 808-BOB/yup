import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function EventList() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Initialize query (will only fetch if enabled)
  const {
    data: events = [],
    isLoading: eventsLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: [`/api/users/${user?.id || 0}/invites`],
    enabled: !!user,
  });
  
  // Prefetch user responses for all events to avoid multiple API calls
  const { data: userResponses = {} } = useQuery<Record<number, "yup" | "nope">>({
    queryKey: [`/api/users/${user?.id || 0}/responses`],
    queryFn: async () => {
      if (!user || !events.length) return {};
      
      // Create a response map by event ID
      const responseMap: Record<number, "yup" | "nope"> = {};
      
      // We'll fetch responses individually for each event
      // In a real app, this would be a single API call that returns all responses
      await Promise.all(
        events.map(async (event) => {
          try {
            const response = await fetch(`/api/events/${event.id}/users/${user.id}/response`);
            const data = await response.json();
            if (data && data.response) {
              responseMap[event.id] = data.response;
            }
          } catch (err) {
            console.error(`Failed to fetch response for event ${event.id}:`, err);
          }
        })
      );
      
      return responseMap;
    },
    enabled: !!user && events.length > 0,
  });

  // Using useEffect for navigation to avoid React update during render warnings
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  // Early return if still loading or no user
  if (authLoading || !user) {
    return (
      <div className="w-full max-w-md mx-auto p-8 h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isLoading = authLoading || eventsLoading;

  return (
    <div className="w-full max-w-md mx-auto p-8 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector
        activeTab="invited"
        onTabChange={(tab) => {
          if (tab === "your-events") {
            setLocation("/my-events");
          }
        }}
      />

      <main className="flex-1 w-full overflow-auto animate-fade-in pb-32">
        <Card className="w-full bg-gray-900 border border-gray-800">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">
              Invited Events
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <p className="text-center py-4 text-primary tracking-tight">
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : events && events.length > 0 ? (
              <div className="flex flex-col gap-4">
                {events.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isOwner={false} 
                    userResponse={userResponses[event.id] || null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 font-mono uppercase tracking-wide">
                  NO EVENTS FOUND
                </p>
                <p className="text-gray-600 mt-2 text-sm">
                  Check back later or create a new event
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
