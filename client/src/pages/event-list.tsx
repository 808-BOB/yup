
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";

export default function EventList() {
  // In a real app, we'd get the userId from auth context
  const userId = 1;
  
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: [`/api/users/${userId}/invites`]
  });
  
  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gray-950">
      <Header />
      <ViewSelector activeTab="invited" onTabChange={() => {}} />
      
      <main className="animate-fade-in">
        <Card className="bg-gray-900 border border-gray-800">
          <CardContent className="p-6">
            {isLoading ? (
              <p className="text-center py-4 text-gray-400 tracking-tight">LOADING EVENTS...</p>
            ) : error ? (
              <p className="text-center py-4 text-primary">
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 font-mono uppercase tracking-wide">NO EVENTS FOUND</p>
                <p className="text-gray-600 mt-2 text-sm">Check back later or create a new event</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
