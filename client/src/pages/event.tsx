import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Calendar, MapPin, User } from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfirmationMessage from "@/components/confirmation-message";
import { type Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EventPage() {
  const [, params] = useRoute("/events/:slug");
  const { toast } = useToast();
  const [userResponse, setUserResponse] = useState<"yup" | "nope" | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: !!params?.slug
  });
  
  const handleResponse = async (response: "yup" | "nope") => {
    if (!event) return;
    
    try {
      // In a real app, we'd get the userId from auth context
      const userId = 1;
      
      await apiRequest("POST", "/api/responses", {
        eventId: event.id,
        userId,
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
  
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Error loading event. The event may not exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  if (showConfirmation && userResponse) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <ConfirmationMessage response={userResponse} event={event} />
        </div>
      </div>
    );
  }
  
  const formattedTime = `${event.startTime.slice(0, 5)} - ${event.endTime.slice(0, 5)}`;
  
  return (
    <div className="max-w-md mx-auto px-4 py-6 h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full animate-fade-in">
          <Card className="mb-6 animate-slide-up">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{event.title}</h2>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs px-2 py-1 rounded-full">
                  {event.status}
                </span>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(event.date)}</p>
                    <p className="text-gray-500 dark:text-gray-400">{formattedTime}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {event.address && (
                      <p className="text-gray-500 dark:text-gray-400">{event.address}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Hosted by Demo User</p>
                  </div>
                </div>
                
                {event.description && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-gray-600 dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-auto pb-6">
            <p className="text-center mb-6 text-gray-500 dark:text-gray-400">Can you make it?</p>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => handleResponse("nope")}
                className="btn-nope bg-white dark:bg-gray-800 w-32 h-32 rounded-full shadow-md flex items-center justify-center border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
              >
                <span className="text-red-500 text-2xl font-bold">Nope</span>
              </Button>
              
              <Button
                onClick={() => handleResponse("yup")}
                className="btn-yup bg-white dark:bg-gray-800 w-32 h-32 rounded-full shadow-md flex items-center justify-center border border-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
              >
                <span className="text-primary text-2xl font-bold">Yup</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
