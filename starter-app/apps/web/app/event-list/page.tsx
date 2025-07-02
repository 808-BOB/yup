"use client";
import * as React from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import Header from "@/dash/header";
import ViewSelector from "@/dash/view-selector";
import EventCard from "@/dash/event-card";
import { useAuth } from "@/utils/auth-context";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent } from "@/ui/card";

interface EventRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  location: string;
  host_id: string;
}

const fetchInvitedEvents = async (userId: string) => {
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      events!inner(
        id,
        title,
        slug,
        date,
        location,
        host_id
      )
    `)
    .eq("user_id", userId);
  
  if (error) throw error;
  
  // Extract events from invitations and filter out own events
  const events = data
    .map((inv: any) => inv.events)
    .filter((event: any) => event && event.host_id !== userId);
    
  return events as EventRow[];
};

const fetchUserResponses = async (userId: string) => {
  const { data, error } = await supabase
    .from("responses")
    .select("event_id, response_type")
    .eq("user_id", userId);
    
  if (error) throw error;
  
  // Convert to object with event_id as key
  const responses: Record<string, "yup" | "nope" | "maybe"> = {};
  data.forEach((resp: any) => {
    responses[resp.event_id] = resp.response_type;
  });
  
  return responses;
};

type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

export default function EventListPage() {
  // Redirect unauthenticated users
  useRequireAuth();

  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = React.useState<ResponseFilter>("all");

  const { data: events, error: eventsError } = useSWR<EventRow[]>(
    user ? ["invited-events", user.id] : null, 
    () => fetchInvitedEvents(user!.id)
  );
  
  const { data: userResponses = {} } = useSWR<Record<string, "yup" | "nope" | "maybe">>(
    user ? ["user-responses", user.id] : null,
    () => fetchUserResponses(user!.id)
  );

  if (!user) {
    return null; // AuthProvider will redirect
  }

  const isLoading = !events && !eventsError;

  const now = new Date();
  now.setDate(now.getDate() - 2); // archive threshold
  const cutoff = now.toISOString().slice(0, 10);

  const filteredEvents = (events || []).filter(event => {
    const response = userResponses[event.id];
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
    <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-gray-950">
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

      <main className="flex-1 w-full animate-fade-in pb-32">
        <Card className="w-full bg-gray-900/95 backdrop-blur-sm border border-gray-800 shadow-lg">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight uppercase">
                Invited Events
                {filter !== "all" && ` - ${filter.toUpperCase()}`}
              </h2>
              <Link href="/events/create">
                <Button size="sm">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading invited events...</p>
                </div>
              </div>
            ) : eventsError ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-2">Failed to load events</p>
                <p className="text-sm text-gray-500">Please try refreshing the page</p>
              </div>
            ) : filteredEvents.length ? (
              <div className="space-y-4">
                {filteredEvents.map(e => (
                  <EventCard 
                    key={e.id} 
                    event={e as any} 
                    showStats={false} 
                    isOwner={false} 
                    userResponse={userResponses[e.id] || null} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-2">
                  {filter === "archives" 
                    ? "No archived events" 
                    : filter === "all" 
                      ? "No invitations yet" 
                      : `No "${filter.toUpperCase()}" responses`
                  }
                </p>
                <p className="text-sm text-gray-500">
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

        {filter !== "archives" && (
          <button
            onClick={() => setFilter("archives")}
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white text-center"
          >
            View Archives
          </button>
        )}
      </main>
    </div>
  );
} 