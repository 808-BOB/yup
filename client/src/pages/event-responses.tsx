import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Edit } from "lucide-react";
import { type Event, type Response } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageTitle from "@/components/page-title";
import EventGuestManager from "@/components/event-guest-manager";

// Extended Response type that includes user info added by the API
type ResponseWithUserInfo = Response & {
  userName?: string;
  userEmail?: string;
};

export default function EventResponses() {
  // Use multiple route patterns to support both slug and ID
  const [matchBySlug, paramsBySlug] = useRoute("/events/:slug/responses");
  const [matchById, paramsById] = useRoute("/events/:id/responses");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  console.log("EventResponses Component - Route Info:", { 
    matchBySlug, paramsBySlug,
    matchById, paramsById,
    url: window.location.href, 
    pathName: window.location.pathname 
  });

  // Get event identifier (slug or id) from the appropriate route match
  const isIdRoute = matchById && paramsById?.id;
  const isSlugRoute = matchBySlug && paramsBySlug?.slug;

  // Try to fetch event by slug if that route matched
  const { data: eventBySlug } = useQuery<Event>({
    queryKey: [`/api/events/slug/${paramsBySlug?.slug}`],
    enabled: !!isSlugRoute && !!paramsBySlug?.slug,
    retry: 1,
  });

  // Try to fetch event by ID if that route matched
  const { data: eventById } = useQuery<Event>({
    queryKey: [`/api/events/${paramsById?.id}`],
    enabled: !!isIdRoute && !!paramsById?.id,
    retry: 1,
  });

  // Use whichever event was found
  const event = eventBySlug || eventById;

  // Get the eventId to prevent dependency issue
  const eventId = event?.id;

  const { data: responses = [] } = useQuery<ResponseWithUserInfo[]>({
    queryKey: [`/api/events/${eventId}/responses`],
    enabled: !!eventId,
  });

  const { data: responseCounts = { yupCount: 0, nopeCount: 0, maybeCount: 0 } } = useQuery<{
    yupCount: number;
    nopeCount: number;
    maybeCount: number;
  }>({
    queryKey: [`/api/events/${eventId}/responses/count`],
    enabled: !!eventId,
  });

  // Loading state
  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Event not found</p>
        </main>
      </div>
    );
  }

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </main>
      </div>
    );
  }

  // Host can always view responses - make sure we handle user and event values safely
  console.log("Host Detection Debug:", { 
    userId: user?.id, 
    userIdType: typeof user?.id,
    eventHostId: event?.hostId, 
    eventHostIdType: typeof event?.hostId,
    strictEqual: user?.id === event?.hostId,
    stringComparison: user?.id === event?.hostId?.toString(),
    numberComparison: user?.id?.toString() === event?.hostId
  });
  
  const isHost = user && event && (user.id === event.hostId || user.id === event.hostId.toString() || user.id.toString() === event.hostId);

  // Calculate if threshold is reached for showing responses
  const hasYupThresholdReached = 
    event && event.showRsvpsAfterThreshold && 
    responseCounts && responseCounts.yupCount >= (event.rsvpVisibilityThreshold || 0);

  // Check visibility permissions for guests
  const canViewAsInvitee = 
    event && (event.showRsvpsToInvitees || hasYupThresholdReached);

  // Check if non-logged user can view based on the threshold
  const canViewAsPublic = 
    event && event.showRsvpsAfterThreshold && 
    responseCounts && responseCounts.yupCount >= (event.rsvpVisibilityThreshold || 0);

  console.log("RSVP Access Check:", { 
    isHost, 
    userId: user?.id, 
    userObj: user,
    eventHostId: event?.hostId,
    eventId: event?.id,
    hasYupThresholdReached,
    canViewAsInvitee,
    canViewAsPublic,
    showRsvpsToInvitees: event?.showRsvpsToInvitees,
    showRsvpsAfterThreshold: event?.showRsvpsAfterThreshold,
    rsvpVisibilityThreshold: event?.rsvpVisibilityThreshold,
    currentYupCount: responseCounts?.yupCount
  });

  // If user is not logged in AND cannot view as public, deny access
  if (!user && !canViewAsPublic) {
    toast({
      title: "Access Denied",
      description: "You must be logged in to view responses.",
      variant: "destructive",
    });
    setLocation(`/events/${event.slug}`);
    return null;
  }

  // If user is logged in but NOT the host and doesn't have viewing permissions, deny access
  if (user && !isHost && !canViewAsInvitee && !canViewAsPublic) {
    // Added more detailed logging to troubleshoot access issues
    console.log("Access denied for logged-in user:", {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      eventHostId: event.hostId,
      matchCheck: user.id === event.hostId
    });

    let description = "Access to view RSVPs has been restricted by the event host.";
    if (event && event.showRsvpsAfterThreshold) {
      description = `RSVPs will be visible once ${event.rsvpVisibilityThreshold} people respond with "YUP".`;
    }
    toast({
      title: "Access Restricted",
      description,
      variant: "destructive",
    });
    setLocation(`/events/${event.slug}`);
    return null;
  }

  // The host, or users with proper permissions can continue to view responses

  return (
    <div className="max-w-md mx-auto px-4 pb-6 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-6">
        <Header />
        {/* Set the page title using event name */}
        {event && <PageTitle title={`${event.title} RSVPs`} />}
      </div>
      <main className="flex-1 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700"
            onClick={() => setLocation(`/events/${event.slug}`)}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Button>

          {isHost && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700"
              onClick={() => setLocation(`/events/${event.slug}/edit`)}
            >
              <Edit className="w-4 h-4" /> Edit RSVPs
            </Button>
          )}
        </div>

        {/* Guest Management Component for Hosts */}
        {isHost && (
          <div className="mb-6">
            <EventGuestManager eventId={event.id.toString()} isHost={isHost} />
          </div>
        )}

        <Card className="bg-gray-900 border border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">
              {event.title} RSVPs
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-gray-800 p-4 rounded-sm">
                <div className="text-primary text-2xl font-bold mb-1">
                  {responseCounts?.yupCount || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">
                  Going
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-sm">
                <div className="text-gray-400 text-2xl font-bold mb-1">
                  {responseCounts?.nopeCount || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">
                  Not Going
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-sm">
                <div className="text-yellow-500 text-2xl font-bold mb-1">
                  {responseCounts?.maybeCount || 0}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">
                  Maybe
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                  Going
                </h3>
                <div className="space-y-2">
                  {responses
                    ?.filter((r) => r.response === "yup")
                    .map((response: ResponseWithUserInfo) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-sm"
                      >
                        <div className="flex flex-col">
                          {response.isGuest ? (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.guestName || ""}{" "}
                                {(response.guestCount ?? 0) > 0 && (
                                  <span className="text-xs text-primary">
                                    +{response.guestCount}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.guestEmail || ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.userName || `User ${response.userId || 'unknown'}`}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.userEmail || (response.userId ? `user${response.userId}@example.com` : 'unknown email')}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-primary font-medium uppercase">
                          Yup
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Not Going
                </h3>
                <div className="space-y-2">
                  {responses
                    ?.filter((r) => r.response === "nope")
                    .map((response: ResponseWithUserInfo) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-sm"
                      >
                        <div className="flex flex-col">
                          {response.isGuest ? (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.guestName || ""}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.guestEmail || ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.userName || `User ${response.userId || 'unknown'}`}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.userEmail || (response.userId ? `user${response.userId}@example.com` : 'unknown email')}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium uppercase">
                          Nope
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider mb-3">
                  Maybe
                </h3>
                <div className="space-y-2">
                  {responses
                    ?.filter((r) => r.response === "maybe")
                    .map((response: ResponseWithUserInfo) => (
                      <div
                        key={response.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-sm"
                      >
                        <div className="flex flex-col">
                          {response.isGuest ? (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.guestName || ""}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.guestEmail || ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-200">
                                {response.userName || `User ${response.userId || 'unknown'}`}
                              </span>
                              <span className="text-xs text-gray-400">
                                {response.userEmail || (response.userId ? `user${response.userId}@example.com` : 'unknown email')}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-yellow-500 font-medium uppercase">
                          Maybe
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}