import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";

type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

export default function EventList() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();

  // Initialize query (will only fetch if enabled)
  const {
    data: events = [],
    isLoading: eventsLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: [`/api/users/${user?.id || 0}/invites`],
    enabled: !!user,
  });

  // Prefetch user responses for all events using our new API endpoint
  const { data: userResponses = {} } = useQuery<Record<string, "yup" | "nope">>({
    queryKey: [`/api/users/${user?.id || 0}/responses`],
    enabled: !!user,
  });

  // Mutation for creating test invites
  const createTestInvites = useMutation({
    mutationFn: () => apiRequest<{ success: boolean, message: string, events: Event[] }>("GET", "/api/create-test-invites"),
    onSuccess: (data) => {
      toast({
        title: "Test Invites Created",
        description: data.message,
      });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 0}/invites`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 0}/responses`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test invites",
        variant: "destructive",
      });
    }
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

  // Filter events based on response type and date (Central Time)
  const filteredEvents = events.filter(event => {
    const response = userResponses[event.id];
    
    // Get date 2 days ago in Central Time (YYYY-MM-DD format)
    const twoDaysAgoCentral = new Date();
    twoDaysAgoCentral.setDate(twoDaysAgoCentral.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgoCentral.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const eventDateStr = event.date; // Already in YYYY-MM-DD format
    
    // Event is archived if its date is more than 2 days ago in Central Time
    const isPastEvent = eventDateStr < twoDaysAgoStr;

    if (responseFilter === "archives") return isPastEvent;
    if (isPastEvent) return false;

    if (responseFilter === "all") return true;
    if (responseFilter === "yup" && response === "yup") return true;
    if (responseFilter === "nope" && response === "nope") return true;
    if (responseFilter === "maybe" && !response) return true;

    return false;
  });

  const handleCreateTestInvites = () => {
    createTestInvites.mutate();
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
        <ViewSelector
          activeMainTab="invited"
          activeResponseFilter={responseFilter}
          onMainTabChange={(tab) => {
            if (tab === "hosting") {
              setLocation("/my-events");
            }
          }}
          onResponseFilterChange={(filter) => setResponseFilter(filter)}
        />
      </div>

      <main className="flex-1 w-full animate-fade-in pb-32">
        <Card className="w-full bg-gray-900 border border-gray-800">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight uppercase">
                Invited Events
                {responseFilter !== "all" && ` - ${responseFilter.toUpperCase()}`}
              </h2>

              <Button 
                variant="default"
                size="icon"
                onClick={() => setLocation("/events/create")}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: accessibleTextColor }} />
              </div>
            ) : error ? (
              <p className="text-center py-4 tracking-tight" style={{ color: accessibleTextColor }}>
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : filteredEvents.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredEvents.map((event) => (
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
                {events.length === 0 ? (
                  <>
                    <p className="text-gray-500 font-mono uppercase tracking-wide">
                      NO EVENTS FOUND
                    </p>
                    <p className="text-gray-600 mt-2 text-sm">
                      Click "Create An Event" to generate sample events
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 tracking-tight uppercase font-mono">
                    NO "{responseFilter.toUpperCase()}" RESPONSES
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {responseFilter !== "archives" && (
          <button
            onClick={() => setResponseFilter("archives")}
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            View Archives
          </button>
        )}
      </main>
    </div>
  );
}