"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/utils/auth-context";
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
// Note: useRequireAuth is no longer needed since middleware handles authentication
import { type Event } from "@/types";
import { ImageUpload } from "@/ui/image-upload";
import { uploadEventImage } from "@/utils/image-upload";

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
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  // Note: Auth is guaranteed by middleware, so we only check if user is loaded
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
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
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading event...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

        <Card className="bg-gray-900 border border-gray-800">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Event Image (Optional)</FormLabel>
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
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Event Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter event title"
                          className="bg-transparent border-gray-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-transparent border-gray-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="bg-transparent border-gray-700 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="bg-transparent border-gray-700 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Event location"
                          className="bg-transparent border-gray-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full address"
                          className="bg-transparent border-gray-700 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Event description"
                          className="bg-transparent border-gray-700 text-white resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/my-events')}
                    className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                  >
                    {submitting ? "Updating..." : "Update Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 