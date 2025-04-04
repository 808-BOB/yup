import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import ViewSelector from "@/components/view-selector";
import EventCard from "@/components/event-card";
import { type Event } from "@shared/schema";

export default function EventList() {
  // In a real app, we'd get the userId from auth context
  const userId = 1;
  
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: [`/api/users/${userId}/invites`]
  });
  
  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen">
      <Header />
      <ViewSelector activeTab="invited" onTabChange={() => {}} />
      
      <main className="animate-fade-in">
        {isLoading ? (
          <p className="text-center py-4">Loading events...</p>
        ) : error ? (
          <p className="text-center py-4 text-red-500">
            Error loading events. Please try again.
          </p>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No events found. Check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
}
