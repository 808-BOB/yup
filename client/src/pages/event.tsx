import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import InviteModal from "@/components/invite-modal";
import { useRoute, useLocation, Link } from "wouter";
import { Calendar, MapPin, User, Users, ArrowLeft, Eye, Edit } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-formatter";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmationMessage from "@/components/confirmation-message";
import GuestRsvpModal from "@/components/guest-rsvp-modal";
import PageTitle from "@/components/page-title";
import { type Event as BaseEvent, type Response } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Extended Event type with host display name
type Event = BaseEvent & {
  hostDisplayName?: string;
};

export default function EventPage() {
  // Hooks that must always be called
  const [, params] = useRoute("/events/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // State management
  const [userResponse, setUserResponse] = useState<"yup" | "nope" | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<"yup" | "nope" | null>(
    null,
  );

  // Event data query
  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Event>({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: !!params?.slug,
  });

  // User's response query - only run if user is logged in and event data is loaded
  const { data: existingResponse } = useQuery<Response>({
    queryKey: [`/api/events/${event?.id}/users/${user?.id}/response`],
    enabled: !!event && !!user,
  });
  
  // Get response counts to determine if threshold is reached for visibility
  const { data: responseCounts = { yupCount: 0, nopeCount: 0 } } = useQuery<{
    yupCount: number;
    nopeCount: number;
  }>({
    queryKey: [`/api/events/${event?.id}/responses/count`],
    enabled: !!event?.id,
  });

  // Update state when existing response is loaded
  useEffect(() => {
    if (existingResponse) {
      setUserResponse(existingResponse.response as "yup" | "nope");
    }
  }, [existingResponse]);

  // Event handlers
  const handleGuestSuccess = (response: "yup" | "nope") => {
    setUserResponse(response);
    setShowConfirmation(true);
  };

  const handleResponse = async (response: "yup" | "nope") => {
    if (!event) return;

    try {
      const isLoggedIn = !!user;

      // For guest users, show the guest RSVP modal if guest RSVP is allowed
      if (!isLoggedIn && event.allowGuestRsvp) {
        setPendingResponse(response);
        setShowGuestModal(true);
        return;
      }

      // For logged in users, submit response directly
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in to respond to this event",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("POST", "/api/responses", {
        eventId: event.id,
        userId: user.id,
        response,
      });

      setUserResponse(response);
      setShowConfirmation(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 tracking-tight">
            Loading event details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 tracking-tight">
            Event not found. It may not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Confirmation state
  if (showConfirmation && userResponse) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <ConfirmationMessage response={userResponse} event={event} />
        </div>
      </div>
    );
  }

  const formattedTime = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

  // Enhanced debug for imageUrl
  console.log("Event image URL:", event.imageUrl ? "exists" : "missing");
  if (event.imageUrl?.startsWith("data:")) {
    console.log(
      "Image is base64 data, first 40 chars:",
      event.imageUrl.substring(0, 40),
    );
    // Print the length of the base64 string for debugging
    console.log("Image base64 data length:", event.imageUrl.length);
  }

  // Main UI
  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
      <Header />
      {/* Set page title to event name */}
      {event && <PageTitle title={event.title} />}
      <main className="flex-1 overflow-auto mb-6">
        <div className="flex flex-col animate-fade-in">
          <div className="flex justify-between mb-4">
            {/* Only show Back to Events button if user is logged in */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700"
                onClick={() => setLocation("/my-events")}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Events
              </Button>
            )}
            
            {/* View Responses button top right with wouter routing */}
            {(user && user.id === event.hostId) || 
              (user && event.showRsvpsToInvitees) || 
              (event.showRsvpsAfterThreshold && responseCounts.yupCount >= event.rsvpVisibilityThreshold) ? (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700"
                onClick={() => setLocation(`/events/${event.slug}/responses`)}
              >
                <Eye className="w-4 h-4" /> View Responses
              </Button>
            ) : null}
          </div>

          {/* Event Image - matching the style from event-card.tsx which we know works */}
          {event.imageUrl ? (
            <div className="w-full h-48 mb-6 overflow-hidden rounded-sm bg-gray-800">
              {event.imageUrl.startsWith("data:") ? (
                <div
                  className="w-full h-full bg-no-repeat bg-center bg-cover"
                  style={{ backgroundImage: `url(${event.imageUrl})` }}
                >
                  {/* Image debugging was here */}
                </div>
              ) : (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", event.imageUrl);
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          ) : (
            <div className="mb-6">
              {/* No image */}
            </div>
          )}
          <Card className="mb-6 animate-slide-up bg-gray-900 border border-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">
                    {event.title}
                  </h2>
                </div>
                
                {/* Edit button in top right */}
                {user?.id === event.hostId && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        toast({
                          title: "Login Required",
                          description: "Please log in to edit this event",
                          variant: "destructive",
                        });
                        return;
                      }
                      // Use client-side routing
                      setLocation(`/events/${event.slug}/edit`);
                    }}
                    className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Event labels row */}
              {user && user.id === event.hostId && (
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 border-primary/20 text-primary"
                  >
                    Your Event
                  </Badge>
                  
                  <Badge
                    variant="outline" 
                    className="text-xs bg-gray-800 border-gray-700 text-primary font-mono uppercase"
                  >
                    {event.status === "open" ? "Public" : event.status}
                  </Badge>
                  
                  {/* RSVP visibility badges */}
                  {!event.showRsvpsToInvitees && (
                    <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700 text-gray-400">
                      RSVPs Hidden
                    </Badge>
                  )}
                  {event.showRsvpsAfterThreshold && (
                    <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700 text-gray-400">
                      Visible after {event.rsvpVisibilityThreshold} YUPs
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">
                      {formatDate(event.date)}
                    </p>
                    <p className="text-gray-500 tracking-tight">
                      {formattedTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">
                      {event.location}
                    </p>
                    {event.address && (
                      <p className="text-gray-500 tracking-tight">
                        {event.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">
                      {user && user.id === event.hostId
                        ? `Hosted by you (${event.hostDisplayText || user.displayName})`
                        : `Hosted by ${event.hostDisplayText || event.hostDisplayName || "User"}`}
                    </p>
                  </div>
                </div>

                {event.allowGuestRsvp && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <div className="font-medium tracking-tight flex items-center">
                        <span>Guest RSVP</span>{" "}
                        <span className="ml-1 text-primary flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </span>
                      </div>
                      {event.allowPlusOne && (
                        <p className="text-gray-500 tracking-tight">
                          Bring up to {event.maxGuestsPerRsvp}{" "}
                          {event.maxGuestsPerRsvp === 1 ? "guest" : "guests"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                


                {event.description && (
                  <div className="border-t border-gray-800 pt-3 mt-4">
                    <p className="text-gray-400 tracking-tight">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-auto pb-6">
            <p className="text-center mb-8 text-gray-400 uppercase tracking-wide font-mono">
              ARE YOU IN?
            </p>

            <div className="flex gap-8 justify-center mb-8">
              <Button
                onClick={() => handleResponse("nope")}
                className={`btn-nope w-32 h-32 rounded-sm flex items-center justify-center border transition-colors ${
                  userResponse === "nope"
                    ? "bg-gray-800 border-gray-600 hover:bg-gray-800"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <span className={`text-2xl font-bold uppercase tracking-widest ${
                  userResponse === "nope" ? "text-gray-200" : "text-gray-400"
                }`}>
                  NOPE
                </span>
              </Button>

              <Button
                onClick={() => handleResponse("yup")}
                className={`btn-yup w-32 h-32 rounded-sm flex items-center justify-center border transition-colors ${
                  userResponse === "yup"
                    ? "bg-primary/20 border-primary hover:bg-primary/20"
                    : "bg-gray-900 border-primary/50 hover:border-primary"
                }`}
              >
                <span className="text-primary text-2xl font-bold uppercase tracking-widest">
                  YUP
                </span>
              </Button>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  const url = `${window.location.origin}/events/${event.slug}`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "Link Copied!",
                    description:
                      "Share this link to invite people to your event",
                  });
                }}
                className="flex-1 bg-gray-900 border border-gray-800 hover:border-gray-700"
              >
                Share Event Link
              </Button>
              {user && user.id === event.hostId && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Invite People
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Guest RSVP Modal */}
      {showGuestModal && pendingResponse && (
        <GuestRsvpModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          event={event}
          response={pendingResponse}
          onSuccess={handleGuestSuccess}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          eventId={event.id}
        />
      )}
    </div>
  );
}