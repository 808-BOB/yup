"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime } from "@/utils/date-formatter";
import ShareEventModal from "@/dash/share-event-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import EventBrandingProvider from "@/dash/event-branding-provider";
import { useCustomRSVPText } from "@/hooks/use-custom-rsvp-text";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import GuestResponseForm from "@/ui/guest-response-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Response {
  id: number;
  event_id: number;
  user_id: string;
  response_type: "yup" | "nope" | "maybe";
  created_at: string;
  is_guest: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_count: number;
  user?: {
    id: string;
    display_name: string;
    email: string;
    profile_image_url?: string;
    username?: string;
  };
}

interface Invitation {
  id: number;
  user_id: string;
  status: string;
  created_at: string;
  user?: {
    display_name: string;
    email: string;
    profile_image_url?: string;
  };
}

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
}

// Function to sync user display names if needed
const syncUserDisplayNames = async () => {
  try {
    const response = await fetch('/api/sync-user-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('User names synced:', result);
      return true;
    }
  } catch (error) {
    console.error('Error syncing user names:', error);
  }
  return false;
};

export default function EventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Get invitation token from URL if present
  const invitationToken = searchParams.get('inv');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userResponse, setUserResponse] = useState<"yup" | "nope" | "maybe" | null>(null);
  const [responseCounts, setResponseCounts] = useState({ yupCount: 0, nopeCount: 0, maybeCount: 0 });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [lastNotificationSent, setLastNotificationSent] = useState<number>(0);
  const [notificationDebounceTimer, setNotificationDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Use hooks for custom branding
  const { primaryColor } = useAccessibleColors();

  // Memoize the slug to avoid the Next.js params warning
  const eventSlug = useMemo(() => params?.slug || '', [params?.slug]);

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventSlug) return;

      try {
        // Load event data (works for both authenticated and non-authenticated users)
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            id, title, slug, date, location, address, start_time, end_time,
            description, image_url, host_id, created_at, status,
            allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, public_rsvp_enabled,
            capacity, use_custom_rsvp_text, custom_yup_text,
            custom_nope_text, custom_maybe_text, rsvp_visibility,
            waitlist_enabled,
            host:host_id(
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
          .eq('slug', eventSlug)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');

        // Transform the host array into a single object
        const transformedEvent = {
          ...eventData,
          host: Array.isArray(eventData.host) ? eventData.host[0] : eventData.host
        } as EventData;

        setEvent(transformedEvent);

        // Determine if we should show guest form
        // Show guest form if:
        // 1. User is not authenticated AND event allows guest RSVPs, OR
        // 2. User came from an invitation link (even if authenticated)
        const shouldShowGuestForm = (!user && (transformedEvent.allow_guest_rsvp || transformedEvent.public_rsvp_enabled)) || !!invitationToken;
        setShowGuestForm(shouldShowGuestForm);

        // Only load full responses data if user is authenticated
        if (user) {
        // Load responses with user details
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select(`
            *,
            user:user_id (
              id,
              display_name,
              email,
              profile_image_url,
              username
            )
          `)
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (responseError) throw responseError;

        // Remove duplicate responses (keep latest response per user)
        const uniqueResponses = responseData?.reduce((acc: Response[], response) => {
          const existingResponseIndex = acc.findIndex(r => r.user_id === response.user_id);
          if (existingResponseIndex >= 0) {
            // If this response is newer than the existing one, replace it
            if (new Date(response.created_at) > new Date(acc[existingResponseIndex].created_at)) {
              acc[existingResponseIndex] = response;
            }
          } else {
            acc.push(response);
          }
          return acc;
        }, []) || [];

        setResponses(uniqueResponses);

        // Calculate response counts from deduplicated responses
        const counts = uniqueResponses.reduce((acc, response) => {
          switch (response.response_type) {
            case 'yup':
              acc.yupCount++;
              break;
            case 'nope':
              acc.nopeCount++;
              break;
            case 'maybe':
              acc.maybeCount++;
              break;
          }
          return acc;
        }, { yupCount: 0, nopeCount: 0, maybeCount: 0 });

        setResponseCounts(counts);

        // Set user's response from deduplicated responses
          const userLatestResponse = uniqueResponses.find(r => r.user_id === user.id);
          setUserResponse(userLatestResponse?.response_type || null);

        // Only create a maybe response if user is not host and has no response
          if (user.id !== eventData.host_id && !uniqueResponses.some(r => r.user_id === user.id)) {
          const { error: responseError } = await supabase
            .from('responses')
            .insert({
              event_id: eventData.id,
              user_id: user.id,
              response_type: 'maybe',
              guest_count: 1
            });

          if (responseError) throw responseError;
          
          // Update local state to reflect the new maybe response
          setUserResponse('maybe');
          setResponseCounts(prev => ({
            ...prev,
            maybeCount: prev.maybeCount + 1
          }));
          }
        } else {
          // For non-authenticated users, just get basic response counts
          const { data: responseData, error: responseError } = await supabase
            .from('responses')
            .select('response_type')
            .eq('event_id', eventData.id);

          if (!responseError && responseData) {
            const counts = responseData.reduce((acc, response) => {
              switch (response.response_type) {
                case 'yup':
                  acc.yupCount++;
                  break;
                case 'nope':
                  acc.nopeCount++;
                  break;
                case 'maybe':
                  acc.maybeCount++;
                  break;
              }
              return acc;
            }, { yupCount: 0, nopeCount: 0, maybeCount: 0 });

            setResponseCounts(counts);
          }
        }

      } catch (error) {
        console.error('Error loading event:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [user, eventSlug, invitationToken]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notificationDebounceTimer) {
        clearTimeout(notificationDebounceTimer);
      }
    };
  }, [notificationDebounceTimer]);

  // Handle guest response submission
  const handleGuestResponse = async (responseData: any) => {
    console.log('Guest response submitted:', responseData);
    
    // Update response counts immediately for better UX
    if (responseData.response && responseData.response.response_type) {
      setResponseCounts(prev => {
        const newCounts = { ...prev };
        switch (responseData.response.response_type) {
          case 'yup':
            newCounts.yupCount++;
            break;
          case 'nope':
            newCounts.nopeCount++;
            break;
          case 'maybe':
            newCounts.maybeCount++;
            break;
        }
        return newCounts;
      });
    }

    // Show success message
    toast({
      title: "RSVP Submitted! 🎉",
      description: `Thank you for responding to ${event?.title}`,
    });
  };

  const handleResponse = async (response: "yup" | "nope" | "maybe") => {
    if (!event || !user) return;

    try {
      // Store the old response type for count adjustment
      const oldResponse = userResponse;

      if (userResponse) {
        const { error } = await supabase
          .from("responses")
          .update({ response_type: response })
          .eq("event_id", event.id)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update counts - decrement old response count and increment new response count
        setResponseCounts(prev => {
          const newCounts = { ...prev };
          if (oldResponse === 'yup') newCounts.yupCount--;
          else if (oldResponse === 'nope') newCounts.nopeCount--;
          else if (oldResponse === 'maybe') newCounts.maybeCount--;

          if (response === 'yup') newCounts.yupCount++;
          else if (response === 'nope') newCounts.nopeCount++;
          else if (response === 'maybe') newCounts.maybeCount++;

          return newCounts;
        });
      } else {
        const { error } = await supabase
          .from("responses")
          .insert({
            event_id: event.id,
            user_id: user.id,
            response_type: response,
            guest_count: 1
          });

        if (error) throw error;

        // For new response, just increment the appropriate count
        setResponseCounts(prev => {
          const newCounts = { ...prev };
          if (response === 'yup') newCounts.yupCount++;
          else if (response === 'nope') newCounts.nopeCount++;
          else if (response === 'maybe') newCounts.maybeCount++;
          return newCounts;
        });
      }

      // Update the user's response state
      setUserResponse(response);

      // Update the responses array
      setResponses(prev => {
        const newResponses = prev.filter(r => r.user_id !== user.id);
        newResponses.unshift({
          id: Date.now(), // temporary id for new response
          event_id: event.id,
          user_id: user.id,
          response_type: response,
          created_at: new Date().toISOString(),
          is_guest: false,
          guest_count: 1,
          user: {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email || 'Anonymous',
            email: user.email || '',
            profile_image_url: user.user_metadata?.avatar_url
          }
        });
        return newResponses;
      });

      // Debounced SMS notification to prevent spam
      const sendDebouncedNotification = async (finalResponse: typeof response) => {
      try {
        if (event.host_id && user.id !== event.host_id) {
            // Rate limiting: don't send if we just sent one recently (within 30 seconds)
            const now = Date.now();
            if (now - lastNotificationSent < 30000) {
              console.log('SMS notification rate limited - too recent');
              return;
            }

          // Get host's phone number
          const { data: hostData } = await supabase
            .from("users")
            .select("phone_number, display_name")
            .eq("id", event.host_id)
            .single();

          if (hostData?.phone_number) {
            const guestName = user.user_metadata?.display_name || user.email || 'Someone';
              
              console.log(`Sending SMS notification: ${guestName} → ${finalResponse}`);
            
            await fetch('/api/sms/rsvp-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                hostPhoneNumber: hostData.phone_number,
                guestName,
                eventName: event.title,
                  responseType: finalResponse,
                guestCount: 1
              }),
            });
              
              setLastNotificationSent(now);
          }
        }
      } catch (notificationError) {
        console.error('Error sending RSVP notification:', notificationError);
        // Don't fail the RSVP if notification fails
      }
      };

      // Clear any existing debounce timer
      if (notificationDebounceTimer) {
        clearTimeout(notificationDebounceTimer);
      }

      // Set a new debounce timer - only send SMS after 3 seconds of no changes
      const timer = setTimeout(() => {
        sendDebouncedNotification(response);
      }, 3000);
      
      setNotificationDebounceTimer(timer);

      toast({
        title: "Response updated",
        description: `You are ${response === 'yup' ? 'going' : response === 'nope' ? 'not going' : 'maybe going'} to ${event.title}`,
      });
    } catch (error) {
      console.error('Error updating response:', error);
      toast({
        title: "Error updating response",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error.message}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Event not found
      </div>
    );
  }

  const isOwner = user?.id === event.host_id;
  const formattedStartTime = formatTime(event.start_time);
  const formattedEndTime = event.end_time ? formatTime(event.end_time) : null;
  const timeRange = formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime;

  // Create host branding object from the fetched host data
  const hostBranding = event.host ? {
    logoUrl: event.host.logo_url || null,
    brandTheme: event.host.brand_primary_color ? JSON.stringify({
      primary: event.host.brand_primary_color,
      secondary: event.host.brand_secondary_color || event.host.brand_primary_color,
      tertiary: event.host.brand_tertiary_color || event.host.brand_primary_color,
      background: "hsl(222, 84%, 5%)" // Keep consistent background
    }) : null
  } : null;

  // Use host's custom RSVP text if available, fallback to event's custom text, then defaults
  const customYupText = event.host?.custom_yup_text || event.custom_yup_text || 'Yup!';
  const customNopeText = event.host?.custom_nope_text || event.custom_nope_text || 'Nope';
  const customMaybeText = event.host?.custom_maybe_text || event.custom_maybe_text || 'Maybe';

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

  // Helper function to add text shadow for better readability
  const getTextShadowStyle = (backgroundColor: string) => {
    const textColor = getContrastingTextColor(backgroundColor);
    const shadowColor = textColor === '#ffffff' ? '#000000' : '#ffffff';
    return {
      color: textColor,
      textShadow: `1px 1px 2px ${shadowColor}80, -1px -1px 2px ${shadowColor}40`,
      fontWeight: '500' // Make text slightly bolder for better visibility
    };
  };

  return (
    <EventBrandingProvider 
      hostBranding={hostBranding} 
      enabled={!!(event.host?.is_premium && hostBranding)}
    >
      <div 
        className="min-h-screen p-8"
        style={{ 
          backgroundColor: event.host?.brand_secondary_color || 'hsl(222, 84%, 5%)'
        }}
      >
        <div className="w-full max-w-2xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm"
              style={{ color: event.host?.brand_primary_color || '#00bcd4' }}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          </div>

          {/* Event card container */}
          <div 
            className="rounded-lg p-6 border shadow-xl hover:shadow-2xl transition-shadow duration-300"
            style={{ 
              backgroundColor: event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)',
              borderColor: `${event.host?.brand_primary_color || '#00bcd4'}30`
            }}
          >
            {/* Title and action buttons */}
            <div className="flex justify-between items-start mb-6">
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)')
                }}
              >
                {event.title}
              </h1>
              <div className="flex gap-2">
                {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                )}
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/events/${event.slug}/responses`)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Users className="h-4 w-4 mr-1" /> View Responses
                    </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/events/${event.slug}/edit`)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  </>
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {isOwner && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${event.host?.brand_primary_color || '#00bcd4'}25`,
                    color: event.host?.brand_primary_color || '#00bcd4',
                    borderColor: `${event.host?.brand_primary_color || '#00bcd4'}50`
                  }}
                >
                  Your Event
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${event.host?.brand_tertiary_color || '#ffffff'}10`,
                  color: event.host?.brand_tertiary_color || '#ffffff',
                  borderColor: `${event.host?.brand_tertiary_color || '#ffffff'}30`
                }}
              >
                {event.status}
              </Badge>
            </div>

            {/* RSVP Buttons for authenticated non-hosts */}
            {user && !isOwner && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Button
                  variant={userResponse === 'yup' ? 'default' : 'outline'}
                  className="h-auto py-4 px-3 flex flex-col items-center gap-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  style={userResponse === 'yup' ? {
                    backgroundColor: event.host?.brand_primary_color || '#00bcd4',
                    color: getContrastingTextColor(event.host?.brand_primary_color || '#00bcd4'),
                    borderColor: event.host?.brand_primary_color || '#00bcd4',
                    borderWidth: '2px'
                  } : {
                    backgroundColor: '#ffffff',
                    borderColor: event.host?.brand_primary_color || '#00bcd4',
                    color: event.host?.brand_primary_color || '#00bcd4',
                    borderWidth: '2px'
                  }}
                  onClick={() => handleResponse('yup')}
                >
                  <Check className="w-4 h-4" />
                  {customYupText}
                </Button>
                <Button
                  variant={userResponse === 'maybe' ? 'default' : 'outline'}
                  className="h-auto py-4 px-3 flex flex-col items-center gap-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  style={userResponse === 'maybe' ? {
                    backgroundColor: event.host?.brand_tertiary_color || '#ffffff',
                    color: getContrastingTextColor(event.host?.brand_tertiary_color || '#ffffff'),
                    borderColor: event.host?.brand_tertiary_color || '#ffffff',
                    borderWidth: '2px'
                  } : {
                    backgroundColor: '#ffffff',
                    borderColor: event.host?.brand_tertiary_color || '#ffffff',
                    color: event.host?.brand_tertiary_color || '#ffffff',
                    borderWidth: '2px'
                  }}
                  onClick={() => handleResponse('maybe')}
                >
                  <Users className="w-4 h-4" />
                  {customMaybeText}
                </Button>
                <Button
                  variant={userResponse === 'nope' ? 'default' : 'outline'}
                  className="h-auto py-4 px-3 flex flex-col items-center gap-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                  style={userResponse === 'nope' ? {
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                    borderColor: '#6b7280',
                    borderWidth: '2px'
                  } : {
                    backgroundColor: '#ffffff',
                    borderColor: '#6b7280',
                    color: '#6b7280',
                    borderWidth: '2px'
                  }}
                  onClick={() => handleResponse('nope')}
                >
                  <X className="w-4 h-4" />
                  {customNopeText}
                </Button>
              </div>
            )}

            {/* Guest Response Form (for non-authenticated users or invitation links) */}
            {showGuestForm && (
              <div className="mb-6">
                <GuestResponseForm
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  eventDate={formatDate(event.date)}
                  eventLocation={event.location}
                  maxGuestsPerRsvp={event.max_guests_per_rsvp}
                  customRSVPText={{
                    yup: customYupText,
                    nope: customNopeText,
                    maybe: customMaybeText
                  }}
                  brandColors={{
                    primary: event.host?.brand_primary_color || '#3b82f6',
                    secondary: event.host?.brand_secondary_color || '#f1f5f9',
                    tertiary: event.host?.brand_tertiary_color || '#1e293b'
                  }}
                  invitationToken={invitationToken || undefined}
                  onResponseSubmitted={handleGuestResponse}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
            )}

            {/* Show login prompt for non-authenticated users who can't use guest RSVP */}
            {!user && !showGuestForm && (
              <div className="text-center py-8 mb-6">
                <p className="text-gray-400 mb-4">
                  Please log in to RSVP to this event
                </p>
                <Button
                  onClick={() => router.push('/auth/login')}
                  style={{ backgroundColor: event.host?.brand_primary_color || '#3b82f6' }}
                  className="text-white"
                >
                  Log In to RSVP
                </Button>
              </div>
            )}

            {/* Event Image */}
            {event.image_url && (
              <div className="w-full mb-6">
                <div className="relative rounded-lg overflow-hidden border shadow-lg hover:shadow-xl transition-shadow duration-200"
                     style={{ borderColor: `${event.host?.brand_primary_color || '#00bcd4'}30` }}>
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            )}

            {/* Main content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Event details */}
              <div className="space-y-6">
                {/* Host info */}
                <div 
                  className="flex items-center gap-3 p-3 rounded border shadow-lg hover:shadow-xl transition-shadow duration-200"
                  style={{ 
                    backgroundColor: `${event.host?.brand_primary_color || '#00bcd4'}15`,
                    borderColor: `${event.host?.brand_primary_color || '#00bcd4'}30`
                  }}
                >
                  <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                    {event.host?.profile_image_url ? (
                      <img 
                        src={event.host.profile_image_url} 
                        alt="Host Profile" 
                        className="h-12 w-12 rounded-full object-cover" 
                      />
                    ) : (
                      <span 
                        className="text-sm font-medium" 
                        style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                      >
                        {event.host?.display_name?.charAt(0) || 'H'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p 
                      className="text-sm font-medium" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4')
                      }}
                    >
                      {event.host?.display_name || 'Host Name'}
                    </p>
                    <p 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                        opacity: 0.85
                      }}
                    >
                      Created {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="flex items-start gap-3">
                  <Calendar 
                    className="h-4 w-4 mt-1" 
                    style={{ color: event.host?.brand_primary_color || '#00bcd4' }} 
                  />
                  <div>
                    <h3 
                      className="text-sm font-semibold mb-1" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)')
                      }}
                    >
                      When
                    </h3>
                    <p 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)'),
                        opacity: 0.9
                      }}
                    >
                      {formatDate(event.date)}
                    </p>
                    <p 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)'),
                        opacity: 0.8
                      }}
                    >
                      {timeRange}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin 
                    className="h-4 w-4 mt-1" 
                    style={{ color: event.host?.brand_primary_color || '#00bcd4' }} 
                  />
                  <div>
                    <h3 
                      className="text-sm font-semibold mb-1" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)')
                      }}
                    >
                      Where
                    </h3>
                    <p 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)'),
                        opacity: 0.9
                      }}
                    >
                      {event.location}
                    </p>
                    {event.address && (
                      <p 
                        className="text-xs" 
                        style={{ 
                          ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)'),
                          opacity: 0.8
                        }}
                      >
                        {event.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - RSVP Settings */}
              <div 
                className="rounded-lg p-4 border shadow-lg hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: `${event.host?.brand_primary_color || '#00bcd4'}10`,
                  borderColor: `${event.host?.brand_primary_color || '#00bcd4'}25`
                }}
              >
                <h3 
                  className="text-sm font-semibold mb-3" 
                  style={{ 
                    ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4')
                  }}
                >
                  RSVP Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                        opacity: 0.9
                      }}
                    >
                      Guest RSVP
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: event.allow_guest_rsvp ? `${event.host?.brand_primary_color || '#00bcd4'}25` : `${event.host?.brand_tertiary_color || '#ffffff'}10`,
                        color: event.allow_guest_rsvp ? (event.host?.brand_primary_color || '#00bcd4') : (event.host?.brand_tertiary_color || '#ffffff'),
                        borderColor: event.allow_guest_rsvp ? `${event.host?.brand_primary_color || '#00bcd4'}50` : `${event.host?.brand_tertiary_color || '#ffffff'}30`
                      }}
                    >
                      {event.allow_guest_rsvp ? "Allowed" : "Not Allowed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                        opacity: 0.9
                      }}
                    >
                      Plus One
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs opacity-60"
                      style={{ 
                        backgroundColor: event.allow_plus_one ? `${event.host?.brand_primary_color || '#00bcd4'}25` : `${event.host?.brand_tertiary_color || '#ffffff'}10`,
                        color: event.allow_plus_one ? (event.host?.brand_primary_color || '#00bcd4') : (event.host?.brand_tertiary_color || '#ffffff'),
                        borderColor: event.allow_plus_one ? `${event.host?.brand_primary_color || '#00bcd4'}50` : `${event.host?.brand_tertiary_color || '#ffffff'}30`
                      }}
                    >
                      {event.allow_plus_one ? "Allowed" : "Not Allowed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-xs" 
                      style={{ 
                        ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                        opacity: 0.9
                      }}
                    >
                      Max Guests
                    </span>
                    <span 
                      className="text-xs font-medium" 
                      style={{ color: event.host?.brand_primary_color || '#00bcd4' }}
                    >
                      {event.max_guests_per_rsvp}
                    </span>
                  </div>

                  {/* Brand Logo Display */}
                  <div className="pt-4 border-t border-gray-600">
                    <div className="text-center">
                      {event.host?.logo_url ? (
                        <div>
                          <img
                            src={event.host.logo_url}
                            alt="Brand Logo"
                            className="h-32 w-auto max-w-full mx-auto object-contain rounded"
                          />
                          <p 
                            className="text-xs mt-1" 
                            style={{ 
                              ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                              opacity: 0.7
                            }}
                          >
                            Brand Logo
                          </p>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center">
                          <div className="text-center">
                            <Users 
                              className="w-8 h-8 mx-auto mb-2" 
                              style={{ color: event.host?.brand_primary_color || '#00bcd4' }} 
                            />
                            <p 
                              className="text-xs" 
                              style={{ 
                                ...getTextShadowStyle(event.host?.brand_primary_color || '#00bcd4'),
                                opacity: 0.7
                              }}
                            >
                              No Brand Logo
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Responses section - Only show to event owner */}
            {isOwner && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 
                  className="text-sm font-semibold" 
                    style={{ 
                      ...getTextShadowStyle(event.host?.brand_secondary_color || 'hsl(222, 84%, 8%)')
                    }}
                >
                  Responses
                </h3>
                <div className="flex gap-3 text-xs">
                  <span 
                    style={{ color: event.host?.brand_primary_color || '#00bcd4' }} 
                    className="font-medium"
                  >
                    {responseCounts.yupCount} {customYupText.toLowerCase()}
                  </span>
                  <span 
                    className="opacity-70" 
                    style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                  >
                    {responseCounts.nopeCount} {customNopeText.toLowerCase()}
                  </span>
                  <span style={{ color: `${event.host?.brand_primary_color || '#00bcd4'}BB` }}>
                    {responseCounts.maybeCount} {customMaybeText.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>

          <ShareEventModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            event={event as any}
            userResponse={userResponse}
          />
        </div>
      </div>
    </EventBrandingProvider>
  );
} 