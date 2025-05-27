import React, { memo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Edit } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description?: string | null;
    location: string;
    date: string;
    startTime: string;
    endTime?: string;
    imageUrl?: string | null;
    slug: string;
    hostId: string;
  };
  isHost?: boolean;
  responseCount?: number;
  onEditClick?: () => void;
}

const EventCard = memo(({ event, isHost, responseCount, onEditClick }: EventCardProps) => {
  const eventDate = new Date(`${event.date}T${event.startTime}`);
  const formattedDate = format(eventDate, "MMM d, yyyy");
  const formattedTime = format(eventDate, "h:mm a");

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      {event.imageUrl && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {isHost && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={(e) => {
                e.preventDefault();
                onEditClick?.();
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-lg">{event.title}</CardTitle>
          {!event.imageUrl && isHost && (
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              onClick={(e) => {
                e.preventDefault();
                onEditClick?.();
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {event.description && (
          <p className="text-slate-300 text-sm line-clamp-2">{event.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-300 text-sm">
            <Calendar className="w-4 h-4 mr-2 text-[#84793d]" />
            {formattedDate} at {formattedTime}
          </div>
          
          <div className="flex items-center text-slate-300 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-[#84793d]" />
            {event.location}
          </div>
          
          {responseCount !== undefined && (
            <div className="flex items-center text-slate-300 text-sm">
              <Users className="w-4 h-4 mr-2 text-[#84793d]" />
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </div>
          )}
        </div>
        
        <Link href={`/event/${event.slug}`}>
          <Button className="w-full bg-[#84793d] hover:bg-[#6b5f31] text-white">
            View Event
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});

EventCard.displayName = "EventCard";

export { EventCard };