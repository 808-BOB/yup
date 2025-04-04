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
    <div className="w-full max-w-md mx-auto p-8 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector activeTab="your-events" onTabChange={() => {}} />
      
      <main className="flex-1 w-full overflow-auto animate-fade-in pb-32 z-0">
        <Card className="w-full bg-gray-900 border border-gray-800">
          <CardContent className="w-full p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">Your Events</h2>
            
            {isLoading ? (
              <p className="text-center py-4 text-gray-400 tracking-tight font-mono">LOADING EVENTS...</p>
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
                <p className="mb-4 text-gray-400 tracking-tight uppercase font-mono">NO EVENTS CREATED</p>
                <Link href="/events/create">
                  <Button className="btn-primary">CREATE YOUR FIRST EVENT</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
