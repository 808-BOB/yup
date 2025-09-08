"use client";
// @ts-nocheck - Temporary disable for form library type conflicts
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/utils/auth-context";
import { useBranding } from "@/contexts/BrandingContext";
import { useToast } from "@/utils/use-toast";
import { getSupabaseClient } from "@/utils/supabase";
import Header from "@/dash/header";
import PageLayout from "@/ui/page-layout";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { DateTimeInput } from "@/ui/date-time-input";
import { InputWithIcon } from "@/ui/input-with-icon";
import { LocationAutocomplete } from "@/ui/location-autocomplete";
import { Textarea } from "@/ui/textarea";
import { TimezoneSelector } from "@/ui/timezone-selector";
import { MapPin, Home, Edit, ArrowLeft } from "lucide-react";
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
interface Event {
  id: number;
  image_url?: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address?: string;
  description?: string;
  host_id: string;
  status: string;
  created_at: Date;
  slug: string;
  allow_guest_rsvp: boolean;
  allow_plus_one: boolean;
  max_guests_per_rsvp: number;
  capacity?: number;
  use_custom_rsvp_text: boolean;
  custom_yup_text?: string;
  custom_nope_text?: string;
  custom_maybe_text?: string;
  rsvp_visibility: string;
  waitlist_enabled: boolean;
}
import { ImageUpload } from "@/ui/image-upload";
import { uploadEventImage } from "@/utils/image-upload";

