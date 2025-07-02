import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import Header from "@/components/header";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { eventService } from "@/services";
import { queryClient } from "@/lib/queryClient";

export default function CreateEventSimple() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      address: "",
      host_id: user?.id || "",
      status: "open",
      slug: "",
      allow_guest_rsvp: true,
      allow_plus_one: true,
      max_guests_per_rsvp: 1,
      use_custom_rsvp_text: false,
      rsvp_visibility: "public",
      waitlist_enabled: false,
    },
  });

  const onSubmit = async (data: InsertEvent) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate slug from title
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      const eventPayload = {
        ...data,
        host_id: user.id,
        slug,
        status: "open",
      };

      console.log("Submitting event:", eventPayload);

      await eventService.createEvent(eventPayload);
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      
      navigate("/my-events");
    } catch (error: any) {
      console.error("Error submitting event:", error);
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>
      
      <main className="flex-1 w-full animate-fade-in pb-32">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-events")}
            className="mb-4 p-0 h-auto font-normal text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel and go back
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Create Event</h1>
          <p className="text-slate-400">Fill in the details for your new event</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Event Title *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter event title"
                />
                {form.formState.errors.title && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Event description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-white">Location *</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Event location"
                />
                {form.formState.errors.location && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-white">Address</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Full address (optional)"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date" className="text-white">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register("date")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {form.formState.errors.date && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-white">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...form.register("start_time")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {form.formState.errors.start_time && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.start_time.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_time" className="text-white">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...form.register("end_time")}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {form.formState.errors.end_time && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow_guest_rsvp" className="text-white">Allow guest RSVPs</Label>
                <Switch
                  id="allow_guest_rsvp"
                  checked={form.watch("allow_guest_rsvp")}
                  onCheckedChange={(checked) => form.setValue("allow_guest_rsvp", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow_plus_one" className="text-white">Allow plus ones</Label>
                <Switch
                  id="allow_plus_one"
                  checked={form.watch("allow_plus_one")}
                  onCheckedChange={(checked) => form.setValue("allow_plus_one", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            style={{ backgroundColor: primaryColor || 'hsl(308, 100%, 66%)' }}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? "Creating Event..." : "Create Event"}
          </Button>
        </form>
      </main>
    </div>
  );
}