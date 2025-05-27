import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Share2, Edit, Check, X } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-formatter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Event, type Response } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ShareEventModal from "./share-event-modal";

interface EventCardProps {
  event: Event;
  showStats?: boolean;
  isOwner?: boolean;
  userResponse?: "yup" | "nope" | null;
}

export default function EventCard({
  event,
  showStats = false,
  isOwner = showStats, // If showing stats, assume the user is the owner
  userResponse = null,
}: EventCardProps) {
  const formattedTime = formatTime(event.startTime);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const [_, setLocation] = useLocation(); // Not used, we use window.location.href for navigation
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: responses } = useQuery<Response[]>({
    queryKey: [`/api/events/${event.id}/responses`],
    enabled: showStats,
  });
  
  // Get response counts to determine if threshold is reached for visibility
  const { data: responseCounts = { yupCount: 0, nopeCount: 0 } } = useQuery<{
    yupCount: number;
    nopeCount: number;
  }>({
    queryKey: [`/api/events/${event.id}/responses/count`],
    enabled: !!event.id,
  });

  // Query for user's response to this event if not provided and user is logged in
  const { data: responseData } = useQuery<Response>({
    queryKey: [`/api/events/${event.id}/users/${userId}/response`],
    enabled: !showStats && userResponse === null && !!userId, 
  });

  // Use the provided userResponse or the one fetched from the API
  const actualUserResponse =
    userResponse || (responseData?.response as "yup" | "nope" | null);

  // Function to determine card border color based on response or ownership
  const getBorderColor = () => {
    if (isOwner) return "border-primary/30"; // Owner events have primary color border
    if (actualUserResponse === "yup") return "border-green-700"; // "Yup" responses have green border
    if (actualUserResponse === "nope") return "border-red-800"; // "Nope" responses have red border
    return "border-gray-800"; // Default border
  };

  return (
    <>
      <Card
        className={`w-full bg-gray-900 ${getBorderColor()} hover:border-gray-700 transition-colors relative z-10`}
      >
        <div
          onClick={() => setLocation(`/events/${event.slug}`)}
          className="cursor-pointer"
        >
          {/* Event Image Section */}
          {event.imageUrl && (
            <div className="w-full h-32 overflow-hidden">
              {event.imageUrl.startsWith("data:") ? (
                // For base64 images
                <div
                  className="w-full h-full bg-no-repeat bg-center bg-cover"
                  style={{ backgroundImage: `url(${event.imageUrl})` }}
                ></div>
              ) : (
                // For regular URLs
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", e);
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          )}

          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
              <div className="mb-2 sm:mb-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold tracking-tight">{event.title}</h3>
                  {isOwner && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-primary/10 border-primary/20 text-primary"
                    >
                      Your Event
                    </Badge>
                  )}
                  {(() => {
                    const eventDate = new Date(event.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate < today;
                  })() && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-800 border-gray-700 text-gray-400"
                    >
                      Archived
                    </Badge>
                  )}
                  {!isOwner && actualUserResponse === "yup" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-900/20 border-green-800 text-green-500"
                    >
                      <Check className="mr-1 h-3 w-3" /> Going
                    </Badge>
                  )}
                  {!isOwner && actualUserResponse === "nope" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-900/20 border-red-800 text-red-500"
                    >
                      <X className="mr-1 h-3 w-3" /> Not Going
                    </Badge>
                  )}
                  {!isOwner && actualUserResponse === null && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-900/20 border-yellow-800 text-yellow-500"
                    >
                      No Response
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 tracking-tight">
                  {formatDate(event.date)}, {formattedTime}
                </p>
              </div>

              {showStats && (
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <span className="text-sm text-white font-medium">
                    {responses?.filter((r) => r.response === "yup").length || 0}{" "}
                    yup
                  </span>
                  <span className="text-sm text-gray-600">|</span>
                  <span className="text-sm text-[var(--primary)] font-medium">
                    {responses?.filter((r) => r.response === "nope").length || 0}{" "}
                    nope
                  </span>
                  {responses?.filter((r) => r.response === "maybe").length > 0 && (
                    <>
                      <span className="text-sm text-gray-600">|</span>
                      <span className="text-sm text-gray-400 font-medium">
                        {responses?.filter((r) => r.response === "maybe").length || 0}{" "}
                        maybe
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </div>

        {!showStats && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ChevronRight className="w-5 h-5 text-primary" />
          </div>
        )}
        {showStats && (
          <>
            <div className="flex justify-between px-4 pb-4 mt-1">
              <div className="flex space-x-4">
                <button
                  className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation(`/events/${event.slug}/edit`);
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Check if slug exists, otherwise use the ID
                    const linkTarget = event.slug 
                      ? `/events/${event.slug}/responses`
                      : `/events/${event.id}/responses`;
                    console.log("Navigating to:", linkTarget, "Event:", event);
                    setLocation(linkTarget);
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer flex items-center"
                >
                  View RSVPs
                  {(
                    (!event.showRsvpsToInvitees || 
                    (event.showRsvpsAfterThreshold && responseCounts.yupCount < event.rsvpVisibilityThreshold))
                  ) && (
                    <span className="inline-block ml-1 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </span>
                  )}
                </button>
                {(
                  (!event.showRsvpsToInvitees || 
                  (event.showRsvpsAfterThreshold && responseCounts.yupCount < event.rsvpVisibilityThreshold))
                ) && (
                  <div className="absolute right-0 bottom-full mb-1 w-48 bg-gray-800 p-2 rounded text-xs text-gray-300 invisible group-hover:visible shadow-lg z-10">
                    {!event.showRsvpsToInvitees && <div>RSVPs hidden from guests</div>}
                    {event.showRsvpsAfterThreshold && (
                      <div>
                        {responseCounts.yupCount >= event.rsvpVisibilityThreshold 
                        ? "RSVPs now visible" 
                        : `RSVPs visible after ${event.rsvpVisibilityThreshold} positive responses (${responseCounts.yupCount}/${event.rsvpVisibilityThreshold})`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <ShareEventModal
        event={event}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userResponse={actualUserResponse === "yup" ? "yup" : actualUserResponse === "nope" ? "nope" : "maybe"}
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