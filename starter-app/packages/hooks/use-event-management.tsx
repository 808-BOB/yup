import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { eventService } from "@/services/eventService";
import { responseService } from "@/services/responseService";
import type { Event } from "@/types";

export function useEventManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: eventService.createEvent,
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success!",
        description: "Event created successfully.",
      });
      return newEvent;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
      console.error('Event creation error:', error);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: Partial<Event> }) =>
      eventService.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success!",
        description: "Event updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      console.error('Event update error:', error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: eventService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success!",
        description: "Event deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      console.error('Event deletion error:', error);
    },
  });

  const respondToEventMutation = useMutation({
    mutationFn: ({ eventId, response, guestCount }: { 
      eventId: number; 
      response: string; 
      guestCount?: number;
    }) => responseService.respondToEvent(eventId, response, guestCount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', variables.eventId, 'responses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', variables.eventId] });
      toast({
        title: "RSVP Updated!",
        description: "Your response has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
      console.error('RSVP error:', error);
    },
  });

  return {
    createEvent: createEventMutation,
    updateEvent: updateEventMutation,
    deleteEvent: deleteEventMutation,
    respondToEvent: respondToEventMutation,
  };
}

export function useEventQueries() {
  const useEventsList = () => useQuery({
    queryKey: ['/api/events'],
    queryFn: () => eventService.getEvents(),
  });

  const useMyEvents = () => useQuery({
    queryKey: ['/api/events/my-events'],
    queryFn: () => eventService.getMyEvents(),
  });

  const useEvent = (slug: string) => useQuery({
    queryKey: ['/api/events', slug],
    queryFn: () => eventService.getEventBySlug(slug),
    enabled: !!slug,
  });

  const useEventResponses = (eventId: number) => useQuery({
    queryKey: ['/api/events', eventId, 'responses'],
    queryFn: () => responseService.getEventResponses(eventId),
    enabled: !!eventId,
  });

  return {
    useEventsList,
    useMyEvents,
    useEvent,
    useEventResponses,
  };
}