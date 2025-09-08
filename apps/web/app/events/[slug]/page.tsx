"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Eye from "lucide-react/dist/esm/icons/eye";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { getSupabaseClient } from "@/utils/supabase";
import { formatDate, formatTime } from "@/utils/date-formatter";
import Header from "@/dash/header";
import GuestResponseForm from "@/components/ui/guest-response-form";
import PageLayout from "@/ui/page-layout";

interface EventData {
  id: number;
  title: string;
  slug: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address?: string;
  description?: string;
  image_url?: string;
  image_scale?: number;
  image_position_x?: number;
  image_position_y?: number;
  image_fit?: 'contain' | 'cover';
  host_id: string;
  created_at: string;
  status: string;
  allow_guest_rsvp: boolean;
  allow_plus_one: boolean;
  max_guests_per_rsvp: number;
  capacity?: number;
  use_custom_rsvp_text: boolean;
  custom_yup_text?: string;
  custom_nope_text?: string;
  custom_maybe_text?: string;
  rsvp_visibility: string;
  waitlist_enabled: boolean;
  public_rsvp_enabled: boolean;
  host: {
    display_name: string;
    email: string;
    profile_image_url?: string;
    logo_url?: string;
    brand_primary_color?: string;
    brand_secondary_color?: string;
    brand_tertiary_color?: string;
    custom_yup_text?: string;
    custom_nope_text?: string;
    custom_maybe_text?: string;
    is_premium?: boolean;
  };
  user_response?: "yup" | "nope" | "maybe" | null;
  is_user_invited?: boolean;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponseType, setSelectedResponseType] = useState<'yup' | 'nope' | 'maybe' | null>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [submittingRSVP, setSubmittingRSVP] = useState(false);

  const slug = params.slug as string;
  const isGuestView = searchParams.get('guest_view') === 'true';

  useEffect(() => {
    const loadEventData = async () => {
      if (!slug) return;

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setError("Failed to initialize database connection");
          return;
        }

        // Fetch event data with host information
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            host:users!events_host_id_fkey(
              display_name,
              email,
              profile_image_url,
              logo_url,
              brand_primary_color,
              brand_secondary_color,
              brand_tertiary_color,
              custom_yup_text,
              custom_nope_text,
              custom_maybe_text,
              is_premium
            )
          `)
          .eq("slug", slug)
          .single();

        if (eventError) {
          console.error("Error fetching event:", eventError);
          setError("Event not found");
          return;
        }

        if (!eventData) {
          setError("Event not found");
          return;
        }

        // Check if authenticated user is invited and get their response
        let userInvitationData = null;
        if (user && session && !isGuestView) {
          try {
            const response = await fetch('/api/events/invited', {
              headers: {
                'authorization': `Bearer ${session.access_token}`,
              },
            });
            
            if (response.ok) {
              const invitedEvents = await response.json();
              userInvitationData = invitedEvents.find((e: any) => e.id === eventData.id);
            }
          } catch (err) {
            console.error('Error checking user invitation:', err);
          }
        }

        // Combine event data with invitation data
        const enrichedEventData = {
          ...eventData,
          is_user_invited: !!userInvitationData,
          user_response: userInvitationData?.user_response || null
        };

        setEvent(enrichedEventData);
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [slug, user, session, isGuestView]);

  const formatEventTime = () => {
    if (!event) return "";
    const startTime = formatTime(event.start_time);
    const endTime = event.end_time ? formatTime(event.end_time) : null;
    const timeString = endTime ? `${startTime} - ${endTime}` : startTime;
    
    // Add timezone info if available
    if (event.timezone && event.start_time !== "TBD") {
      return `${timeString} (${event.timezone})`;
    }
    
    return timeString;
  };

  const isEventOwner = () => {
    // If in guest view mode, always return false to hide owner-specific features
    if (isGuestView) return false;
    return user?.id === event?.host_id;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out this event: ${event?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  const handleEdit = () => {
    router.push(`/events/${slug}/edit`);
  };

  const handleViewResponses = () => {
    router.push(`/events/${slug}/responses`);
  };

  const handleViewAsGuest = () => {
    // Open the event page in a new tab/window with a query parameter to simulate guest view
    const guestUrl = `${window.location.origin}/events/${slug}?guest_view=true`;
    window.open(guestUrl, '_blank');
  };

  const handleRSVPClick = (responseType: 'yup' | 'nope' | 'maybe') => {
    setSelectedResponseType(responseType);
    setShowRSVPModal(true);
  };

  const handleRSVPModalClose = () => {
    setShowRSVPModal(false);
    setSelectedResponseType(null);
  };

  const handleAuthenticatedRSVP = async (responseType: 'yup' | 'nope' | 'maybe') => {
    if (!user || !session || !event) return;
    
    setSubmittingRSVP(true);
    
    try {
      const response = await fetch(`/api/events/${event.slug}/user-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          responseType,
          guestCount: 1 // Default for authenticated users
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the event state with new response
        setEvent(prev => prev ? {
          ...prev,
          user_response: responseType
        } : null);
        
        toast({
          title: "RSVP Updated! 🎉",
          description: `Your response has been set to "${getCustomRSVPText(responseType)}"`,
        });
      } else {
        throw new Error(result.error || 'Failed to submit RSVP');
      }
    } catch (error: any) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: "RSVP failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRSVP(false);
    }
  };

  const getCustomRSVPText = (responseType: 'yup' | 'nope' | 'maybe') => {
    if (!event || !event.use_custom_rsvp_text) {
      return responseType === 'yup' ? 'Yes' : responseType === 'nope' ? 'No' : 'Maybe';
    }
    
    switch (responseType) {
      case 'yup':
        return event.host.custom_yup_text || 'Yes';
      case 'nope':
        return event.host.custom_nope_text || 'No';
      case 'maybe':
        return event.host.custom_maybe_text || 'Maybe';
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page-background">
        <Header />
        <div className="max-w-xl mx-auto px-6 pt-8">
          <h1 className="text-2xl font-bold text-white mb-6">Event Details</h1>
        </div>
        <div className="max-w-xl mx-auto px-6 pb-8 min-h-screen flex flex-col bg-page-container">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">Loading events...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full min-h-screen bg-page-background">
        <Header />
        <div className="max-w-xl mx-auto px-6 pt-8">
          <h1 className="text-2xl font-bold text-white mb-6">Event Details</h1>
        </div>
        <div className="max-w-xl mx-auto px-6 pb-8 min-h-screen flex flex-col bg-page-container">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-400">{error || "Event not found"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout maxWidth="xl" className="flex flex-col">
      <div data-name="event-details-bg-container" className="flex-1 flex flex-col items-center justify-start">
        <div className="max-w-xl w-full flex-1 flex flex-col items-center justify-start">
          {/* Back button and heading - only show for authenticated users, not in guest view */}
          {!isGuestView && (
            <div className="flex items-center justify-between w-full mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-white px-0 pl-2 pr-2 hover:bg-black hover:text-white focus:bg-black focus:text-white"
                data-name="event-details-back-btn"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-lg font-bold text-white" data-name="event-details-heading">Event Details</h1>
            </div>
          )}
          {/* Subtle line separator - visible for all users */}
          <div className="w-full h-px bg-gray-600 mb-6"></div>
          {/* Block 1: Title - No Background */}
          <div className={`w-full ${isGuestView ? 'mt-6' : ''}`}>
            <div data-name="event-details-header" className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white" data-name="event-details-title">
                    {event.title}
                  </h2>
                  <span 
                    className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold tracking-wider"
                    style={{
                      backgroundColor: event.host.is_premium && event.host.brand_primary_color 
                        ? event.host.brand_primary_color + '33' // 20% opacity
                        : '#FF00FF33',
                      color: event.host.is_premium && event.host.brand_primary_color 
                        ? event.host.brand_primary_color 
                        : '#FF00FF'
                    }}
                  >
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>
                {/* Edit icon-only button, no solid wrapper */}
                {isEventOwner() && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    className="text-gray-300 hover:text-white p-2"
                    style={{
                      color: '#6b7280'
                    }}
                    onMouseEnter={(e) => {
                      const primaryColor = event.host.brand_primary_color || '#3b82f6';
                      e.currentTarget.style.color = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6b7280';
                    }}
                    data-name="event-details-edit-btn"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                )}
            </div>
          </div>

          {/* Block 2: Image - No Background */}
          {event.image_url && (
            <div className="w-full mb-6" data-name="event-details-image">
              <div className="w-full aspect-video overflow-hidden rounded-lg">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className={`w-full h-full transition-transform ${
                    event.image_fit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                  style={{
                    transform: `scale(${(event.image_scale || 100) / 100}) translate(${((event.image_position_x || 50) - 50) * 2}%, ${((event.image_position_y || 50) - 50) * 2}%)`,
                    transformOrigin: 'center center'
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Block 3: Details - With Background */}
          <Card data-name="event-details-card" className="w-full bg-[#262626] border-none shadow-none p-0">
            <CardContent className="w-full p-6 flex flex-col gap-4 relative" data-name="event-details-card-content">

              {/* Event Creator */}
              <div className="flex items-center gap-3" data-name="event-details-creator">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.host.profile_image_url} />
                  <AvatarFallback className="bg-gray-600 text-white">
                    {event.host.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{event.host.display_name}</p>
                    {isEventOwner() && (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/25 text-blue-300 border-blue-500/50">
                        YOUR EVENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {isEventOwner() ? `Created ${formatDate(event.created_at)}` : 'Host'}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4" data-name="event-details-info-blocks">
                {/* When */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {formatDate(event.date)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {formatEventTime()}
                    </p>
                  </div>
                </div>

                {/* Where */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{event.location}</p>
                    {event.address && (
                      <p className="text-gray-400 text-sm">{event.address}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="pt-2">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Authenticated User RSVP - show for invited users who aren't the event owner */}
                {!isGuestView && event && event.is_user_invited && !isEventOwner() && (
                  <div className="pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profile_image_url} />
                        <AvatarFallback className="bg-gray-600 text-white">
                          {user?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-white font-semibold">Your RSVP</h3>
                    </div>
                    {event.user_response && (
                      <p className="text-gray-300 text-sm mb-4">
                        Current response: <span className="font-medium text-white">{getCustomRSVPText(event.user_response)}</span>
                      </p>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAuthenticatedRSVP('yup')}
                        disabled={submittingRSVP}
                        className={`flex-1 transition-all duration-200 ${
                          event.user_response === 'yup' 
                            ? 'opacity-100 scale-105' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: event.user_response === 'yup' 
                            ? (event.host.brand_primary_color || '#3b82f6')
                            : 'transparent',
                          borderColor: event.host.brand_primary_color || '#3b82f6',
                          color: event.user_response === 'yup' ? 'white' : (event.host.brand_primary_color || '#3b82f6')
                        }}
                        variant={event.user_response === 'yup' ? 'default' : 'outline'}
                      >
                        {getCustomRSVPText('yup')}
                      </Button>
                      <Button
                        onClick={() => handleAuthenticatedRSVP('maybe')}
                        disabled={submittingRSVP}
                        className={`flex-1 transition-all duration-200 ${
                          event.user_response === 'maybe' 
                            ? 'opacity-100 scale-105' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: event.user_response === 'maybe' 
                            ? '#fbbf24'
                            : 'transparent',
                          borderColor: '#fbbf24',
                          color: event.user_response === 'maybe' ? 'white' : '#fbbf24'
                        }}
                        variant={event.user_response === 'maybe' ? 'default' : 'outline'}
                      >
                        {getCustomRSVPText('maybe')}
                      </Button>
                      <Button
                        onClick={() => handleAuthenticatedRSVP('nope')}
                        disabled={submittingRSVP}
                        className={`flex-1 transition-all duration-200 ${
                          event.user_response === 'nope' 
                            ? 'opacity-100 scale-105' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: event.user_response === 'nope' 
                            ? '#ef4444'
                            : 'transparent',
                          borderColor: '#ef4444',
                          color: event.user_response === 'nope' ? 'white' : '#ef4444'
                        }}
                        variant={event.user_response === 'nope' ? 'default' : 'outline'}
                      >
                        {getCustomRSVPText('nope')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Guest RSVP Response Selection - only show in guest view mode */}
                {isGuestView && event && (
                  <div className="pt-4 border-t border-gray-700">
                    <GuestResponseForm
                      eventSlug={event.slug}
                      eventTitle={event.title}
                      eventDate={event.date}
                      eventLocation={event.location}
                      maxGuestsPerRsvp={event.max_guests_per_rsvp}
                      customRSVPText={{
                        yup: event.use_custom_rsvp_text && event.host.custom_yup_text ? event.host.custom_yup_text : 'Yes',
                        nope: event.use_custom_rsvp_text && event.host.custom_nope_text ? event.host.custom_nope_text : 'No',
                        maybe: event.use_custom_rsvp_text && event.host.custom_maybe_text ? event.host.custom_maybe_text : 'Maybe'
                      }}
                      brandColors={{
                        primary: event.host.brand_primary_color || '#3b82f6',
                        secondary: event.host.brand_secondary_color || '#f1f5f9',
                        tertiary: event.host.brand_tertiary_color || '#1e293b'
                      }}
                      showOnlyResponseSelection={true}
                      onResponseTypeSelected={(type) => {
                        setSelectedResponseType(type);
                        setShowRSVPModal(true);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* RSVP Settings - only show to event owner */}
              {isEventOwner() && (
                <div className="pt-4 border-t border-gray-700" data-name="event-details-rsvp-settings">
                  <h3 className="text-white font-semibold mb-3">RSVP Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Guest RSVP</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        event.allow_guest_rsvp 
                          ? "bg-green-500/25 text-green-300 border-green-500/50"
                          : "bg-red-500/25 text-red-300 border-red-500/50"
                      }`}>
                        {event.allow_guest_rsvp ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Plus One</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        event.allow_plus_one 
                          ? "bg-green-500/25 text-green-300 border-green-500/50"
                          : "bg-red-500/25 text-red-300 border-red-500/50"
                      }`}>
                        {event.allow_plus_one ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Max Guests</p>
                      <span className="text-blue-300 text-base font-semibold">
                        {event.max_guests_per_rsvp}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom row actions */}
              <div className="flex gap-6 mt-8 justify-end" data-name="event-details-actions">
                {/* Event owner buttons */}
                {isEventOwner() && (
                  <>
                    {/* View as Guest button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleViewAsGuest}
                      className="text-gray-300 border-gray-600 hover:border-gray-400 hover:text-white h-10 px-4 flex items-center"
                      data-name="event-details-view-as-guest-btn"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      View as Guest
                    </Button>

                    {/* View Responses solid primary button */}
                    <Button
                      size="sm"
                      className="text-white hover:scale-105 transition-all duration-200 z-10 relative h-10 px-4 flex items-center"
                      style={{
                        backgroundColor: event.host.is_premium && event.host.brand_primary_color 
                          ? event.host.brand_primary_color 
                          : '#FF00FF',
                        borderColor: event.host.is_premium && event.host.brand_primary_color 
                          ? event.host.brand_primary_color 
                          : '#FF00FF'
                      }}
                      onMouseEnter={(e) => {
                        const primaryColor = event.host.is_premium && event.host.brand_primary_color 
                          ? event.host.brand_primary_color 
                          : '#FF00FF';
                        e.currentTarget.style.backgroundColor = primaryColor + '90';
                      }}
                      onMouseLeave={(e) => {
                        const primaryColor = event.host.is_premium && event.host.brand_primary_color 
                          ? event.host.brand_primary_color 
                          : '#FF00FF';
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                      onClick={handleViewResponses}
                      data-name="event-details-view-responses-btn"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Responses
                    </Button>
                  </>
                )}
                {/* Share icon-only button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-gray-300 hover:text-white p-2 h-10 w-10 flex items-center justify-center"
                  data-name="event-details-share-btn"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RSVP Modal */}
          <Dialog open={showRSVPModal} onOpenChange={setShowRSVPModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-2 p-0" style={{ borderColor: event?.host?.brand_primary_color || '#3b82f6' }}>
              <DialogHeader className="sr-only">
                <DialogTitle>RSVP Form</DialogTitle>
              </DialogHeader>
              {isGuestView && event && selectedResponseType && (
                <GuestResponseForm
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  eventDate={event.date}
                  eventLocation={event.location}
                  maxGuestsPerRsvp={event.max_guests_per_rsvp}
                  customRSVPText={{
                    yup: event.use_custom_rsvp_text && event.host.custom_yup_text ? event.host.custom_yup_text : 'Yes',
                    nope: event.use_custom_rsvp_text && event.host.custom_nope_text ? event.host.custom_nope_text : 'No',
                    maybe: event.use_custom_rsvp_text && event.host.custom_maybe_text ? event.host.custom_maybe_text : 'Maybe'
                  }}
                  brandColors={{
                    primary: event.host.brand_primary_color || '#3b82f6',
                    secondary: event.host.brand_secondary_color || '#f1f5f9',
                    tertiary: event.host.brand_tertiary_color || '#1e293b'
                  }}
                  initialData={{
                    responseType: selectedResponseType
                  }}
                  showOnlyResponseSelection={false}
                  onResponseSubmitted={() => {
                    setShowRSVPModal(false);
                  }}
                  className="border-0 shadow-none"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Footer */}
      <div data-name="event-details-footer" className="w-full bg-[#171717] h-16 mt-0 flex-shrink-0" />

      {/* Floating Guest View Indicator */}
      {isGuestView && (
        <div className="fixed bottom-6 right-6 z-[200]">
          <div className="bg-black border border-blue-500/50 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">Guest View Mode</span>
          </div>
        </div>
      )}
    </PageLayout>
  );
} 