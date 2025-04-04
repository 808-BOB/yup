
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
    <div className="w-full max-w-md mx-auto p-8 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector activeTab="invited" onTabChange={() => {}} />
      
      <main className="flex-1 w-full overflow-auto animate-fade-in">
        <Card className="w-full h-full bg-gray-900 border border-gray-800">
          <CardContent className="w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight uppercase">Invited Events</h2>
            </div>
            {isLoading ? (
              <p className="text-center py-4 text-gray-400 tracking-tight font-mono">LOADING EVENTS...</p>
            ) : error ? (
              <p className="text-center py-4 text-primary tracking-tight">
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : events && events.length > 0 ? (
              <div className="w-full space-y-4 pt-4">
                {events.map((event) => (
                  <div key={event.id} className="border-t border-gray-800 pt-4 first:border-t-0 first:pt-0">
                    <EventCard event={event} />
                  </div>
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
