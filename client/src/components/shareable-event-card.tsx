import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, Clock, MapPin } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-formatter";
import { type Event, type Response } from "@shared/schema";
import { useBranding, getLogoUrl } from "@/contexts/BrandingContext";

interface ShareableEventCardProps {
  event: Event;
  userResponse?: "yup" | "nope" | "maybe";
  userName?: string;
  className?: string;
}

export default function ShareableEventCard({
  event,
  userResponse,
  userName,
  className = "",
}: ShareableEventCardProps) {
  const branding = useBranding();
  const { isPremium } = branding;
  const formattedTime = formatTime(event.startTime);
  const eventLogo = getLogoUrl(branding);
  
  // Get response status text and styling
  const getResponseStatus = () => {
    if (userResponse === "yup") {
      return {
        text: "Going",
        icon: <Check className="mr-1 h-3 w-3" />,
        className: "bg-green-900/20 border-green-800 text-green-500"
      };
    } else if (userResponse === "nope") {
      return {
        text: "Not Going",
        icon: <X className="mr-1 h-3 w-3" />,
        className: "bg-red-900/20 border-red-800 text-red-500"
      };
    } else {
      return {
        text: "Pending Response",
        icon: null,
        className: "bg-yellow-900/20 border-yellow-800 text-yellow-500"
      };
    }
  };

  const responseStatus = getResponseStatus();
  const isPastEvent = new Date(event.date).getTime() < new Date().setHours(0,0,0,0);

  return (
    <Card className={`overflow-hidden border border-gray-800 shadow-lg ${className}`}>
      {/* Header with logo */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center">
          <span className="font-bold text-xl tracking-tight">YUP.</span>
          <span className="text-primary text-xl font-bold">RSVP</span>
        </div>
        {isPremium && eventLogo && (
          <img 
            src={eventLogo} 
            alt="Event Logo"
            className="h-6 w-auto object-contain" 
          />
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-bold text-lg tracking-tight mb-1">{event.title}</h3>
          <p className="text-gray-400 text-sm">{event.description}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {formatDate(event.date)}
          </div>
          {event.startTime && (
            <div className="flex items-center text-sm text-gray-300">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              {formattedTime}
            </div>
          )}
          {event.location && (
            <div className="flex items-center text-sm text-gray-300">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              {event.location}
            </div>
          )}
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {isPastEvent && (
            <Badge
              variant="outline"
              className="text-xs bg-gray-800 border-gray-700 text-gray-400"
            >
              Archived
            </Badge>
          )}
          
          {userName && userResponse && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{userName}'s response:</span>
              <Badge
                variant="outline"
                className={`text-xs ${responseStatus.className}`}
              >
                {responseStatus.icon} {responseStatus.text}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Footer */}
      <div className="bg-gray-900 py-2 px-4 border-t border-gray-800 text-center text-xs text-gray-500">
        View and respond to this event at yup.rsvp
      </div>
    </Card>
  );
}