"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, User, Edit } from "lucide-react";
import Eye from "lucide-react/dist/esm/icons/eye";
import { useAuth } from "@/utils/auth-context";
import { formatDate, formatTime } from "@/utils/date-formatter";
import Header from "@/dash/header";

interface EventRow {
  id: number;
  title: string;
  slug: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  address?: string;
  description?: string;
  image_url?: string;
  host_id: string;
  status?: string;
  created_at?: string;
  rsvp_visibility?: string;
  response_counts?: {
    yupCount: number;
    nopeCount: number;
    maybeCount: number;
  };
  user_response?: "yup" | "nope" | "maybe" | null;
}

interface UserPlan {
  is_premium: boolean;
  is_pro: boolean;
}

const fetchEvents = async (userId: string) => {
  const response = await fetch('/api/events/my', {
    headers: {
      'x-user-id': userId,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
};

const fetchInvitedEvents = async (accessToken: string) => {
  const response = await fetch('/api/events/invited', {
    headers: {
      'authorization': `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch invited events');
  return response.json();
};

type ResponseFilter = "all" | "yup" | "nope" | "maybe" | "archives";

const getContrastingTextColor = (backgroundColor: string) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

export default function MyEventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [tab, setTab] = useState<"hosting" | "invited">("hosting");
  const [subtab, setSubtab] = useState<ResponseFilter>("all");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user's plan
        const fetchUserPlan = async () => {
          try {
            const response = await fetch('/api/user/plan', {
              headers: {
                'authorization': `Bearer ${user.access_token}`,
              },
            });
            if (response.ok) {
              const plan = await response.json();
              setUserPlan(plan);
            }
          } catch (error) {
            console.error('Error fetching user plan:', error);
          }
        };

        // Fetch events in parallel
        const [hostedEvents, invitedEventsData] = await Promise.all([
          fetchEvents(user.id),
          fetchInvitedEvents(user.access_token),
          fetchUserPlan()
        ]);

        setEvents(hostedEvents);
        setInvitedEvents(invitedEventsData);
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Note: Auth is guaranteed by middleware, no need to check for user existence
  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading your events...</p>
        </div>
      </div>
    );
  }

  const isLoading = !events && !error;
  const isFreeUser = !userPlan?.is_premium && !userPlan?.is_pro;
  const hasUnlimitedEvents = userPlan?.is_premium || userPlan?.is_pro;
  
  // Archive threshold logic: an event is considered archived only if
  // (a) its event date is in the past *and* (b) it was created more than 2
  //     days ago. This ensures that users still see newly-created events even
  //     if they accidentally pick a past date.
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const now = new Date();
  
  // Filter events based on status and date
  const activeEvents = (events || []).filter(ev => {
    // Check if explicitly archived via status field
    if (ev.status === 'archived') return false;
    
    // Legacy date-based archiving: an event is considered archived only if
    // (a) its event date is in the past *and* (b) it was created more than 2
    //     days ago. This ensures that users still see newly-created events even
    //     if they accidentally pick a past date.
    const eventDate = new Date(ev.date);
    const createdAt = new Date(ev.created_at || ev.date);
    const isPast = eventDate < now;
    const isOld = now.getTime() - createdAt.getTime() > twoDaysMs;
    const dateArchived = isPast && isOld;
    
    return !dateArchived;
  });

  const archivedEvents = (events || []).filter(ev => {
    // Check if explicitly archived via status field
    if (ev.status === 'archived') return true;
    
    // Legacy date-based archiving
    const eventDate = new Date(ev.date);
    const createdAt = new Date(ev.created_at || ev.date);
    const isPast = eventDate < now;
    const isOld = now.getTime() - createdAt.getTime() > twoDaysMs;
    
    return isPast && isOld;
  });

  const eventCount = activeEvents.length; // Count only active events
  const freeEventLimit = 3;
  const isNearLimit = isFreeUser && eventCount >= freeEventLimit - 1;
  const hasReachedLimit = isFreeUser && eventCount >= freeEventLimit;
  const getPlanDisplayName = () => {
    if (!userPlan) return "Free";
    if (userPlan.is_premium) return "Premium";
    if (userPlan.is_pro) return "Pro";
    return "Free";
  };

  const getPlanColor = () => {
    if (!userPlan) return "bg-gray-500";
    if (userPlan.is_premium) return "bg-purple-500";
    if (userPlan.is_pro) return "bg-blue-500";
    return "bg-gray-500";
  };

  // Filter events based on subtab
  const filteredHostingEvents = events.filter(event => {
    if (subtab === "all") return true;
    if (!event.response_counts) return false;
    
    switch (subtab) {
      case "yup":
        return event.response_counts.yupCount > 0;
      case "nope":
        return event.response_counts.nopeCount > 0;
      case "maybe":
        return event.response_counts.maybeCount > 0;
      default:
        return true;
    }
  });

  const filteredInvitedEvents = invitedEvents.filter(event => {
    if (subtab === "all") return true;
    if (!event.response_counts) return false;
    
    switch (subtab) {
      case "yup":
        return event.response_counts.yupCount > 0;
      case "nope":
        return event.response_counts.nopeCount > 0;
      case "maybe":
        return event.response_counts.maybeCount > 0;
      default:
        return true;
    }
  });

  const isEventOwner = (event: EventRow) => user?.id === event.host_id;
  const canViewRSVPs = (event: EventRow) => {
    return isEventOwner(event) || event.rsvp_visibility === "public";
  };

  const formatEventTime = (event: EventRow) => {
    if (!event.start_time) return "";
    const startTime = formatTime(event.start_time);
    const endTime = event.end_time ? formatTime(event.end_time) : null;
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  return (
    <div className="w-full min-h-screen bg-page-background">
      <Header />
      <div className="max-w-lg mx-auto px-6 pt-2">
        <h1 className="text-2xl font-bold text-white mb-6">My Events</h1>
      </div>
      <div className="max-w-lg mx-auto px-6 pb-8 min-h-screen flex flex-col bg-page-container">
        <header className="sticky z-10 bg-page-header pt-4">
          <div className="flex justify-between items-center pb-6 -mb-4">
          </div>
          {/* Tab selection system with consistent px-6 */}
          <div>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="flex w-full bg-transparent pb-0 pt-2 gap-x-[2px]">
                <TabsTrigger
                  value="hosting"
                  className={`flex-1 px-4 py-2 text-base font-medium transition-colors
                    ${tab === "hosting" ? "text-white bg-[#FF00FF]" : "text-gray-300 bg-page-container"}`}
                >
                  Hosting
                </TabsTrigger>
                <TabsTrigger
                  value="invited"
                  className={`flex-1 px-4 py-2 text-base font-medium transition-colors
                    ${tab === "invited" ? "text-white bg-[#FF00FF]" : "text-gray-300 bg-page-container"}`}
                >
                  Invited To
                </TabsTrigger>
              </TabsList>
              {/* Subtabs for Hosting */}
              {tab === "hosting" && (
                <Tabs value={subtab} onValueChange={setSubtab} className="w-full">
                  <TabsList className="flex w-full bg-transparent pt-2 pb-0 gap-x-[2px]">
                    <TabsTrigger
                      value="all"
                      className={`flex-1 px-3 py-1 text-sm font-medium transition-colors border-b-2
                        ${subtab === "all"
                          ? "text-white bg-page-container border-b-2 border-[#FF00FF]"
                          : "text-gray-300 bg-tab-inactive border-b-2 border-transparent"}`}
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="yup"
                      className={`flex-1 px-3 py-1 text-sm font-medium transition-colors border-b-2
                        ${subtab === "yup"
                          ? "text-white bg-page-container border-b-2 border-[#FF00FF]"
                          : "text-gray-300 bg-tab-inactive border-b-2 border-transparent"}`}
                    >
                      Yup
                    </TabsTrigger>
                    <TabsTrigger
                      value="nope"
                      className={`flex-1 px-3 py-1 text-sm font-medium transition-colors border-b-2
                        ${subtab === "nope"
                          ? "text-white bg-page-container border-b-2 border-[#FF00FF]"
                          : "text-gray-300 bg-tab-inactive border-b-2 border-transparent"}`}
                    >
                      Nope
                    </TabsTrigger>
                    <TabsTrigger
                      value="maybe"
                      className={`flex-1 px-3 py-1 text-sm font-medium transition-colors border-b-2
                        ${subtab === "maybe"
                          ? "text-white bg-page-container border-b-2 border-[#FF00FF]"
                          : "text-gray-300 bg-tab-inactive border-b-2 border-transparent"}`}
                    >
                      Maybe
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {/* Section heading directly below tabs, above event cards */}
              <div className="pt-6 pb-2">
                <h2 className="pl-4 text-lg font-semibold text-white">
                  {tab === "hosting" ? "I'M HOSTING" : "I'm Invited To"}
                </h2>
              </div>
              <TabsContent value="hosting">
                {error ? (
                  <div className="text-center text-red-400">Failed to load events</div>
                ) : !events ? (
                  <div className="text-center text-gray-400">Loading your events...</div>
                ) : filteredHostingEvents.length === 0 ? (
                  <div className="text-center text-gray-400">No events yet</div>
                ) : (
                  <div className="space-y-4">
                    {filteredHostingEvents.map(event => (
                      <Card 
                        key={event.id} 
                        className="bg-event-block border-none shadow-none hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                        onClick={() => router.push(`/events/${event.slug}`)}
                      >
                        <CardContent className="py-4 px-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                {event.start_time && (
                                  <div className="flex items-center gap-1">
                                    <span>{formatEventTime(event)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* RSVP Counts and View RSVPs Button */}
                          <div className="flex justify-between items-center">
                            {event.response_counts && (
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-green-400">
                                  <User className="h-4 w-4" />
                                  <span>{event.response_counts.yupCount} Yup</span>
                                </div>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <div className="flex items-center gap-1 text-red-400">
                                  <span>{event.response_counts.nopeCount} Nope</span>
                                </div>
                                {event.response_counts.maybeCount > 0 && (
                                  <>
                                    <div className="w-px h-4 bg-gray-600"></div>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                      <span>{event.response_counts.maybeCount} Maybe</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            {canViewRSVPs(event) && (
                              <Button
                                size="sm"
                                className="bg-[#FF00FF] text-white hover:bg-[#FF00FF]/90 hover:scale-105 transition-all duration-200 z-10 relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/events/${event.slug}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View RSVPs
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="invited">
                {error ? (
                  <div className="text-center text-red-400">Failed to load events</div>
                ) : !invitedEvents ? (
                  <div className="text-center text-gray-400">Loading invited events...</div>
                ) : filteredInvitedEvents.length === 0 ? (
                  <div className="text-center text-gray-400">No invited events yet</div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitedEvents.map(event => (
                      <Card 
                        key={event.id} 
                        className="bg-event-block border-none shadow-none hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                        onClick={() => router.push(`/events/${event.slug}`)}
                      >
                        <CardContent className="py-4 px-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                {event.start_time && (
                                  <div className="flex items-center gap-1">
                                    <span>{formatEventTime(event)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isEventOwner(event) && (
                                <button
                                  className="text-gray-300 hover:text-white transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/events/${event.slug}/edit`);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* RSVP Counts and View RSVPs Button */}
                          <div className="flex justify-between items-center">
                            {event.response_counts && (
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-green-400">
                                  <User className="h-4 w-4" />
                                  <span>{event.response_counts.yupCount} Yup</span>
                                </div>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <div className="flex items-center gap-1 text-red-400">
                                  <span>{event.response_counts.nopeCount} Nope</span>
                                </div>
                                {event.response_counts.maybeCount > 0 && (
                                  <>
                                    <div className="w-px h-4 bg-gray-600"></div>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                      <span>{event.response_counts.maybeCount} Maybe</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            {canViewRSVPs(event) && (
                              <Button
                                size="sm"
                                className="bg-[#FF00FF] text-white hover:bg-[#FF00FF]/90 hover:scale-105 transition-all duration-200 z-10 relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/events/${event.slug}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View RSVPs
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </header>
      </div>
      <footer className="w-full bg-[#171717] h-16" />
    </div>
  );
}
