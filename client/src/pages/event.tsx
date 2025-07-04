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
import EventBrandingProvider, { getHostLogoUrl, HostBranding } from "@/components/event-branding-provider";

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
  const [pendingResponse, setPendingResponse] = useState<"yup" | "nope" | "maybe" | null>(
    null,
  );

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
      const isLoggedIn = !!user;

      // No toggle behavior - always set the selected response

      // For guest users, show the guest RSVP modal if guest RSVP is allowed
      if (!isLoggedIn && event.allowGuestRsvp) {
        // Only show the modal if:
        // 1. This is the first response (no previousResponse)
        // 2. Changing from "nope" or "maybe" to "yup" (need guest count)
        // 3. Changing from "yup" to a different response (need confirmation)
        const needToShowModal = 
          !previousResponse || 
          (previousResponse !== "yup" && response === "yup") ||
          (previousResponse === "yup" && response !== "yup");

        setPendingResponse(response);

        if (needToShowModal) {
          setShowGuestModal(true);
        } else {
          // If we don't need to show the modal, submit the response directly
          // using the already stored guest information
          try {
            await apiRequest("POST", "/api/guest-responses", {
              eventId: event.id,
              response,
              isGuest: true,
              guestName,
              guestEmail,
              guestCount: 0, // Default to 0 when updating responses without showing modal
            });

            setUserResponse(response);
            setPreviousResponse(response);
            setShowConfirmation(true);
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to submit your response. Please try again.",
              variant: "destructive",
            });
          }
        }
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

      // Invalidate and refetch relevant queries to update counts
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/connections`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/responses/count`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/users/${user.id}/response`] });

      // Set the response (no toggle behavior for logged-in users)
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
  // Handle navigation after response confirmation
  const handleNavigateAfterResponse = (target: string) => {
    setShowConfirmation(false);
    setLocation(target);
  };

  if (showConfirmation && userResponse) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <ConfirmationMessage 
            response={userResponse} 
            event={event}
            onNavigate={handleNavigateAfterResponse} 
          />
        </div>
      </div>
    );
  }

  const formattedTime = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

  // Safely handle image URL - remove debug logging that could cause issues
  const eventImageUrl = event.imageUrl || "";

  // Main UI
  // Create custom header with host's logo if premium branding is available
  const CustomHeader = () => {
    // Check if the event has premium branding
    const hasPremiumBranding = event.hostBranding && (event.hostBranding.logoUrl || event.hostBranding.brandTheme);
    
    if (!hasPremiumBranding) {
      return <Header />;
    }
    
    return (
      <header className="flex justify-between items-center mb-6 py-4 border-b border-gray-800 sticky top-0 z-50 bg-gray-950">
        <div className="flex items-center">
          <img
            src={getHostLogoUrl(event.hostBranding || null)}
            alt={`${event.title} by ${event.hostDisplayName || 'Event Host'}`}
            className="h-8 w-auto max-w-[144px] object-contain cursor-pointer"
            onClick={() => setLocation(`/events/${event.slug}`)}
          />
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <Button
              variant="default"
              size="icon"
              onClick={() => setLocation("/events/create")}
              className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-sm"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
    );
  };

  return (
    <EventBrandingProvider hostBranding={event.hostBranding || null} enabled={!!event.hostBranding}>
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <CustomHeader />
          {/* Set page title to event name */}
          {event && <PageTitle title={event.title} />}
        </div>
      <main className="flex-1 mb-6">
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
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            )}

            <div className="flex gap-2">
              {/* Edit button for hosts */}
              {user && (user.id === event.hostId || user.username === 'subourbon') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700 px-2"
                  onClick={() => setLocation(`/events/${event.slug}/edit`)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              {/* View RSVPs button */}
              {(user && user.id === event.hostId) || 
                (user && event.showRsvpsToInvitees) || 
                (event.showRsvpsAfterThreshold && responseCounts.yupCount >= event.rsvpVisibilityThreshold) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700"
                  onClick={() => setLocation(`/events/${event.slug}/responses`)}
                >
                  <Eye className="w-4 h-4" /> View RSVPs
                </Button>
              ) : null}
            </div>
          </div>

          {/* Event Image - prominently displayed */}
          {event.imageUrl ? (
            <div className="w-full h-64 mb-6 overflow-hidden rounded-lg shadow-lg">
              {event.imageUrl.startsWith("data:") ? (
                <div
                  className="w-full h-full bg-no-repeat bg-center bg-cover"
                  style={{ backgroundImage: `url(${event.imageUrl})` }}
                />
              ) : (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-48 mb-6 overflow-hidden rounded-lg bg-gray-800 border-2 border-dashed border-gray-600">
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <div>No Event Image</div>
                  {user && user.id === event.hostId && (
                    <p className="text-xs mt-2 text-gray-500">Click Edit to add an image</p>
                  )}
                </div>
              </div>
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
                    className="text-xs flex items-center gap-1 hover:opacity-80"
                    style={{ color: accessibleTextColor }}
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
                    className="text-xs border-primary/20"
                    style={{
                      backgroundColor: `${primaryColor || 'hsl(308, 100%, 66%)'}10`,
                      color: accessibleTextColor,
                      borderColor: `${primaryColor || 'hsl(308, 100%, 66%)'}20`
                    }}
                  >
                    Your Event
                  </Badge>

                  <Badge
                    variant="outline" 
                    className="text-xs bg-gray-800 border-gray-700 font-mono uppercase"
                    style={{ color: accessibleTextColor }}
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
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-400">Description</div>
                        <div className="text-sm">{event.description}</div>
                        {user && (user.isPro || user.isPremium) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Parse date and time separately to avoid timezone issues
                              const [year, month, day] = event.date.split('-').map(Number);
                              const [startHour, startMinute] = event.startTime.split(':').map(Number);
                              const [endHour, endMinute] = event.endTime.split(':').map(Number);
                              
                              const startDate = new Date(year, month - 1, day, startHour, startMinute);
                              const endDate = new Date(year, month - 1, day, endHour, endMinute);

                              const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;

                              window.open(googleUrl, '_blank');
                            }}
                            className="w-full mt-4"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Google Calendar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn connections temporarily hidden */}
          {/* {user && (
            <EventConnections eventId={event.id} />
          )} */}

          <div className="mt-auto pb-6">
            <p className="text-center mb-8 text-gray-400 uppercase tracking-wide font-mono">
              {event.useCustomRsvpText ? 'ARE YOU GOING?' : 'ARE YOU IN?'}
            </p>

            <div className="flex gap-4 justify-center mb-8">
              <Button
                onClick={() => handleResponse("yup")}
                className={`btn-yup w-24 h-24 rounded-sm flex items-center justify-center border transition-colors ${
                  userResponse === "yup"
                    ? "bg-primary/20 border-primary hover:bg-primary/20"
                    : "bg-gray-900 border-primary/50 hover:border-primary"
                }`}
              >
                <span className="text-primary text-xl font-bold uppercase tracking-widest">
                  {userResponse === "yup" ? (
                    <span className="flex flex-col items-center">
                      {/* Show custom text if event has it enabled */}
                      {event.useCustomRsvpText && event.customYesText ? 
                        event.customYesText.toUpperCase() : 
                        "YUP"}
                      <span className="text-xs text-primary mt-1">✓</span>
                    </span>
                  ) : (
                    event.useCustomRsvpText && event.customYesText ? 
                      event.customYesText.toUpperCase() : 
                      "YUP"
                  )}
                </span>
              </Button>

              <Button
                onClick={() => handleResponse("nope")}
                className={`btn-nope w-24 h-24 rounded-sm flex items-center justify-center border transition-colors ${
                  userResponse === "nope"
                    ? "bg-red-950/30 border-red-700 hover:bg-red-950/30"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <span className={`text-xl font-bold uppercase tracking-widest ${
                  userResponse === "nope" ? "text-red-500" : "text-gray-400"
                }`}>
                  {event.useCustomRsvpText && event.customNoText ? 
                    event.customNoText.toUpperCase() : 
                    "NOPE"}
                </span>
              </Button>

              <Button
                onClick={() => handleResponse("maybe")}
                className={`btn-maybe w-24 h-24 rounded-sm flex items-center justify-center border transition-colors ${
                  userResponse === "maybe"
                    ? "bg-yellow-900/30 border-yellow-700 hover:bg-yellow-900/30"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <span className={`text-xl font-bold uppercase tracking-widest ${
                  userResponse === "maybe" ? "text-yellow-500" : "text-gray-400"
                }`}>
                  MAYBE
                </span>
              </Button>
            </div>

            {/* Google Calendar Button */}
            <Button
              onClick={() => {
                // Format the event details for Google Calendar
                const title = encodeURIComponent(event.title);
                
                // Format date in the required format (YYYYMMDD)
                const dateComponents = event.date.split('-');
                if (dateComponents.length !== 3) {
                  console.error("Invalid date format:", event.date);
                  return;
                }
                
                // Create formatted date string (YYYYMMDD)
                const formattedDate = dateComponents.join('');
                
                // Format start and end times (removing any colons)
                const startTime = event.startTime.replace(':', '') + '00';
                const endTime = event.endTime.replace(':', '') + '00';
                
                // Create formatted datetime strings
                const startDateTime = formattedDate + 'T' + startTime;
                const endDateTime = formattedDate + 'T' + endTime;
                
                const location = encodeURIComponent(event.location + (event.address ? `, ${event.address}` : ''));
                const details = encodeURIComponent(event.description || '');
                
                // Create Google Calendar URL
                const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
                
                // Open in a new tab
                window.open(googleCalUrl, '_blank');
              }}
              className="w-full mb-4 bg-gray-900 border border-gray-800 hover:border-gray-700 flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add to Google Calendar
            </Button>
            
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
            
            {/* Simple login/signup for guests */}
            {!user && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-400 mb-3">
                  Want to manage your RSVPs and create your own events?
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/auth?mode=login")}
                    className="border-gray-700 hover:border-gray-600 px-4"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/auth?mode=signup")}
                    className="bg-primary hover:bg-primary/90 px-4"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            )}
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
          defaultGuestName={guestName}
          defaultGuestEmail={guestEmail}
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
    </EventBrandingProvider>
  );
}