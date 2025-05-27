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
import { ArrowLeft, Save, Eye } from "lucide-react";
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
  allowGuestRsvp: z.boolean().default(true),
  allowPlusOne: z.boolean().default(true),
  maxGuestsPerRsvp: z.number().min(1).max(10).default(3),
  maxAttendees: z.number().optional(),
  showRsvpsToInvitees: z.boolean().default(true),
  showRsvpsAfterThreshold: z.boolean().default(false),
  rsvpVisibilityThreshold: z.number().min(1).default(5),
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
  
  console.log('Edit page - slug from params:', slug);
  console.log('Edit page - full params:', params);

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
      maxGuestsPerRsvp: event.maxGuestsPerRsvp,
      maxAttendees: event.maxAttendees || undefined,
      showRsvpsToInvitees: event.showRsvpsToInvitees,
      showRsvpsAfterThreshold: event.showRsvpsAfterThreshold,
      rsvpVisibilityThreshold: event.rsvpVisibilityThreshold,
      customYesText: event.customYesText || "",
      customNoText: event.customNoText || "",
    } : undefined,
  });

  // Reset form when event data loads - use useEffect to prevent infinite re-renders
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
        maxGuestsPerRsvp: event.maxGuestsPerRsvp,
        maxAttendees: event.maxAttendees || undefined,
        showRsvpsToInvitees: event.showRsvpsToInvitees,
        showRsvpsAfterThreshold: event.showRsvpsAfterThreshold,
        rsvpVisibilityThreshold: event.rsvpVisibilityThreshold,
        customYesText: event.customYesText || "",
        customNoText: event.customNoText || "",
      });
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const eventDate = new Date(data.dateTime);
      const endDate = data.endDateTime ? new Date(data.endDateTime) : null;
      
      const updateData = {
        title: data.title,
        description: data.description || null,
        location: data.location,
        date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD format
        startTime: eventDate.toTimeString().slice(0, 5), // HH:MM format
        endTime: endDate ? endDate.toTimeString().slice(0, 5) : null,
        imageUrl: data.imageUrl || null,
        allowGuestRsvp: data.allowGuestRsvp,
        allowPlusOne: data.allowPlusOne,
        maxGuestsPerRsvp: data.maxGuestsPerRsvp && data.maxGuestsPerRsvp !== "" ? Number(data.maxGuestsPerRsvp) : 1,
        maxAttendees: data.maxAttendees && data.maxAttendees !== "" ? Number(data.maxAttendees) : null,
        showRsvpsToInvitees: data.showRsvpsToInvitees,
        showRsvpsAfterThreshold: data.showRsvpsAfterThreshold,
        rsvpVisibilityThreshold: data.rsvpVisibilityThreshold && data.rsvpVisibilityThreshold !== "" ? Number(data.rsvpVisibilityThreshold) : 0,
        customYesText: data.customYesText || null,
        customNoText: data.customNoText || null,
      };

      console.log('Updating event with data:', updateData);
      
      const response = await fetch(`/api/events/${event?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error(`Failed to update event: ${response.status}`);
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
    // Directly save without preview
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

        {isPreviewMode ? (
          <Card className="bg-slate-800 border-slate-700 text-white max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Title</Label>
                <p className="text-white font-medium">{form.watch("title")}</p>
              </div>
              
              <div>
                <Label className="text-slate-300">Location</Label>
                <p className="text-white">{form.watch("location")}</p>
              </div>
              
              <div>
                <Label className="text-slate-300">Date & Time</Label>
                <p className="text-white">
                  {new Date(form.watch("dateTime")).toLocaleString()}
                </p>
              </div>
              
              {form.watch("description") && (
                <div>
                  <Label className="text-slate-300">Description</Label>
                  <p className="text-white">{form.watch("description")}</p>
                </div>
              )}

              {form.watch("maxAttendees") && (
                <div>
                  <Label className="text-slate-300">Event Capacity</Label>
                  <p className="text-white">{form.watch("maxAttendees")} attendees</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsPreviewMode(false)}
                  variant="outline"
                  className="bg-gray-900 border-gray-800 hover:border-gray-700"
                >
                  Edit More
                </Button>
                <Button
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={updateEventMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl" className="text-white">Event Image</Label>
                  {form.watch("imageUrl") && (
                    <div className="mb-3">
                      <img 
                        src={form.watch("imageUrl")} 
                        alt="Current event image" 
                        className="w-full h-32 object-cover rounded border border-slate-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="relative">
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64String = event.target?.result as string;
                            form.setValue("imageUrl", base64String);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="bg-primary text-white px-4 py-2 rounded text-center cursor-pointer hover:bg-primary/90">
                      Choose Image
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    Upload a new image from your device (JPG, PNG, etc.)
                  </p>
                </div>

                <div>
                  <Label htmlFor="title" className="text-white">Event Title</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter event title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    {...form.register("location")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter event location"
                  />
                  {form.formState.errors.location && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.location.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dateTime" className="text-white">Date & Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    {...form.register("dateTime")}
                    className="bg-slate-700 border-slate-600 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:sepia [&::-webkit-calendar-picker-indicator]:hue-rotate-45"
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



                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Describe your event..."
                    rows={4}
                  />
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
                    onCheckedChange={(checked) => form.setValue("allowGuestRsvp", !!checked)}
                  />
                  <Label htmlFor="allowGuestRsvp" className="text-white">
                    Allow guest RSVPs (without account)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowPlusOne"
                    checked={form.watch("allowPlusOne")}
                    onCheckedChange={(checked) => form.setValue("allowPlusOne", !!checked)}
                  />
                  <Label htmlFor="allowPlusOne" className="text-white">
                    Allow plus ones
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGuestsPerRsvp" className="text-white">Max guests per RSVP</Label>
                  <Select
                    value={form.watch("maxGuestsPerRsvp")?.toString() || "3"}
                    onValueChange={(value) => form.setValue("maxGuestsPerRsvp", parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttendees" className="text-white">Event capacity (optional)</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min="1"
                    max="1000"
                    {...form.register("maxAttendees", { valueAsNumber: true })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-slate-400 text-xs">
                    When capacity is reached, new responses will join a waitlist
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showRsvpsToInvitees"
                    checked={form.watch("showRsvpsToInvitees")}
                    onCheckedChange={(checked) => form.setValue("showRsvpsToInvitees", checked)}
                  />
                  <Label htmlFor="showRsvpsToInvitees" className="text-white">
                    Show RSVPs to invitees
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showRsvpsAfterThreshold"
                    checked={form.watch("showRsvpsAfterThreshold")}
                    onCheckedChange={(checked) => form.setValue("showRsvpsAfterThreshold", checked)}
                  />
                  <Label htmlFor="showRsvpsAfterThreshold" className="text-white">
                    Only show RSVPs after threshold
                  </Label>
                </div>

                {form.watch("showRsvpsAfterThreshold") && (
                  <div className="space-y-2">
                    <Label className="text-white">
                      RSVP visibility threshold: {form.watch("rsvpVisibilityThreshold")} attendees
                    </Label>
                    <Slider
                      value={[form.watch("rsvpVisibilityThreshold")]}
                      onValueChange={(value) => form.setValue("rsvpVisibilityThreshold", value[0])}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
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
        )}
      </div>
    </div>
  );
}