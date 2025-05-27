import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  dateTime: z.string().min(1, "Date and time is required"),
  endDateTime: z.string().optional(),
  imageUrl: z.string().optional(),
  allowGuestRsvp: z.boolean().default(false),
  allowPlusOne: z.boolean().default(false),
  maxGuestsPerRsvp: z.string().optional(),
  maxAttendees: z.string().optional(),
  showRsvpsToInvitees: z.boolean().default(true),
  showRsvpsAfterThreshold: z.boolean().default(false),
  rsvpVisibilityThreshold: z.string().optional(),
  customYesText: z.string().optional(),
  customNoText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get event slug from URL params
  const params = useParams();
  const slug = params.slug;

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/slug/${slug}`],
    enabled: !!slug,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event ? {
      title: event.title,
      description: event.description || "",
      location: event.location,
      dateTime: `${event.date}T${event.startTime}`,
      endDateTime: event.endTime ? `${event.date}T${event.endTime}` : "",
      imageUrl: event.imageUrl || "",
      allowGuestRsvp: event.allowGuestRsvp,
      allowPlusOne: event.allowPlusOne,
      maxGuestsPerRsvp: event.maxGuestsPerRsvp?.toString() || "",
      maxAttendees: event.maxAttendees?.toString() || "",
      showRsvpsToInvitees: event.showRsvpsToInvitees,
      showRsvpsAfterThreshold: event.showRsvpsAfterThreshold,
      rsvpVisibilityThreshold: event.rsvpVisibilityThreshold?.toString() || "",
      customYesText: event.customYesText || "",
      customNoText: event.customNoText || "",
    } : undefined,
  });

  // Reset form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        location: event.location,
        dateTime: `${event.date}T${event.startTime}`,
        endDateTime: event.endTime ? `${event.date}T${event.endTime}` : "",
        imageUrl: event.imageUrl || "",
        allowGuestRsvp: event.allowGuestRsvp,
        allowPlusOne: event.allowPlusOne,
        maxGuestsPerRsvp: event.maxGuestsPerRsvp?.toString() || "",
        maxAttendees: event.maxAttendees?.toString() || "",
        showRsvpsToInvitees: event.showRsvpsToInvitees,
        showRsvpsAfterThreshold: event.showRsvpsAfterThreshold,
        rsvpVisibilityThreshold: event.rsvpVisibilityThreshold?.toString() || "",
        customYesText: event.customYesText || "",
        customNoText: event.customNoText || "",
      });
    }
  }, [event, form]);

  const parseNumericField = (value: string | undefined, defaultValue: number | null = null): number | null => {
    if (!value || value === "" || value === "undefined" || value === "null") {
      return defaultValue;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const updateEventMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const [date, time] = data.dateTime.split('T');
      const eventDate = new Date(data.dateTime);
      
      let endDate = null;
      if (data.endDateTime) {
        endDate = new Date(data.endDateTime);
      }

      const updateData = {
        title: data.title,
        description: data.description || null,
        location: data.location,
        date: eventDate.toISOString().split('T')[0],
        startTime: eventDate.toTimeString().slice(0, 5),
        endTime: endDate ? endDate.toTimeString().slice(0, 5) : null,
        imageUrl: data.imageUrl || null,
        allowGuestRsvp: data.allowGuestRsvp,
        allowPlusOne: data.allowPlusOne,
        maxGuestsPerRsvp: parseNumericField(data.maxGuestsPerRsvp, 1),
        maxAttendees: parseNumericField(data.maxAttendees, null),
        showRsvpsToInvitees: data.showRsvpsToInvitees,
        showRsvpsAfterThreshold: data.showRsvpsAfterThreshold,
        rsvpVisibilityThreshold: parseNumericField(data.rsvpVisibilityThreshold, 0),
        customYesText: data.customYesText || null,
        customNoText: data.customNoText || null,
      };

      const response = await fetch(`/api/events/${event?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update event");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/slug', slug] });
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      setLocation(`/my-events`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation(`/events/${slug}`)}
            className="bg-gray-900 border-gray-800 hover:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          
          <h1 className="text-2xl font-bold text-white">
            Edit Event
          </h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageUrl" className="text-white">Event Image</Label>
                <div className="space-y-3">
                  {form.watch("imageUrl") && (
                    <div className="relative">
                      <img
                        src={form.watch("imageUrl")}
                        alt="Event preview"
                        className="w-full h-48 object-cover rounded border"
                        onError={(e) => {
                          console.error("Image failed to load");
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="Image URL or paste image data"
                      {...form.register("imageUrl")}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-primary hover:bg-primary/90 text-white border-primary"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              form.setValue("imageUrl", result);
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      Choose Image
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-white">Event Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {form.formState.errors.title && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-white">Location</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {form.formState.errors.location && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateTime" className="text-white">Start Date & Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    {...form.register("dateTime")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {form.formState.errors.dateTime && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.dateTime.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDateTime" className="text-white">End Date & Time (Optional)</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    {...form.register("endDateTime")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">RSVP Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowGuestRsvp"
                  checked={form.watch("allowGuestRsvp")}
                  onCheckedChange={(checked) => form.setValue("allowGuestRsvp", checked as boolean)}
                  className="border-slate-600"
                />
                <Label htmlFor="allowGuestRsvp" className="text-white">Allow guest RSVPs</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowPlusOne"
                  checked={form.watch("allowPlusOne")}
                  onCheckedChange={(checked) => form.setValue("allowPlusOne", checked as boolean)}
                  className="border-slate-600"
                />
                <Label htmlFor="allowPlusOne" className="text-white">Allow plus-ones</Label>
              </div>

              {form.watch("allowPlusOne") && (
                <div>
                  <Label htmlFor="maxGuestsPerRsvp" className="text-white">Max guests per RSVP</Label>
                  <Input
                    id="maxGuestsPerRsvp"
                    type="number"
                    min="1"
                    max="10"
                    {...form.register("maxGuestsPerRsvp")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="maxAttendees" className="text-white">Event capacity (optional)</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  {...form.register("maxAttendees")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-slate-400 text-sm mt-1">
                  When capacity is reached, new responses will join a waitlist
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showRsvpsToInvitees"
                  checked={form.watch("showRsvpsToInvitees")}
                  onCheckedChange={(checked) => form.setValue("showRsvpsToInvitees", checked)}
                />
                <Label htmlFor="showRsvpsToInvitees" className="text-white">Show RSVPs to invitees</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showRsvpsAfterThreshold"
                  checked={form.watch("showRsvpsAfterThreshold")}
                  onCheckedChange={(checked) => form.setValue("showRsvpsAfterThreshold", checked)}
                />
                <Label htmlFor="showRsvpsAfterThreshold" className="text-white">Only show RSVPs after threshold</Label>
              </div>

              {form.watch("showRsvpsAfterThreshold") && (
                <div>
                  <Label className="text-white">RSVP visibility threshold: {form.watch("rsvpVisibilityThreshold") || 0} attendees</Label>
                  <Slider
                    value={[parseInt(form.watch("rsvpVisibilityThreshold") || "0")]}
                    onValueChange={(value) => form.setValue("rsvpVisibilityThreshold", value[0].toString())}
                    max={50}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/events/${slug}`)}
              className="bg-gray-900 border-gray-800 hover:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEventMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateEventMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}