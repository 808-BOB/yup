"use client";

import React, { useEffect, useState } from "react";
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
import EventBrandingProvider from "@/dash/event-branding-provider";

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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Event link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
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

  // Simple event layout
  const mainContent = (
    <div className="w-full min-h-screen bg-page-background">
      <Header />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!isGuestView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white px-0 pl-2 pr-2 hover:bg-black hover:text-white focus:bg-black focus:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <h1 className="text-lg font-bold text-white">Event Details</h1>
        </div>

        <Card className="border-none shadow-none bg-[#262626] text-white">
          <CardContent className="p-6 space-y-4">
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-400 text-sm">
                  {formatDate(event.date)} · {formatEventTime()}
                </p>
              </div>
              {isEventOwner() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="text-gray-300 hover:text-white"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Host */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={event.host.profile_image_url} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {event.host.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{event.host.display_name}</p>
                <p className="text-gray-400 text-sm">
                  {isEventOwner() ? `Created ${formatDate(event.created_at)}` : "Host"}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{event.location}</p>
                {event.address && (
                  <p className="text-gray-400 text-sm">{event.address}</p>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-gray-300 text-sm leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Share */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-gray-300 hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Guest RSVP (guest view) */}
            {isGuestView && (
              <div className="pt-4 border-t border-gray-700">
                <GuestResponseForm
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  eventDate={event.date}
                  eventLocation={event.location}
                  maxGuestsPerRsvp={event.max_guests_per_rsvp}
                  customRSVPText={{
                    yup: event.use_custom_rsvp_text && event.host.custom_yup_text ? event.host.custom_yup_text : "Yes",
                    nope: event.use_custom_rsvp_text && event.host.custom_nope_text ? event.host.custom_nope_text : "No",
                    maybe: event.use_custom_rsvp_text && event.host.custom_maybe_text ? event.host.custom_maybe_text : "Maybe",
                  }}
                  brandColors={{
                    primary: event.host.brand_primary_color || "#3b82f6",
                    secondary: event.host.brand_secondary_color || "#f1f5f9",
                    tertiary: event.host.brand_tertiary_color || "#1e293b",
                  }}
                  showOnlyResponseSelection={true}
                  onResponseTypeSelected={(type) => {
                    setSelectedResponseType(type);
                    setShowRSVPModal(true);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Modal (guest view) */}
        <Dialog open={showRSVPModal} onOpenChange={setShowRSVPModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-2 p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>RSVP Form</DialogTitle>
            </DialogHeader>
            {isGuestView && event && selectedResponseType && (
              <GuestResponseForm
                eventSlug={event.slug}
                eventTitle={event.title}
                eventDate={event.date}
                eventStartTime={event.start_time}
                eventLocation={event.location}
                maxGuestsPerRsvp={event.max_guests_per_rsvp}
                customRSVPText={{
                  yup: event.use_custom_rsvp_text && event.host.custom_yup_text ? event.host.custom_yup_text : "Yes",
                  nope: event.use_custom_rsvp_text && event.host.custom_nope_text ? event.host.custom_nope_text : "No",
                  maybe: event.use_custom_rsvp_text && event.host.custom_maybe_text ? event.host.custom_maybe_text : "Maybe",
                }}
                brandColors={{
                  primary: event.host.brand_primary_color || "#3b82f6",
                  secondary: event.host.brand_secondary_color || "#f1f5f9",
                  tertiary: event.host.brand_tertiary_color || "#1e293b",
                }}
                initialData={{
                  responseType: selectedResponseType,
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
  );

  // For now, keep branding simple: just return the main content
  return mainContent;
}
