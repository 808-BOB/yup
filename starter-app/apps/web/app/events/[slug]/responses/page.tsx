"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/utils/use-toast";
import { supabase } from "@/lib/supabase";
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
import { useRequireAuth } from "@/hooks/use-require-auth";
import { type Event, type Response } from "@/types";
import { Check, X, Clock, Users, ArrowLeft, Crown, TrendingUp, Calendar } from "lucide-react";

interface EventResponse {
  id: number;
  response_type: "yup" | "nope" | "maybe";
  created_at: string;
  user_id: string;
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

export default function EventResponsesPage() {
  useRequireAuth();
  
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>({ is_premium: false, is_pro: false });

  useEffect(() => {
    const fetchEventAndResponses = async () => {
      if (!user || !slug) return;

      try {
        // Fetch user plan information
        const { data: planData, error: planError } = await supabase
          .from('users')
          .select('is_premium, is_pro')
          .eq('id', user.id)
          .single();

        if (!planError && planData) {
          setUserPlan(planData);
        }

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .single();

        if (eventError) {
          throw new Error('Event not found');
        }

        setEvent(eventData);

        // Fetch responses for the event
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select(`
            id,
            response_type,
            created_at,
            user_id,
            users (
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (responsesError) {
          throw new Error('Failed to load responses');
        }

        // Remove duplicate responses (keep latest response per user)
        const uniqueResponses = responsesData?.reduce((acc, response) => {
          const existingResponse = acc.find(r => r.user_id === response.user_id);
          if (!existingResponse) {
            acc.push(response);
          }
          return acc;
        }, [] as any[]) || [];

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

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
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

  const getResponseIcon = (responseType: string) => {
    switch (responseType) {
      case 'yup':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'nope':
        return <X className="h-4 w-4 text-red-500" />;
      case 'maybe':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getResponseBadgeClass = (responseType: string) => {
    switch (responseType) {
      case 'yup':
        return "bg-green-900/20 border-green-800 text-green-500";
      case 'nope':
        return "bg-red-900/20 border-red-800 text-red-500";
      case 'maybe':
        return "bg-yellow-900/20 border-yellow-800 text-yellow-500";
      default:
        return "bg-gray-800 border-gray-700 text-gray-400";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-primary hover:text-primary hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-white">{event.title}</h1>
        <p className="text-gray-400 mb-6">Event Responses</p>

        {/* Response Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-900/20 border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{yupResponses.length}</p>
              <p className="text-sm text-green-400">Going</p>
            </CardContent>
          </Card>
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{nopeResponses.length}</p>
              <p className="text-sm text-red-400">Not Going</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/20 border-yellow-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{maybeResponses.length}</p>
              <p className="text-sm text-yellow-400">Maybe</p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics (only for host) */}
        {isOwner && hasAdvancedAnalytics && (
          <Card className="mb-6 bg-gray-900/95 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Response Rate</p>
                  <p className="text-2xl font-bold text-primary">{responseRate}%</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Responses</p>
                  <p className="text-2xl font-bold text-white">{totalResponses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response List */}
        <Card className="bg-gray-900/95 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {response.users?.profile_image_url ? (
                        <img
                          src={response.users.profile_image_url}
                          alt={response.users?.display_name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          {(response.users?.display_name || 'U').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {response.users?.display_name || 'Anonymous'}
                      </p>
                      {isOwner && (
                        <p className="text-sm text-gray-400">
                          {response.users?.email || 'No email'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getResponseBadgeClass(response.response_type)}
                  >
                    <span className="flex items-center gap-1">
                      {getResponseIcon(response.response_type)}
                      {response.response_type}
                    </span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 