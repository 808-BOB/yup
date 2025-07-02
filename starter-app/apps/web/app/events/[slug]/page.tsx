"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Share2, Edit, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime } from "@/utils/date-formatter";
import ShareEventModal from "@/components/share-event-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Response {
  id: number;
  user_id: string;
  response_type: "yup" | "nope" | "maybe";
  created_at: string;
  is_guest: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_count: number;
  user?: {
    display_name: string;
    email: string;
    profile_image_url?: string;
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

interface Event {
  id: number;
  image_url?: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address?: string;
  description?: string;
  host_id: string;
  status: string;
  created_at: string;
  slug: string;
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
  host?: {
    display_name: string;
    email: string;
    profile_image_url?: string;
  };
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userResponse, setUserResponse] = useState<"yup" | "nope" | null>(null);
  const [responseCounts, setResponseCounts] = useState({ yupCount: 0, nopeCount: 0, maybeCount: 0 });

  useEffect(() => {
    const fetchEventData = async () => {
      if (!params.slug) return;

      try {
        // Fetch event with host details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            host:host_id (
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq("slug", params.slug)
          .single();

        if (eventError) throw eventError;
        if (!eventData) {
          toast({
            title: "Event not found",
            description: "The event you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push("/my-events");
          return;
        }

        setEvent(eventData);

        // Fetch responses with user details
        const { data: responseData, error: responseError } = await supabase
          .from("responses")
          .select(`
            *,
            user:user_id (
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq("event_id", eventData.id)
          .order("created_at", { ascending: false });

        if (responseError) throw responseError;
        setResponses(responseData || []);

        // Calculate response counts
        const counts = { yupCount: 0, nopeCount: 0, maybeCount: 0 };
        responseData?.forEach(response => {
          if (response.response_type === "yup") counts.yupCount++;
          else if (response.response_type === "nope") counts.nopeCount++;
          else if (response.response_type === "maybe") counts.maybeCount++;
        });
        setResponseCounts(counts);

        // Fetch invitations with user details
        const { data: inviteData, error: inviteError } = await supabase
          .from("invitations")
          .select(`
            *,
            user:user_id (
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq("event_id", eventData.id)
          .order("created_at", { ascending: false });

        if (inviteError) throw inviteError;
        setInvitations(inviteData || []);

        // Get user's response if logged in
        if (user) {
          const userResp = responseData?.find(r => r.user_id === user.id);
          if (userResp) {
            setUserResponse(userResp.response_type as "yup" | "nope");
          }
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast({
          title: "Error",
          description: "Failed to load event details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [params.slug, user, router, toast]);

  const handleResponse = async (response: "yup" | "nope") => {
    if (!event || !user) return;

    try {
      if (userResponse) {
        const { error } = await supabase
          .from("responses")
          .update({ response_type: response })
          .eq("event_id", event.id)
          .eq("user_id", user.id);

        if (error) throw error;
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
      }

      // Refresh the page data
      router.refresh();
      
      setUserResponse(response);
      toast({
        title: "Response updated",
        description: `You've responded ${response} to this event.`,
      });
    } catch (error) {
      console.error("Error updating response:", error);
      toast({
        title: "Error",
        description: "Failed to update your response.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Title and action buttons */}
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/events/${event.slug}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Event details */}
            <div className="md:col-span-2 space-y-6">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {isOwner && (
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                    Your Event
                  </Badge>
                )}
                <Badge variant="outline" className="bg-gray-800 text-gray-300">
                  {event.status}
                </Badge>
                {event.waitlist_enabled && (
                  <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400">
                    Waitlist Enabled
                  </Badge>
                )}
              </div>

              {/* Host info */}
              <div className="flex items-center gap-3 bg-gray-800/30 p-3 rounded">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={event.host?.profile_image_url} />
                  <AvatarFallback>
                    {event.host?.display_name?.charAt(0) || 'H'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.host?.display_name || 'Host'}</p>
                  <p className="text-sm text-gray-400">Created {new Date(event.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h2 className="font-semibold mb-1">When</h2>
                  <p className="text-gray-300">{formatDate(event.date)}</p>
                  <p className="text-gray-300">{timeRange}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h2 className="font-semibold mb-1">Where</h2>
                  <p className="text-gray-300">{event.location}</p>
                  {event.address && (
                    <p className="text-gray-400 mt-1">{event.address}</p>
                  )}
                </div>
              </div>

              {/* Description if available */}
              {event.description && (
                <div>
                  <h2 className="font-semibold mb-2">Details</h2>
                  <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>

            {/* Right column - RSVP Settings */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">RSVP Settings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Guest RSVP</span>
                  <Badge variant="outline" className={event.allow_guest_rsvp ? "bg-green-900/20 text-green-400" : "bg-gray-700 text-gray-400"}>
                    {event.allow_guest_rsvp ? "Allowed" : "Not Allowed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Plus One</span>
                  <Badge variant="outline" className={event.allow_plus_one ? "bg-green-900/20 text-green-400" : "bg-gray-700 text-gray-400"}>
                    {event.allow_plus_one ? "Allowed" : "Not Allowed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Guests per RSVP</span>
                  <span className="text-primary font-medium">{event.max_guests_per_rsvp}</span>
                </div>
                {event.capacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Event Capacity</span>
                    <span className="text-primary font-medium">{event.capacity} people</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">RSVP Visibility</span>
                  <Badge variant="outline" className="bg-gray-700">
                    {event.rsvp_visibility}
                  </Badge>
                </div>
                {event.use_custom_rsvp_text && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Custom RSVP Text</p>
                    {event.custom_yup_text && (
                      <p className="text-sm text-green-400">Yup: {event.custom_yup_text}</p>
                    )}
                    {event.custom_nope_text && (
                      <p className="text-sm text-red-400">Nope: {event.custom_nope_text}</p>
                    )}
                    {event.custom_maybe_text && (
                      <p className="text-sm text-yellow-400">Maybe: {event.custom_maybe_text}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Response section */}
          <div className="border-t border-gray-800 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Responses</h2>
              <div className="flex items-center gap-4">
                <span className="text-green-400">{responseCounts.yupCount} yup</span>
                <span className="text-red-400">{responseCounts.nopeCount} nope</span>
                {responseCounts.maybeCount > 0 && (
                  <span className="text-yellow-400">{responseCounts.maybeCount} maybe</span>
                )}
              </div>
            </div>

            {user && !isOwner && (
              <div className="flex gap-2 mb-6">
                <Button
                  variant={userResponse === "yup" ? "default" : "outline"}
                  className={userResponse === "yup" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => handleResponse("yup")}
                >
                  {event.use_custom_rsvp_text ? event.custom_yup_text || "Yup" : "Yup"}
                </Button>
                <Button
                  variant={userResponse === "nope" ? "default" : "outline"}
                  className={userResponse === "nope" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => handleResponse("nope")}
                >
                  {event.use_custom_rsvp_text ? event.custom_nope_text || "Nope" : "Nope"}
                </Button>
              </div>
            )}

            {!user && (
              <p className="text-gray-400 mb-6">
                Please <button onClick={() => router.push("/auth/login")} className="text-primary hover:underline">log in</button> to respond to this event.
              </p>
            )}

            {/* Response list */}
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={response.user?.profile_image_url} />
                    <AvatarFallback>
                      {response.is_guest 
                        ? response.guest_name?.charAt(0) 
                        : response.user?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {response.is_guest ? response.guest_name : response.user?.display_name}
                      {response.guest_count > 1 && ` +${response.guest_count - 1}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(response.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      response.response_type === "yup"
                        ? "bg-green-900/20 text-green-400"
                        : response.response_type === "nope"
                        ? "bg-red-900/20 text-red-400"
                        : "bg-yellow-900/20 text-yellow-400"
                    }
                  >
                    {response.response_type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Invitations section (visible only to host) */}
          {isOwner && invitations.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-4">Invitations</h2>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={invitation.user?.profile_image_url} />
                        <AvatarFallback>
                          {invitation.user?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{invitation.user?.display_name}</p>
                        <p className="text-sm text-gray-400">
                          Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          invitation.status === "pending"
                            ? "bg-yellow-900/20 text-yellow-400"
                            : invitation.status === "accepted"
                            ? "bg-green-900/20 text-green-400"
                            : "bg-red-900/20 text-red-400"
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <ShareEventModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={event}
        />
      </div>
    </div>
  );
} 