// Utility function to convert 12-hour time to 24-hour format
const convertTo24Hour = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return timeStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Utility function to convert 24-hour time to 12-hour format
const convertTo12Hour = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
};

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
  const [imageSettings, setImageSettings] = useState({
    scale: 100,
    position: { x: 50, y: 50 },
    fit: 'contain' as 'contain' | 'cover'
  });
  
  // Use a ref to store the latest image settings to avoid stale closure issues
  const imageSettingsRef = useRef(imageSettings);
  imageSettingsRef.current = imageSettings;
  
  const [addressValue, setAddressValue] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);

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

      const supabase = getSupabaseClient();
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

        // Set image settings from database
        setImageSettings({
          scale: data.image_scale || 100,
          position: { 
            x: data.image_position_x || 50, 
            y: data.image_position_y || 50 
          },
          fit: data.image_fit || 'contain'
        });

        // Set address value for display
        setAddressValue(data.address || "");

        // Set timezone from database or default to local
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

        // Initialize image settings from existing data
        const loadedImageSettings = {
          scale: data.image_scale || 100,
          position: {
            x: data.image_position_x || 50,
            y: data.image_position_y || 50
          },
          fit: data.image_fit || 'contain'
        };
        setImageSettings(loadedImageSettings);

        // Populate form with existing data
        form.reset({
          title: data.title,
          date: data.date,
          start_time: convertTo12Hour(data.start_time),
          end_time: convertTo12Hour(data.end_time),
          location: data.location,
          address: data.address || "",
          description: data.description || "",
          image_url: data.image_url ? `${data.image_url}?t=${Date.now()}` : "",
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
  }, [slug, user, toast, router]);

  const onSubmit = useCallback(async (data: EditEventFormValues) => {
    if (!event || !user) return;

    setSubmitting(true);

    try {
      // Handle image upload if a new file was selected
      let imageUrl = data.image_url || "";
      if (selectedImageFile) {
        console.log("Uploading event image to storage...");
        console.log("Event ID:", event.id);
        console.log("Selected file:", selectedImageFile.name, selectedImageFile.size, selectedImageFile.type);
        
        const uploadResult = await uploadEventImage(event.id.toString(), selectedImageFile);
        console.log("Upload result:", uploadResult);

        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
          console.log("Image uploaded successfully, URL:", imageUrl);
        } else {
          console.error('Failed to upload event image:', uploadResult);
          toast({
            title: "Image Upload Failed",
            description: uploadResult.error || "Failed to upload event image.",
            variant: "destructive",
          });
          return; // Don't continue with event update if image upload fails
        }
      }

      const supabase = getSupabaseClient();
      
      const updateData: any = {
        title: data.title,
        date: data.date,
        start_time: convertTo24Hour(data.start_time),
        end_time: convertTo24Hour(data.end_time),
        location: data.location,
        address: data.address || null,
        description: data.description || null,
        image_url: imageUrl || null,
      };

      // Only include image settings if they have valid values
      const currentImageSettings = imageSettingsRef.current;
      
      if (currentImageSettings.scale !== undefined && currentImageSettings.scale !== null) {
        updateData.image_scale = Math.round(currentImageSettings.scale);
      }
      if (currentImageSettings.position.x !== undefined && currentImageSettings.position.x !== null) {
        updateData.image_position_x = Math.round(currentImageSettings.position.x * 100) / 100;
      }
      if (currentImageSettings.position.y !== undefined && currentImageSettings.position.y !== null) {
        updateData.image_position_y = Math.round(currentImageSettings.position.y * 100) / 100;
      }
      if (currentImageSettings.fit !== undefined && currentImageSettings.fit !== null) {
        updateData.image_fit = currentImageSettings.fit;
      }
      
      // Validate required fields
      if (!data.title || !data.date || !data.location) {
        throw new Error("Missing required fields: title, date, or location");
      }
      
      // Validate data types
      if (typeof event.id !== 'number') {
        throw new Error(`Invalid event ID type: ${typeof event.id}, value: ${event.id}`);
      }
      
      if (typeof user.id !== 'string') {
        throw new Error(`Invalid user ID type: ${typeof user.id}, value: ${user.id}`);
      }
      
      let result;
      try {
        result = await supabase
          .from('events')
          .update(updateData)
          .eq('id', event.id)
          .eq('host_id', user.id); // Security check
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }

      if (result.error) {
        
        // If the error is due to missing image columns, retry without them
        if (result.error.message?.includes('image_fit') || result.error.message?.includes('image_scale') || 
            result.error.message?.includes('image_position_x') || result.error.message?.includes('image_position_y')) {
          // Retrying update without image settings columns
          
          // Create a new updateData without image settings
          const basicUpdateData = {
            title: data.title,
            date: data.date,
            start_time: convertTo24Hour(data.start_time),
            end_time: convertTo24Hour(data.end_time),
            location: data.location,
            address: data.address || null,
            description: data.description || null,
            image_url: imageUrl || null,
          };
          
          const retryResult = await supabase
            .from('events')
            .update(basicUpdateData)
            .eq('id', event.id)
            .eq('host_id', user.id);
            
          if (retryResult.error) {
            console.error("Retry also failed:", retryResult.error);
            throw retryResult.error;
          }
          
          console.log("Update succeeded without image settings");
          result = retryResult;
        } else {
          throw result.error;
        }
      }

      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });

      // Stay on the edit page instead of redirecting
    } catch (error: any) {
      console.error('Error updating event:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      });
      
      let errorMessage = "Failed to update event. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [event, user, selectedImageFile, toast, setSubmitting]);

  // Auto-save when form values change
  useEffect(() => {
    if (!event || !user || loading) return;

    let timeoutId: NodeJS.Timeout;

    const subscription = form.watch((value, { name, type }) => {
      // Only auto-save if the form has been initialized and we have an event
      if (event && user && !submitting) {
        // Clear previous timeout
        clearTimeout(timeoutId);
        
        // Debounce the auto-save to avoid too many requests
        timeoutId = setTimeout(() => {
          onSubmit(value as EditEventFormValues);
        }, 1000); // 1 second delay
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [event, user, loading, submitting, form, onSubmit]);

  const handleArchiveEvent = async () => {
    if (!event || !user) return;

    setArchiving(true);

    try {
      const supabase = getSupabaseClient();
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
        className="w-full max-w-xl mx-auto px-6 pb-8 min-h-screen flex flex-col"
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
        className="w-full max-w-xl mx-auto px-6 pb-8 min-h-screen flex flex-col"
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
    <PageLayout 
      maxWidth="xl" 
      className="pb-8 min-h-screen flex flex-col"
      style={{ backgroundColor: branding.theme.secondary }}
    >

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm hover:bg-gray-700/50"
            style={{ color: getContrastingTextColor(branding.theme.secondary) }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1
            className="text-2xl font-bold"
            style={{ color: getContrastingTextColor(branding.theme.secondary) }}
          >
            Edit Event
          </h1>
        </div>

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
            {/* @ts-ignore - Form type compatibility issues */}
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
                          showPositioningControls={true}
                          showMiniSave={true}
                          onImageSettingsChange={(settings) => {
                            setImageSettings(settings);
                          }}
                          onSave={() => {
                            // Trigger form submission when mini save is clicked
                            form.handleSubmit(onSubmit)();
                          }}
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
                        <DateTimeInput
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
                          <DateTimeInput
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
                          <DateTimeInput
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

                {/* Timezone Selector */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: getContrastingTextColor(branding.theme.secondary) + 'CC' }}>
                        Timezone: {timezone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                      className="text-link-hover text-sm flex items-center gap-1"
                    >
                      {showTimezoneSelector ? 'Hide' : 'Change'} Timezone
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {showTimezoneSelector && (
                    <div className="mt-3">
                      <TimezoneSelector
                        value={timezone}
                        onChange={setTimezone}
                        className="w-full"
                      />
                    </div>
                  )}
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
                        <LocationAutocomplete
                          placeholder="Event location"
                          className="border-2"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          onLocationSelect={(location) => {
                            field.onChange(location.mainText || location.text);
                          }}
                          onAddressChange={(address) => {
                            setAddressValue(address);
                            form.setValue('address', address);
                            console.log('Address updated via location autocomplete:', address);
                          }}
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
                        <InputWithIcon
                          placeholder="Full address (auto-filled from location)"
                          className="border-2"
                          icon={<Home className="h-4 w-4 text-white" />}
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: branding.theme.primary + '60',
                            color: getContrastingTextColor(branding.theme.secondary)
                          }}
                          value={field.value || ""}
                          onChange={(e) => {
                            setAddressValue(e.target.value);
                            field.onChange(e.target.value);
                          }}
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
    </PageLayout>
  );
}
