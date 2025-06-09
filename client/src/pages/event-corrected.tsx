import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import InviteModal from "@/components/invite-modal";
import { useRoute, useLocation, Link } from "wouter";
import { Calendar, MapPin, User, Users, ArrowLeft, Eye, Edit, Plus } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-formatter";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmationMessage from "@/components/confirmation-message";
import GuestRsvpModal from "@/components/guest-rsvp-modal";
import EventConnections from "@/components/event-connections";
import PageTitle from "@/components/page-title";
import { type Event as BaseEvent, type Response } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
// import EventBrandingProvider, { getHostLogoUrl, HostBranding } from "@/components/event-branding-provider";

// Extended Event type with host display name and branding
type Event = BaseEvent & {
  hostDisplayName?: string;
  hostBranding?: HostBranding | null;
};

export default function EventPage() {
  // Hooks that must always be called
  const [, params] = useRoute("/events/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();

  // State management
  const [userResponse, setUserResponse] = useState<"yup" | "nope" | "maybe" | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<"yup" | "nope" | "maybe" | null>(null);

  // Guest information state
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [previousResponse, setPreviousResponse] = useState<"yup" | "nope" | "maybe" | null>(null);

  // Event data query
  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Event>({
    queryKey: [`/api/events/${params?.slug}`],
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
      setUserResponse(existingResponse.response_type as "yup" | "nope" | "maybe");
    } else if (user) {
      // Clear response when user is logged in but no response exists
      setUserResponse(null);
    }
  }, [existingResponse, user]);

  // Event handlers
  const handleGuestSuccess = (response: "yup" | "nope" | "maybe", guestNameValue: string, guestEmailValue: string) => {
    setUserResponse(response);
    setShowConfirmation(true);

    // Save guest information for future use
    setGuestName(guestNameValue);
    setGuestEmail(guestEmailValue);
    setPreviousResponse(response);
  };

  const handleResponse = async (response: "yup" | "nope" | "maybe") => {
    if (!event) return;

    try {
      if (user) {
        // User is logged in, submit response directly
        await apiRequest("POST", `/api/events/${event.id}/respond`, {
          response,
          userId: user.id,
        });

        setUserResponse(response);
        setShowConfirmation(true);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/users/${user.id}/response`] });
        queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/responses/count`] });
      } else if (event.allow_guest_rsvp) {
        // Guest response - show guest modal
        setPendingResponse(response);
        setShowGuestModal(true);
      } else {
        toast({
          title: "Login Required",
          description: "Please log in to RSVP for this event.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isHost = user && event && user.id === event.host_id;

  // Early returns for loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-2">Event not found</h1>
          <p className="text-gray-400 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Format event date and time
  const eventDate = formatDate(event.date);
  const startTime = formatTime(event.start_time);
  const endTime = event.end_time ? formatTime(event.end_time) : null;

  // Event image with fallback
  const eventImage = event.image_url || "/api/placeholder/400/300";

  return (
    <EventBrandingProvider hostId={event.host_id}>
      {({ hostBranding, primaryColor: brandPrimaryColor, textColor: brandTextColor }) => (
        <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
          <div className="sticky top-0 z-50 bg-gray-950 pt-8">
            <Header />
          </div>

          <main className="flex-1 w-full animate-fade-in pb-32">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setLocation("/my-events")}
                className="mb-4 p-0 h-auto font-normal text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to events
              </Button>

              {/* Host branding section */}
              {isHost && event.host_id && (
                <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Your Event</span>
                    <div className="flex gap-2">
                      <Link href={`/events/${event.slug}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/events/${event.slug}/responses`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Responses
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Event image */}
              {event.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
              
              {event.description && (
                <p className="text-slate-400 mb-6">{event.description}</p>
              )}
            </div>

            {/* Event details */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{eventDate}</p>
                    <p className="text-slate-400 text-sm">
                      {startTime}
                      {endTime && ` - ${endTime}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{event.location}</p>
                    {event.address && (
                      <p className="text-slate-400 text-sm">{event.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">
                      Hosted by {event.hostDisplayName || `User ${event.host_id}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest settings notice */}
            {event.allow_guest_rsvp && !user && (
              <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      Guest RSVPs are welcome
                      {event.allow_plus_one && event.max_guests_per_rsvp && event.max_guests_per_rsvp > 1 && 
                        ` (up to ${event.max_guests_per_rsvp} guests per RSVP)`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="space-y-4">
              {user && (user.is_premium || user.is_premium) && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Others
                </Button>
              )}

              {/* RSVP buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleResponse("yup")}
                  variant={userResponse === "yup" ? "default" : "outline"}
                  className="flex-1"
                  style={userResponse === "yup" ? { 
                    backgroundColor: brandPrimaryColor || primaryColor || 'hsl(308, 100%, 66%)',
                    color: brandTextColor || accessibleTextColor 
                  } : {}}
                >
                  {event.use_custom_rsvp_text && event.custom_yup_text 
                    ? event.custom_yup_text
                    : "YUP!"}
                </Button>

                <Button
                  onClick={() => handleResponse("maybe")}
                  variant={userResponse === "maybe" ? "default" : "outline"}
                  className="flex-1"
                >
                  MAYBE
                </Button>

                <Button
                  onClick={() => handleResponse("nope")}
                  variant={userResponse === "nope" ? "default" : "outline"}
                  className="flex-1"
                >
                  {event.use_custom_rsvp_text && event.custom_nope_text 
                    ? event.custom_nope_text
                    : "NOPE"}
                </Button>
              </div>
            </div>

            {/* Event connections/responses display */}
            <div className="mt-8">
              <EventConnections 
                eventId={event.id} 
                eventDate={event.date}
                eventTime={event.start_time}
                eventEndTime={event.end_time}
              />
            </div>

            {/* Host actions */}
            {isHost && (
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-white font-medium mb-3">Host Actions</h3>
                <div className="flex gap-2">
                  <Link href={`/events/${event.slug}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Event
                    </Button>
                  </Link>
                  <Link href={`/events/${event.slug}/responses`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Responses
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </main>

          {/* Modals */}
          {showConfirmation && (
            <ConfirmationMessage
              response={userResponse!}
              onClose={() => setShowConfirmation(false)}
              guestName={guestName}
              guestEmail={guestEmail}
              previousResponse={previousResponse}
            />
          )}

          {showGuestModal && (
            <GuestRsvpModal
              isOpen={showGuestModal}
              onClose={() => {
                setShowGuestModal(false);
                setPendingResponse(null);
              }}
              onSuccess={handleGuestSuccess}
              pendingResponse={pendingResponse!}
              eventId={event.id}
              allowPlusOne={event.allow_plus_one}
              maxGuestsPerRsvp={event.max_guests_per_rsvp}
            />
          )}

          {showInviteModal && (
            <InviteModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              eventId={event.id}
              eventTitle={event.title}
            />
          )}

          <PageTitle title={event.title} />
        </div>
      )}
    </EventBrandingProvider>
  );
}