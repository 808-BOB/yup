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
import { Check, X, Clock, Users, ArrowLeft } from "lucide-react";

interface EventResponse extends Response {
  users?: {
    display_name: string;
    email: string;
  };
}

export default function EventResponsesPage() {
  useRequireAuth();

  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch event and responses data
  useEffect(() => {
    const fetchEventAndResponses = async () => {
      if (!slug || !user) return;

      try {
        // First fetch the event to verify ownership
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('host_id', user.id) // Only allow viewing own event responses
          .single();

        if (eventError) {
          if (eventError.code === 'PGRST116') {
            toast({
              title: "Event Not Found",
              description: "This event doesn't exist or you don't have permission to view its responses.",
              variant: "destructive",
            });
            router.push('/my-events');
            return;
          }
          throw eventError;
        }

        setEvent(eventData);

        // Fetch responses for this event
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select(`
            *,
            users:user_id (
              display_name,
              email
            )
          `)
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: false });

        if (responsesError) throw responsesError;

        setResponses(responsesData || []);
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

  // Calculate response counts
  const yupResponses = responses.filter(r => r.response_type === 'yup');
  const nopeResponses = responses.filter(r => r.response_type === 'nope');
  const maybeResponses = responses.filter(r => r.response_type === 'maybe');

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

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/my-events')}
            className="text-primary hover:text-primary hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-gray-400 mb-6">Event Responses</p>

        {/* Response Summary */}
        <Card className="bg-gray-900 border border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Response Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{yupResponses.length}</div>
                <div className="text-sm text-gray-400">Going</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{nopeResponses.length}</div>
                <div className="text-sm text-gray-400">Not Going</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{maybeResponses.length}</div>
                <div className="text-sm text-gray-400">Maybe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses List */}
        <Card className="bg-gray-900 border border-gray-800">
          <CardHeader>
            <CardTitle>All Responses ({responses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No responses yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Responses will appear here as guests RSVP to your event.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response, index) => (
                  <div key={response.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                            {response.is_guest ? (
                              <span className="text-xs font-medium text-gray-400">G</span>
                            ) : (
                              <span className="text-xs font-medium text-primary">
                                {response.users?.display_name?.charAt(0) || response.users?.email?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {response.is_guest 
                                ? response.guest_name 
                                : response.users?.display_name || response.users?.email || 'Unknown User'
                              }
                            </p>
                            {response.is_guest && response.guest_email && (
                              <p className="text-sm text-gray-400">{response.guest_email}</p>
                            )}
                            {response.guest_count > 0 && (
                              <p className="text-xs text-gray-500">+{response.guest_count} guest{response.guest_count > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getResponseBadgeClass(response.response_type)}`}
                        >
                          {getResponseIcon(response.response_type)}
                          <span className="ml-1 capitalize">{response.response_type}</span>
                        </Badge>
                      </div>
                    </div>
                    {index < responses.length - 1 && <Separator className="mt-4 bg-gray-800" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 