import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventService } from "@/services";

type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

export default function MyEvents() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize query (will only fetch if enabled)
  const {
    data: events = [],
    isLoading: eventsLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: [`/api/users/${user?.id || 0}/events`],
    enabled: !!user,
  });

  // Fetch all of the user's responses
  const { data: userResponses = {} } = useQuery<Record<string, "yup" | "nope">>({
    queryKey: [`/api/users/${user?.id || 0}/responses`],
    enabled: !!user,
  });

  // Mutation for creating test events
  const createTestEvents = useMutation({
    mutationFn: () => apiRequest<{ success: boolean, message: string, events: Event[] }>("GET", "/api/create-test-invites"),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 0}/events`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 0}/responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id || 0}/invites`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test events",
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

  // Filter events based on response type and date
  const filteredEvents = events.filter(event => {
    const response = userResponses[event.id];
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastEvent = eventDate < today;

    if (responseFilter === "archives") return isPastEvent;
    if (isPastEvent) return false;

    if (responseFilter === "all") return true;
    if (responseFilter === "yup" && response === "yup") return true;
    if (responseFilter === "nope" && response === "nope") return true;
    if (responseFilter === "maybe" && !response) return true;

    return false;
  });

  const handleCreateTestEvents = () => {
    createTestEvents.mutate();
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
        <ViewSelector
          activeMainTab="hosting"
          activeResponseFilter={responseFilter}
          onMainTabChange={(tab) => {
            if (tab === "invited") {
              setLocation("/event-list");
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
                Hosting
                {responseFilter !== "all" && ` - ${responseFilter.toUpperCase()}`}
              </h2>

              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation("/events/create")}
                className="text-xs"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <p className="text-center py-4 text-primary tracking-tight">
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : filteredEvents.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showStats={true}
                    isOwner={true}
                    userResponse={userResponses[event.id] || null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <p className="mb-4 text-gray-400 tracking-tight uppercase font-mono">
                      NO EVENTS CREATED
                    </p>
                    <Button
                      variant="default"
                      onClick={() => setLocation("/events/create")}
                      size="sm"
                    >
                      Host Your First Event
                    </Button>
                  </div>
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