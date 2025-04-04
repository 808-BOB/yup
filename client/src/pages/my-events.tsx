import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";

export default function MyEvents() {
  // In a real app, we'd get the userId from auth context
  const userId = 1;
  
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: [`/api/users/${userId}/events`]
  });
  
  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen">
      <Header />
      <ViewSelector activeTab="your-events" onTabChange={() => {}} />
      
      <main className="animate-fade-in">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Events</h2>
              <Link href="/events/create">
                <Button className="bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  New Event
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <p className="text-center py-4">Loading your events...</p>
            ) : error ? (
              <p className="text-center py-4 text-red-500">
                Error loading events. Please try again.
              </p>
            ) : events && events.length > 0 ? (
              <div>
                {events.map((event) => (
                  <div key={event.id} className="border-t border-gray-200 dark:border-gray-700 py-4">
                    <EventCard event={event} showStats={true} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="mb-4 text-gray-500">You haven't created any events yet.</p>
                <Link href="/events/create">
                  <Button className="bg-primary text-white">Create Your First Event</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
