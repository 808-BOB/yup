import { Link } from "wouter";
import { ChevronRight, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { type Event, type Response } from "@shared/schema";

interface EventCardProps {
  event: Event;
  showStats?: boolean;
}

export default function EventCard({ event, showStats = false }: EventCardProps) {
  const formattedTime = `${event.startTime.slice(0, 5)}`;

  const { data: responses } = useQuery<Response[]>({
    queryKey: [`/api/events/${event.id}/responses`],
    enabled: showStats
  });

  return (
    <Card className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors relative z-10">
      <Link href={`/events/${event.slug}`}>
        <a className="block">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold tracking-tight">{event.title}</h3>
                <p className="text-sm text-gray-400 tracking-tight">
                  {formatDate(event.date)}, {formattedTime}
                </p>
              </div>

              {showStats && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary font-medium">
                    {responses?.filter(r => r.response === 'yup').length || 0} yup
                  </span>
                  <span className="text-sm text-gray-600">|</span>
                  <span className="text-sm text-gray-400 font-medium">
                    {responses?.filter(r => r.response === 'nope').length || 0} nope
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </a>
      </Link>

      {!showStats && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      )}
      {showStats && (
        <>
          <Link href={`/events/${event.slug}/responses`}>
            <a className="absolute bottom-4 right-4 text-sm text-primary hover:text-primary/80 font-medium">View RSVPs</a>
          </Link>
        <div className="flex px-4 pb-4 mt-1 space-x-4">
          <button 
            className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: "Link Copied!",
                description: "Event link copied to clipboard"
              });
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE</span>
          </button>
        </div>
      </>
      )}
    </Card>
  );
}


// Placeholder for RSVP page
function EventResponses({ eventId }: { eventId: string }) {
  // Sample RSVP data - replace with actual data fetching logic
  const responses = [
    { name: "Alice", rsvp: "Yup" },
    { name: "Bob", rsvp: "Nope" },
    { name: "Charlie", rsvp: "Yup" },
  ];

  return (
    <div>
      <h1>RSVPs for Event {eventId}</h1>
      <ul>
        {responses.map((response) => (
          <li key={response.name}>{response.name}: {response.rsvp}</li>
        ))}
      </ul>
    </div>
  );
}

export { EventResponses };