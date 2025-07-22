"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Eye from "lucide-react/dist/esm/icons/eye";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { getSupabaseClient } from "@/utils/supabase";
import { formatDate, formatTime } from "@/utils/date-formatter";
import Header from "@/dash/header";

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

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.slug as string;

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

        setEvent(eventData);
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [slug]);

  const formatEventTime = () => {
    if (!event) return "";
    const startTime = formatTime(event.start_time);
    const endTime = event.end_time ? formatTime(event.end_time) : null;
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const isEventOwner = () => {
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page-background">
        <Header />
        <div className="max-w-lg mx-auto px-6 pt-8">
          <h1 className="text-2xl font-bold text-white mb-6">Event Details</h1>
        </div>
        <div className="max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-page-container">
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
        <div className="max-w-lg mx-auto px-6 pt-8">
          <h1 className="text-2xl font-bold text-white mb-6">Event Details</h1>
        </div>
        <div className="max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-page-container">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-400">{error || "Event not found"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-name="event-details-outer" className="w-full min-h-screen bg-page-background flex flex-col">
      <Header />
      <div data-name="event-details-bg-container" className="flex-1 flex flex-col items-center justify-start">
        <div className="max-w-lg w-full flex-1 flex flex-col items-center justify-start">
          {/* Back button above heading, left-aligned */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white mb-2 px-0 self-start pl-2 pr-2 hover:bg-black hover:text-white focus:bg-black focus:text-white"
            data-name="event-details-back-btn"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white mb-6 self-start" data-name="event-details-heading">Event Details</h1>
          <Card data-name="event-details-card" className="w-full bg-[#262626] border-none shadow-none p-0 flex-1 flex flex-col justify-between">
            <CardContent className="w-full p-10 flex flex-col gap-6 relative flex-1" data-name="event-details-card-content">
              {/* Event Header */}
              <div data-name="event-details-header" className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2 font-inter" data-name="event-details-title">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-4" data-name="event-details-badges">
                    {isEventOwner() && (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/25 text-blue-300 border-blue-500/50">
                        Your Event
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-500/25 text-gray-300 border-gray-500/50">
                      {event.status}
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
                    data-name="event-details-edit-btn"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Event Creator */}
              <div className="flex items-center gap-3" data-name="event-details-creator">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.host.profile_image_url} />
                  <AvatarFallback className="bg-gray-600 text-white">
                    {event.host.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-medium">{event.host.display_name}</p>
                  <p className="text-gray-400 text-sm">
                    Created {formatDate(event.created_at)}
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
              </div>

              {/* RSVP Settings */}
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

              {/* Bottom row actions */}
              <div className="flex gap-6 mt-8 justify-end" data-name="event-details-actions">
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
                {/* View Responses solid primary button */}
                {isEventOwner() && (
                  <Button
                    size="sm"
                    className="bg-[#FF00FF] text-white hover:bg-[#FF00FF]/90 hover:scale-105 transition-all duration-200 z-10 relative h-10 px-4 flex items-center"
                    onClick={handleViewResponses}
                    data-name="event-details-view-responses-btn"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Responses
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Footer */}
      <div data-name="event-details-footer" className="w-full bg-[#171717] h-16 mt-0 flex-shrink-0" />
    </div>
  );
} 