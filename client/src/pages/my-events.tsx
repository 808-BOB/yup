import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function MyEvents() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Initialize query (will only fetch if enabled)
  const {
    data: events = [],
    isLoading: eventsLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: [`/api/users/${user?.id || 0}/events`],
    enabled: !!user,
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
        activeTab="your-events"
        onTabChange={(tab) => {
          if (tab === "invited") {
            setLocation("/event-list");
          }
        }}
      />

      <main className="flex-1 w-full overflow-auto animate-fade-in pb-32 z-0">
        <Card className="w-full bg-gray-900 border border-gray-800">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">
              Your Events
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
                    showStats={true}
                    isOwner={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="mb-4 text-gray-400 tracking-tight uppercase font-mono">
                  NO EVENTS CREATED
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLocation("/events/create")}
                >
                  CREATE YOUR FIRST EVENT
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
