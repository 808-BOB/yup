import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Calendar, MapPin, User, Users, ArrowLeft, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmationMessage from "@/components/confirmation-message";
import GuestRsvpModal from "@/components/guest-rsvp-modal";
import { type Event, type Response } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [pendingResponse, setPendingResponse] = useState<"yup" | "nope" | null>(null);
  
  // Event data query
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: !!params?.slug
  });
  
  // User's response query - only run if user is logged in and event data is loaded
  const { data: existingResponse } = useQuery<Response>({
    queryKey: [`/api/events/${event?.id}/users/${user?.id}/response`],
    enabled: !!event && !!user
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
          variant: "destructive"
        });
        return;
      }
      
      await apiRequest("POST", "/api/responses", {
        eventId: event.id,
        userId: user.id,
        response
      });
      
      setUserResponse(response);
      setShowConfirmation(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 tracking-tight">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 tracking-tight">Event not found. It may not exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  // Confirmation state
  if (showConfirmation && userResponse) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <ConfirmationMessage response={userResponse} event={event} />
        </div>
      </div>
    );
  }
  
  const formattedTime = `${event.startTime.slice(0, 5)} - ${event.endTime.slice(0, 5)}`;
  
  // Debug imageUrl
  console.log("Event image URL:", event.imageUrl);
  if (event.imageUrl?.startsWith('data:')) {
    console.log("Image is base64 data, first 40 chars:", event.imageUrl.substring(0, 40));
  }

  // Main UI
  return (
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col bg-gray-950">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full animate-fade-in">
          <div className="flex gap-4 mb-4">
            {/* Only show Back to Events button if user is logged in */}
            {user && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700" 
                onClick={() => setLocation('/events')}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Events
              </Button>
            )}
            
            {/* Only show View Responses button if user is the event host */}
            {user && user.id === event.hostId && (
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-1 bg-gray-900 border-gray-800 hover:border-gray-700 ${!user ? 'ml-auto' : ''}`}
                onClick={() => setLocation(`/events/${event.slug}/responses`)}
              >
                <Eye className="w-4 h-4" /> View Responses
              </Button>
            )}
          </div>
          
          {event.imageUrl && (
            <div className="w-full h-48 mb-6 overflow-hidden rounded-sm">
              {/* For base64 images, we'll create a div with background-image to avoid rendering issues */}
              {event.imageUrl.startsWith('data:') ? (
                <div 
                  className="w-full h-full bg-no-repeat bg-center bg-cover"
                  style={{ backgroundImage: `url(${event.imageUrl})` }}
                ></div>
              ) : (
                /* For regular URLs, use the normal img tag */
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
          <Card className="mb-6 animate-slide-up bg-gray-900 border border-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">{event.title}</h2>
                  
                  {/* Show "Your Event" badge for the owner */}
                  {user && event.hostId === user.id && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                        Your Event
                      </Badge>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLocation(`/events/${event.slug}/edit`);
                        }}
                        className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
                      >
                        Edit Event
                      </button>
                    </div>
                  )}
                </div>
                <span className="bg-gray-800 text-primary text-xs px-2 py-1 rounded-sm font-mono uppercase tracking-wide">
                  {event.status}
                </span>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">{formatDate(event.date)}</p>
                    <p className="text-gray-500 tracking-tight">{formattedTime}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">{event.location}</p>
                    {event.address && (
                      <p className="text-gray-500 tracking-tight">{event.address}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium tracking-tight">Hosted by Demo User</p>
                  </div>
                </div>
                
                {event.allowGuestRsvp && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <div className="font-medium tracking-tight flex items-center">
                        <span>Guest RSVP</span> <Badge variant="outline" className="ml-1 text-xs font-normal">enabled</Badge>
                      </div>
                      {event.allowPlusOne && (
                        <p className="text-gray-500 tracking-tight">
                          Bring up to {event.maxGuestsPerRsvp} {event.maxGuestsPerRsvp === 1 ? 'guest' : 'guests'}
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
            <p className="text-center mb-8 text-gray-400 uppercase tracking-wide font-mono">CAN YOU MAKE IT?</p>
            
            <div className="flex gap-8 justify-center mb-8">
              <Button
                onClick={() => handleResponse("nope")}
                className="btn-nope bg-gray-900 w-32 h-32 rounded-sm flex items-center justify-center border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <span className="text-gray-400 text-2xl font-bold uppercase tracking-widest">NOPE</span>
              </Button>
              
              <Button
                onClick={() => handleResponse("yup")}
                className="btn-yup bg-gray-900 w-32 h-32 rounded-sm flex items-center justify-center border border-primary hover:border-primary/80 transition-colors"
              >
                <span className="text-primary text-2xl font-bold uppercase tracking-widest">YUP</span>
              </Button>
            </div>
            
            <Button
              onClick={() => {
                const url = `${window.location.origin}/events/${event.slug}`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "Link Copied!",
                  description: "Share this link to invite people to your event",
                });
              }}
              className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700"
            >
              Share Event Link
            </Button>
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
    </div>
  );
}