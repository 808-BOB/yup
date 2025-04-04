import { Link } from "wouter";
import { ChevronRight, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";
import { Card, CardContent } from "@/components/ui/card";
import { type Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  showStats?: boolean;
}

export default function EventCard({ event, showStats = false }: EventCardProps) {
  const formattedTime = `${event.startTime.slice(0, 5)}`;
  
  return (
    <Card className="w-full mb-4 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold tracking-tight">{event.title}</h3>
            <p className="text-sm text-gray-400 tracking-tight">
              {formatDate(event.date)}, {formattedTime}
            </p>
          </div>
          
          {showStats ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary font-medium">12 yup</span>
              <span className="text-sm text-gray-600">|</span>
              <span className="text-sm text-gray-400 font-medium">3 nope</span>
            </div>
          ) : (
            <Link href={`/events/${event.slug}`}>
              <a className="text-primary hover:text-primary/80 hover:bg-gray-800 p-1 rounded-sm transition-colors">
                <ChevronRight className="w-5 h-5" />
              </a>
            </Link>
          )}
        </div>
        
        {showStats && (
          <div className="flex mt-3 space-x-4">
            <button className="text-xs text-primary flex items-center gap-1 hover:text-primary/80">
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE</span>
            </button>
            <Link href={`/events/${event.slug}`}>
              <a className="text-xs text-primary hover:text-primary/80">VIEW DETAILS</a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
