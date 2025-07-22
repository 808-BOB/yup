"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/utils/use-toast";
import { getSupabaseClient } from "@/lib/supabase";
import Header from "@/dash/header";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import EventBrandingProvider from "@/dash/event-branding-provider";
import { useBranding } from "@/contexts/BrandingContext";
// Note: useRequireAuth is no longer needed since middleware handles authentication
import { type Event, type Response } from "@/types";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import Clock from "lucide-react/dist/esm/icons/clock";
import User from "lucide-react/dist/esm/icons/user";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Crown from "lucide-react/dist/esm/icons/crown";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Calendar from "lucide-react/dist/esm/icons/calendar";

interface EventResponse {
  id: number;
  response_type: "yup" | "nope" | "maybe";
  created_at: string;
  user_id: string;
  is_guest?: boolean;
  guest_name?: string;
  guest_email?: string;
  users?: {
    display_name: string;
    email: string;
    profile_image_url?: string;
  };
}

interface UserPlan {
  is_premium: boolean;
  is_pro: boolean;
}

interface ExtendedEvent extends Event {
  host?: {
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

export default function EventResponsesPage() {
  // Note: Auth is guaranteed by middleware
  
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug as string;
  
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>({ is_premium: false, is_pro: false });

  // Helper function to get contrasting text color
  const getContrastingTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? '#ffffff' : '#000000';
  };

  useEffect(() => {
    const fetchEventAndResponses = async () => {
      if (!user || !slug) {
        console.log('fetchEventAndResponses: Missing user or slug', { user: !!user, slug });
        return;
      }

      console.log('fetchEventAndResponses: Starting data fetch for', { userId: user.id, slug });

      try {
        // Initialize Supabase client with error handling
        let supabase;
        try {
          supabase = getSupabaseClient();
          if (!supabase) {
            console.error('fetchEventAndResponses: Failed to initialize Supabase client');
            throw new Error('Supabase client not available');
          }
        } catch (supabaseError) {
          console.error('fetchEventAndResponses: Supabase client error:', supabaseError);
          // Redirect to event details page as fallback
          router.push(`/events/${slug}`);
          return;
        }

        // Fetch user plan information
        const { data: planData, error: planError } = await supabase
          .from('users')
          .select('is_premium, is_pro')
          .eq('id', user.id)
          .single();

        if (!planError && planData) {
          console.log('fetchEventAndResponses: User plan data:', planData);
          setUserPlan(planData);
        } else {
          console.log('fetchEventAndResponses: User plan fetch error:', planError);
        }

        // Fetch event details with host branding
        console.log('fetchEventAndResponses: Fetching event data for slug:', slug);
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
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
          .eq('slug', slug)
          .single();

        if (eventError) {
          console.log('fetchEventAndResponses: Event fetch error:', eventError);
          throw new Error('Event not found');
        }

        console.log('fetchEventAndResponses: Event data fetched:', eventData);

        // Transform the host array into a single object
        const transformedEvent = {
          ...eventData,
          host: Array.isArray(eventData.host) ? eventData.host[0] : eventData.host
        } as ExtendedEvent;

        console.log('fetchEventAndResponses: Transformed event:', transformedEvent);
        console.log('fetchEventAndResponses: Is owner?', user.id === transformedEvent.host_id);

        setEvent(transformedEvent);

        // Fetch responses for the event including guest responses
        console.log('fetchEventAndResponses: Fetching responses for event_id:', eventData.id);
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select(`
            id,
            response_type,
            created_at,
            user_id,
            is_guest,
            guest_name,
            guest_email,
            users (
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (responsesError) {
          console.log('fetchEventAndResponses: Responses fetch error:', responsesError);
          throw new Error('Failed to load responses');
        }

        console.log('fetchEventAndResponses: Raw responses from database:', responsesData);

        // Remove duplicate responses (keep latest response per user)
        // For guest responses, we need to be more careful about deduplication
        const uniqueResponses = responsesData?.reduce((acc, response) => {
          // For guest responses, use a combination of user_id, guest_name, and guest_email for uniqueness
          let uniqueKey;
          if (response.is_guest) {
            uniqueKey = `guest_${response.guest_name}_${response.guest_email || 'no-email'}`;
          } else {
            uniqueKey = response.user_id;
          }
          
          const existingResponse = acc.find(r => {
            if (r.is_guest && response.is_guest) {
              return `guest_${r.guest_name}_${r.guest_email || 'no-email'}` === uniqueKey;
            }
            return r.user_id === response.user_id;
          });
          
          if (!existingResponse) {
            acc.push(response);
          }
          return acc;
        }, [] as any[]) || [];

        console.log('Fetched responses:', responsesData?.length || 0);
        console.log('Unique responses after filtering:', uniqueResponses.length);
        console.log('Response details:', uniqueResponses);

        setResponses(uniqueResponses);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load event responses.",
          variant: "destructive",
        });
        router.push('/my-events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndResponses();
  }, [slug, user, toast, router]);

  // Note: Auth is guaranteed by middleware, so we only check if user is loaded
  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading user data...</p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading responses...</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // Check user's plan for analytics access
  const hasAdvancedAnalytics = userPlan.is_premium || userPlan.is_pro;
  const isFreeUser = !userPlan.is_premium && !userPlan.is_pro;
  const isOwner = user?.id === event.host_id;

  console.log('Render: Current state:', {
    isOwner,
    hasAdvancedAnalytics,
    isFreeUser,
    responsesCount: responses.length,
    user: user?.id,
    hostId: event.host_id,
    userPlan
  });

  // Calculate response counts
  const yupResponses = responses.filter(r => r.response_type === 'yup');
  const nopeResponses = responses.filter(r => r.response_type === 'nope');
  const maybeResponses = responses.filter(r => r.response_type === 'maybe');

  // Advanced analytics calculations (only for Pro/Premium)
  const totalResponses = responses.length;
  const responseRate = totalResponses > 0 ? ((yupResponses.length / totalResponses) * 100).toFixed(1) : "0";
  
  // Get response timeline data (group by date for trends)
  const responsesByDate = responses.reduce((acc, response) => {
    const date = new Date(response.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Create host branding object
  const hostBranding = event.host ? {
    logoUrl: event.host.logo_url || null,
    brandTheme: event.host.brand_primary_color ? JSON.stringify({
      primary: event.host.brand_primary_color,
      secondary: event.host.brand_secondary_color || event.host.brand_primary_color,
      tertiary: event.host.brand_tertiary_color || event.host.brand_primary_color,
      background: "hsl(222, 84%, 5%)" // Keep consistent background
    }) : null
  } : null;

  // Use host's custom RSVP text if available
  const customYupText = event.host?.custom_yup_text || 'Going';
  const customNopeText = event.host?.custom_nope_text || 'Not Going';
  const customMaybeText = event.host?.custom_maybe_text || 'Maybe';

  const getResponseIcon = (responseType: string) => {
    switch (responseType) {
      case 'yup':
        return <Check className="h-4 w-4" style={{ color: event.host?.brand_primary_color || '#10b981' }} />;
      case 'nope':
        return <X className="h-4 w-4" style={{ color: event.host?.brand_tertiary_color || '#ef4444' }} />;
      case 'maybe':
        return <Clock className="h-4 w-4" style={{ color: event.host?.brand_primary_color + '80' || '#f59e0b' }} />;
      default:
        return null;
    }
  };

  const getResponseBadgeStyle = (responseType: string) => {
    const primaryColor = event.host?.brand_primary_color || '#3b82f6';
    const tertiaryColor = event.host?.brand_tertiary_color || '#ffffff';
    
    switch (responseType) {
      case 'yup':
        return {
          backgroundColor: primaryColor + '20',
          borderColor: primaryColor + '40',
          color: primaryColor
        };
      case 'nope':
        return {
          backgroundColor: tertiaryColor + '15',
          borderColor: tertiaryColor + '30',
          color: tertiaryColor
        };
      case 'maybe':
        return {
          backgroundColor: primaryColor + '15',
          borderColor: primaryColor + '30',
          color: primaryColor + 'CC'
        };
      default:
        return {
          backgroundColor: '#374151',
          borderColor: '#4b5563',
          color: '#9ca3af'
        };
    }
  };

  // Final debug log before rendering
  console.log('Response List: About to render', { 
    isOwner, 
    responsesLength: responses.length,
    responses: responses.slice(0, 3) // Show first 3 for debugging
  });

  return (
    <EventBrandingProvider 
      hostBranding={hostBranding} 
      enabled={!!(event.host?.is_premium && hostBranding)}
    >
      <div 
        className="min-h-screen"
        style={{ backgroundColor: event.host?.brand_secondary_color || '#0a0a14' }}
      >
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <main className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
                className="text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

            <div className="space-y-2">
              <h1 
                className="text-3xl font-bold"
                style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
              >
                {event.title}
              </h1>
              <p 
                className="text-gray-400"
                style={{ color: event.host?.brand_tertiary_color + '80' || '#9ca3af' }}
              >
                Event Responses
              </p>
            </div>

        {/* Response Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card 
                className="border shadow-lg hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: event.host?.brand_primary_color + '15' || '#10b98120',
                  borderColor: event.host?.brand_primary_color + '40' || '#10b98140'
                }}
              >
                <CardContent className="p-6 text-center">
                  <p 
                    className="text-3xl font-bold mb-1"
                    style={{ color: event.host?.brand_primary_color || '#10b981' }}
                  >
                    {yupResponses.length}
                  </p>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: event.host?.brand_primary_color + 'CC' || '#059669' }}
                  >
                    {customYupText}
                  </p>
            </CardContent>
          </Card>
              
              <Card 
                className="border shadow-lg hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: event.host?.brand_tertiary_color + '10' || '#ef444420',
                  borderColor: event.host?.brand_tertiary_color + '30' || '#ef444430'
                }}
              >
                <CardContent className="p-6 text-center">
                  <p 
                    className="text-3xl font-bold mb-1"
                    style={{ color: event.host?.brand_tertiary_color || '#ef4444' }}
                  >
                    {nopeResponses.length}
                  </p>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: event.host?.brand_tertiary_color + 'CC' || '#dc2626' }}
                  >
                    {customNopeText}
                  </p>
            </CardContent>
          </Card>
              
              <Card 
                className="border shadow-lg hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: event.host?.brand_primary_color + '10' || '#f59e0b20',
                  borderColor: event.host?.brand_primary_color + '25' || '#f59e0b25'
                }}
              >
                <CardContent className="p-6 text-center">
                  <p 
                    className="text-3xl font-bold mb-1"
                    style={{ color: event.host?.brand_primary_color + 'BB' || '#f59e0b' }}
                  >
                    {maybeResponses.length}
                  </p>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: event.host?.brand_primary_color + '99' || '#d97706' }}
                  >
                    {customMaybeText}
                  </p>
            </CardContent>
          </Card>
        </div>

            {/* Advanced Analytics (only for premium/pro hosts) */}
        {isOwner && hasAdvancedAnalytics && (
              <Card 
                className="border shadow-lg hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: event.host?.brand_secondary_color + 'F0' || '#111827F0',
                  borderColor: event.host?.brand_primary_color + '30' || '#374151'
                }}
              >
            <CardHeader>
                  <CardTitle 
                    className="text-xl flex items-center gap-2"
                    style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                  >
                    <TrendingUp 
                      className="h-5 w-5" 
                      style={{ color: event.host?.brand_primary_color || '#3b82f6' }}
                    />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                <div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: event.host?.brand_tertiary_color + '80' || '#9ca3af' }}
                      >
                        Response Rate
                      </p>
                      <p 
                        className="text-3xl font-bold"
                        style={{ color: event.host?.brand_primary_color || '#3b82f6' }}
                      >
                        {responseRate}%
                      </p>
                </div>
                <div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: event.host?.brand_tertiary_color + '80' || '#9ca3af' }}
                      >
                        Total Responses
                      </p>
                      <p 
                        className="text-3xl font-bold"
                        style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                      >
                        {totalResponses}
                      </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

            {/* Separator */}
            <Separator 
              className="my-8" 
              style={{ backgroundColor: event.host?.brand_primary_color + '30' || '#374151' }}
            />

        {/* Response List */}
            <Card 
              className="border-2 shadow-xl"
              style={{ 
                backgroundColor: event.host?.brand_secondary_color + 'F0' || '#111827F0',
                borderColor: event.host?.brand_primary_color + '60' || '#374151'
              }}
            >
          <CardHeader>
                <CardTitle 
                  className="text-xl flex items-center gap-2"
                  style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                >
                  <User 
                    className="h-5 w-5" 
                    style={{ color: event.host?.brand_primary_color || '#3b82f6' }}
                  />
                  Responses ({totalResponses})
            </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="space-y-3">
                  {responses.length === 0 ? (
                    <div className="text-center py-8">
                      <User 
                        className="h-12 w-12 mx-auto mb-4 opacity-50"
                        style={{ color: event.host?.brand_primary_color || '#6b7280' }}
                      />
                      <p 
                        className="opacity-70"
                        style={{ color: event.host?.brand_tertiary_color || '#9ca3af' }}
                      >
                        No responses yet
                      </p>
                    </div>
                  ) : (
                    responses.map((response) => (
                <div
                  key={response.id}
                        className="flex items-center justify-between p-4 rounded-lg border transition-all duration-150"
                        style={{ 
                          backgroundColor: event.host?.brand_secondary_color + 'CC' || '#1f293780',
                          borderColor: event.host?.brand_primary_color + '20' || '#374151'
                        }}
                >
                  <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border-2"
                            style={{ 
                              backgroundColor: event.host?.brand_primary_color + '20' || '#374151',
                              borderColor: event.host?.brand_primary_color + '40' || '#4b5563'
                            }}
                          >
                      {response.users?.profile_image_url ? (
                        <img
                          src={response.users.profile_image_url}
                                alt={response.users?.display_name || response.guest_name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                              <span 
                                className="text-sm font-medium"
                                style={{ color: event.host?.brand_primary_color || '#ffffff' }}
                              >
                                {(response.users?.display_name || response.guest_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                            <p 
                              className="font-medium"
                              style={{ color: event.host?.brand_tertiary_color || '#ffffff' }}
                            >
                              {response.users?.display_name || response.guest_name || 'Anonymous'}
                              {response.is_guest && (
                                <Badge 
                                  variant="outline" 
                                  className="ml-2 text-xs"
                                  style={{ 
                                    backgroundColor: event.host?.brand_primary_color + '15' || '#6b728015',
                                    borderColor: event.host?.brand_primary_color + '40' || '#6b728040',
                                    color: event.host?.brand_primary_color || '#6b7280'
                                  }}
                                >
                                  Guest
                                </Badge>
                              )}
                      </p>
                      {isOwner && (
                              <p 
                                className="text-sm"
                                style={{ color: event.host?.brand_tertiary_color + '70' || '#9ca3af' }}
                              >
                                {response.users?.email || response.guest_email || 'No email'}
                        </p>
                      )}
                            <p 
                              className="text-xs"
                              style={{ color: event.host?.brand_tertiary_color + '60' || '#6b7280' }}
                            >
                              {new Date(response.created_at).toLocaleDateString()} at {new Date(response.created_at).toLocaleTimeString()}
                            </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                          className="border"
                          style={getResponseBadgeStyle(response.response_type)}
                  >
                          <span className="flex items-center gap-1 font-medium">
                      {getResponseIcon(response.response_type)}
                            {response.response_type === 'yup' ? customYupText : 
                             response.response_type === 'nope' ? customNopeText : 
                             customMaybeText}
                    </span>
                  </Badge>
                </div>
                    ))
                  )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
      </div>
    </EventBrandingProvider>
  );
} 