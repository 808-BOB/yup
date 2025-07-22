"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { useToast } from "@/utils/use-toast";
import { supabase } from "@/lib/supabase";
import Header from "@/dash/header";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import Archive from "lucide-react/dist/esm/icons/archive";
// Note: useRequireAuth is no longer needed since middleware handles authentication
import { type Event } from "@/types";
import { ImageUpload } from "@/ui/image-upload";
import { uploadEventImage } from "@/utils/image-upload";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

// Form validation schema
const editEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type EditEventFormValues = z.infer<typeof editEventSchema>;

export default function EditEventPage() {
  // Note: Auth is guaranteed by middleware

  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const branding = useBranding();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      address: "",
      description: "",
      image_url: "",
    },
  });

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug || !user) return;

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('host_id', user.id) // Only allow editing own events
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast({
              title: "Event Not Found",
              description: "This event doesn't exist or you don't have permission to edit it.",
              variant: "destructive",
            });
            router.push('/my-events');
            return;
          }
          throw error;
        }

        setEvent(data);

        // Populate form with existing data
        form.reset({
          title: data.title,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          address: data.address || "",
          description: data.description || "",
          image_url: data.image_url || "",
        });
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Failed to load event data.",
          variant: "destructive",
        });
        router.push('/my-events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug, user, form, toast, router]);

  const onSubmit = async (data: EditEventFormValues) => {
    if (!event || !user) return;

    setSubmitting(true);

    try {
      // Handle image upload if a new file was selected
      let imageUrl = data.image_url || "";
      if (selectedImageFile) {
        console.log("Uploading event image to storage...");
        const uploadResult = await uploadEventImage(event.id.toString(), selectedImageFile);

        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          console.error('Failed to upload event image:', uploadResult.error);
          toast({
            title: "Image Upload Failed",
            description: uploadResult.error || "Failed to upload event image.",
            variant: "destructive",
          });
          return; // Don't continue with event update if image upload fails
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: data.title,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          address: data.address || null,
          description: data.description || null,
          image_url: imageUrl || null,
        })
        .eq('id', event.id)
        .eq('host_id', user.id); // Security check

      if (error) throw error;

      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });

      router.push('/my-events');
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveEvent = async () => {
    if (!event || !user) return;

    setArchiving(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'archived'
        })
        .eq('id', event.id)
        .eq('host_id', user.id); // Security check

      if (error) throw error;

      toast({
        title: "Event Archived",
        description: "Your event has been archived successfully.",
      });

      router.push('/my-events');
    } catch (error: any) {
      console.error('Error archiving event:', error);
      toast({
        title: "Archive Failed",
        description: error.message || "Failed to archive event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };

  // Note: Auth is guaranteed by middleware, so we only check if user is loaded
  if (!user) {
    return (
      <div
        className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col"
        style={{ backgroundColor: branding.theme.secondary }}
      >
        <div
          className="sticky top-0 z-50 pt-8"
          style={{ backgroundColor: branding.theme.secondary }}
        >
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <p style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}>
            Loading user data...
          </p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col"
        style={{ backgroundColor: branding.theme.secondary }}
      >
        <div
          className="sticky top-0 z-50 pt-8"
          style={{ backgroundColor: branding.theme.secondary }}
        >
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <p style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}>
            Loading event...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col"
      style={{ backgroundColor: branding.theme.secondary }}
    >
      <div
        className="sticky top-0 z-50 pt-8"
        style={{ backgroundColor: branding.theme.secondary }}
      >
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: getContrastingTextColor(branding.theme.secondary) }}
        >
          Edit Event
        </h1>

        <Card
          className="border shadow-lg"
          style={{
            backgroundColor: branding.theme.secondary + 'F2', // 95% opacity
            borderColor: branding.theme.primary + '33' // 20% opacity
          }}
        >
          <CardHeader>
            <CardTitle
              style={{ color: getContrastingTextColor(branding.theme.secondary) }}
            >
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                      >
                        Event Image (Optional)
                      </FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={(file) => {
                            setSelectedImageFile(file);
                            if (file) {
                              // Create a temporary preview URL for the form
                              const url = URL.createObjectURL(file);
                              field.onChange(url);
                            } else {
                              field.onChange("");
                            }
                          }}
                          placeholder="Upload an event image"
                          aspectRatio="rectangle"
                          maxSize={10}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }} // Red for error messages
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }} // 80% opacity
                      >
                        Event Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter event title"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60', // 40% opacity
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                      >
                        Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }}
                      />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                        >
                          Start Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="border-2"
                            style={{
                              backgroundColor: 'transparent',
                              borderColor: branding.theme.primary + '60',
                              color: getContrastingTextColor(branding.theme.secondary)
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage
                          style={{ color: '#ef4444' }}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                        >
                          End Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="border-2"
                            style={{
                              backgroundColor: 'transparent',
                              borderColor: branding.theme.primary + '60',
                              color: getContrastingTextColor(branding.theme.secondary)
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage
                          style={{ color: '#ef4444' }}
                        />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                      >
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Event location"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                      >
                        Address (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full address"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                      >
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Event description"
                          className="border-2 resize-none"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage
                        style={{ color: '#ef4444' }}
                      />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/my-events')}
                    className="flex-1 border-2"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: branding.theme.primary + '60',
                      color: getContrastingTextColor(branding.theme.secondary)
                    }}
                    disabled={submitting || archiving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || archiving}
                    className="flex-1"
                    style={{
                      backgroundColor: branding.theme.primary,
                      color: getContrastingTextColor(branding.theme.primary),
                      borderColor: branding.theme.primary
                    }}
                  >
                    {submitting ? "Updating..." : "Update Event"}
                  </Button>
                </div>

                {/* Archive Event Section */}
                <div className="pt-6 border-t" style={{ borderColor: branding.theme.primary + '33' }}>
                  <div className="mb-4">
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: getContrastingTextColor(branding.theme.secondary) }}
                    >
                      Archive Event
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                    >
                      Archiving will hide this event from your active events list. You can view archived events in your archives.
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-2"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#ef4444',
                          color: '#ef4444'
                        }}
                        disabled={submitting || archiving}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="border-2"
                      style={{
                        backgroundColor: branding.theme.secondary,
                        borderColor: branding.theme.primary + '60'
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle
                          style={{ color: getContrastingTextColor(branding.theme.secondary) }}
                        >
                          Archive Event
                        </DialogTitle>
                        <DialogDescription
                          style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}
                        >
                          Are you sure you want to archive "{event?.title}"? This will move it to your archives and it won't appear in your active events list.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleArchiveEvent}
                          disabled={archiving}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            borderColor: '#ef4444'
                          }}
                        >
                          {archiving ? "Archiving..." : "Archive Event"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
