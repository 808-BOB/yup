import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
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
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(event.date)}, {formattedTime}
            </p>
          </div>
          
          {showStats ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary">12 yup</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-red-500">3 nope</span>
            </div>
          ) : (
            <Link href={`/events/${event.slug}`}>
              <a className="text-primary hover:text-primary/80">
                <ChevronRight className="w-5 h-5" />
              </a>
            </Link>
          )}
        </div>
        
        {showStats && (
          <div className="flex mt-3">
            <button className="text-sm text-primary mr-4">Share Link</button>
            <Link href={`/events/${event.slug}`}>
              <a className="text-sm text-primary">View Details</a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
