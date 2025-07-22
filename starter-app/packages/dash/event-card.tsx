"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Share2, Edit, Check, X, MapPin } from "lucide-react";
import { formatDate, formatTime } from "../utils/date-formatter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/utils/use-toast";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { getSupabaseClient } from "@/utils/supabase";
import ShareEventModal from "./share-event-modal";
import { type Event } from "@/types";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

interface EventCardProps {
  event: Event & {
    response_counts?: {
      yupCount: number;
      nopeCount: number;
      maybeCount: number;
    };
  };
  showStats?: boolean;
  isOwner?: boolean;
  userResponse?: "yup" | "nope" | null;
}

export default function EventCard({
  event,
  showStats = false,
  isOwner = showStats,
  userResponse = null,
}: EventCardProps) {
  const formattedStartTime = formatTime(event.start_time);
  const formattedEndTime = event.end_time ? formatTime(event.end_time) : null;
  const timeRange = formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime;
  const { toast } = useToast();
  const { user } = useAuth();
  const branding = useBranding();
  const userId = user?.id;
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Use the response counts from the API if available
  const [responseCounts, setResponseCounts] = useState(
    event.response_counts || { yupCount: 0, nopeCount: 0, maybeCount: 0 }
  );

  // Only fetch counts if they're not provided and showStats is true
  React.useEffect(() => {
    const fetchResponseCounts = async () => {
      if (!showStats || !event.id || event.response_counts) return;

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('responses')
          .select('response_type, user_id, created_at')
          .eq('event_id', event.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Deduplicate responses by user_id, keeping only the latest response
        const uniqueResponses = data?.reduce((acc: any[], response) => {
          if (!acc.some(r => r.user_id === response.user_id)) {
            acc.push(response);
          }
          return acc;
        }, []) || [];

        // Count responses from deduplicated list
        const counts = uniqueResponses.reduce((acc, response) => {
          if (response.response_type === 'yup') acc.yupCount++;
          else if (response.response_type === 'nope') acc.nopeCount++;
          else if (response.response_type === 'maybe') acc.maybeCount++;
          return acc;
        }, { yupCount: 0, nopeCount: 0, maybeCount: 0 });

        setResponseCounts(counts);
      } catch (error) {
        console.error('Error fetching response counts:', error);
      }
    };

    fetchResponseCounts();
  }, [showStats, event.id, event.response_counts]);

  const actualUserResponse = userResponse;

  const getBorderColor = () => {
    if (isOwner) return { borderColor: branding.theme.primary + '4D' }; // 30% opacity
    if (actualUserResponse === "yup") return { borderColor: "#065f46" };
    if (actualUserResponse === "nope") return { borderColor: "#991b1b" };
    return { borderColor: "#374151" };
  };

  const handleCardClick = () => {
    router.push(`/events/${event.slug}`);
  };

  return (
    <>
      <Card
        className="w-full backdrop-blur-sm hover:border-gray-700 transition-colors relative z-10 shadow-lg cursor-pointer"
        style={{
          ...getBorderColor(),
          backgroundColor: branding.theme.secondary + 'F2', // 95% opacity
        }}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex flex-col">
            {/* Title and badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 
                className="font-bold tracking-tight text-base text-white font-inter"
              >
                {event.title}
              </h3>
              {isOwner && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{
                    backgroundColor: branding.theme.primary + '1A', // 10% opacity
                    borderColor: branding.theme.primary + '33', // 20% opacity
                    color: branding.theme.primary
                  }}
                >
                  Your Event
                </Badge>
              )}
              {(() => {
                const eventDate = new Date(event.date);
                const now = new Date();
                const twoDaysAgo = new Date(now);
                twoDaysAgo.setDate(now.getDate() - 2);
                return eventDate < twoDaysAgo;
              })() && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: branding.theme.secondary + 'CC', // 80% opacity
                    borderColor: getContrastingTextColor(branding.theme.secondary) + '66', // 40% opacity
                    color: getContrastingTextColor(branding.theme.secondary) + 'CC' // 80% opacity
                  }}
                >
                  Archived
                </Badge>
              )}
              {!isOwner && actualUserResponse && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    actualUserResponse === "yup"
                      ? "bg-green-900/20 border-green-800 text-green-500"
                      : "bg-red-900/20 border-red-800 text-red-500"
                  }`}
                >
                  {actualUserResponse === "yup" ? (
                    <><Check className="mr-1 h-3 w-3" /> Going</>
                  ) : (
                    <><X className="mr-1 h-3 w-3" /> Not Going</>
                  )}
                </Badge>
              )}
            </div>

            {/* Event Image */}
            {event.image_url && (
              <div className="mb-3 -mx-4">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-24 object-cover rounded-md"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Date and time */}
            <div className="flex flex-col gap-1 mb-2">
              <p 
                className="text-sm font-medium text-date"
              >
                {formatDate(event.date)}
              </p>
              <p 
                className="text-sm font-medium text-date"
              >
                {timeRange}
              </p>
            </div>

            {/* Location */}
            <div 
              className="text-sm mb-4 text-date flex items-center gap-1"
            >
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>

            {/* Bottom section with responses and actions */}
            <div className="flex justify-between items-center mt-auto">
              {/* Share and Edit buttons */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="text-sm flex items-center gap-1 hover:opacity-80 text-date"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/events/${event.slug}/edit`);
                    }}
                    className="text-sm flex items-center gap-1 hover:opacity-80 text-date"
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                )}
              </div>

              {/* Response counts */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-medium text-white"
                  >
                    {responseCounts.yupCount || 0} yup
                  </span>
                  <span 
                    className="text-sm text-date"
                  >
                    •
                  </span>
                  <span 
                    className="text-sm font-medium text-date"
                  >
                    {responseCounts.nopeCount || 0} nope
                  </span>
                </div>
              </div>

              {/* View RSVPs button */}
              <Button
                size="sm"
                variant="outline"
                asChild
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-3 text-xs text-white"
              >
                <Link href={`/events/${event.slug}/responses`}>
                  View RSVPs
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShareEventModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        event={event}
        userResponse={userResponse}
      />
    </>
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
          <li key={response.name}>
            {response.name}: {response.rsvp}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { EventResponses };