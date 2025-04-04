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
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
      <Header />
      <ViewSelector activeTab="your-events" onTabChange={() => {}} />
      
      <main className="flex-1 overflow-auto animate-fade-in">
        <Card className="bg-gray-900 border border-gray-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight uppercase">Your Events</h2>
              <Link href="/events/create">
                <Button className="btn-primary py-2 px-4 text-xs flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  NEW EVENT
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <p className="text-center py-4 text-gray-400 tracking-tight font-mono">LOADING EVENTS...</p>
            ) : error ? (
              <p className="text-center py-4 text-primary tracking-tight">
                ERROR LOADING EVENTS. PLEASE TRY AGAIN.
              </p>
            ) : events && events.length > 0 ? (
              <div className="w-full -mx-6">
                {events.map((event) => (
                  <div key={event.id} className="border-t border-gray-800 px-6 py-4">
                    <EventCard event={event} showStats={true} />
                  </div>
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
