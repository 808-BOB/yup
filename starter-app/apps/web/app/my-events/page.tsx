"use client";
import * as React from "react";
import useSWR from "swr";
import Header from "@/dash/header";
import ViewSelector from "@/dash/view-selector";
import { useAuth } from "@/utils/auth-context";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent } from "@/ui/card";
import EventCard from "@/dash/event-card";

interface EventRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  location: string;
}

const fetchEvents = async (userId: string) => {
  const response = await fetch(`/api/events?hostId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  const result = await response.json();
  return result.events as EventRow[];
};

type ResponseFilter = "all" | "archives";

export default function MyEventsPage() {
  // Redirect unauthenticated users
  useRequireAuth();

  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = React.useState<ResponseFilter>("all");

  const { data: events, error } = useSWR<EventRow[]>(user ? ["my-events", user.id] : null, () => fetchEvents(user!.id));

  if (!user) {
    return null; // AuthProvider will redirect
  }

  const isLoading = !events && !error;

  const now = new Date();
  now.setDate(now.getDate() - 2); // archive threshold
  const cutoff = now.toISOString().slice(0, 10);

  const visible = (events || []).filter(ev => {
    const archived = ev.date < cutoff;
    if (filter === "archives") return archived;
    return !archived;
  });

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

      <main className="flex-1 w-full animate-fade-in pb-32">
        <Card className="w-full bg-gray-900/95 backdrop-blur-sm border border-gray-800 shadow-lg">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight uppercase">Hosting</h2>
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
                  <p className="text-sm text-gray-500">Loading your events...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-2">Failed to load events</p>
                <p className="text-sm text-gray-500">Please try refreshing the page</p>
              </div>
            ) : visible.length ? (
              <div className="space-y-4">
                {visible.map(e => (
                  <EventCard key={e.id} event={e as any} showStats isOwner userResponse={null} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-2">
                  {filter === "archives" ? "No archived events" : "No events yet"}
                </p>
                {filter !== "archives" && (
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first event to get started
                  </p>
                )}
                {filter !== "archives" && (
                  <Link href="/events/create">
                    <Button variant="outline" size="sm" className="text-gray-400 border-gray-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Event
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
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white text-center"
          >
            View Archives
          </button>
        )}
      </main>
    </div>
  );
} 