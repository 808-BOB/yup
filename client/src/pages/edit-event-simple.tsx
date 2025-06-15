import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import Header from "@/components/header";
import { insertEventSchema, type InsertEvent, type Event } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function EditEventSimple() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/events/:slug/edit");
  const { user } = useAuth();
  const { toast } = useToast();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get event data
  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${params?.slug}`],
    enabled: !!params?.slug,
  });

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

  // Update form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        address: event.address || "",
        host_id: event.host_id,
        status: event.status,
        slug: event.slug,
        allow_guest_rsvp: event.allow_guest_rsvp,
        allow_plus_one: event.allow_plus_one,
        max_guests_per_rsvp: event.max_guests_per_rsvp,
        capacity: event.capacity,
        use_custom_rsvp_text: event.use_custom_rsvp_text,
        custom_yup_text: event.custom_yup_text,
        custom_nope_text: event.custom_nope_text,
        custom_maybe_text: event.custom_maybe_text,
        rsvp_visibility: event.rsvp_visibility,
        waitlist_enabled: event.waitlist_enabled,
        image_url: event.image_url,
      });
      
      // Set existing image as preview
      if (event.image_url) {
        setImagePreview(event.image_url);
      }
    }
  }, [event, form]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Set image_url to null in form
    form.setValue('image_url', null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: InsertEvent) => {
    if (!user || !event) return;
    
    setIsSubmitting(true);
    
    try {
      // Handle image upload if a new image was selected
      if (imageFile) {
        const imageBase64 = await convertImageToBase64(imageFile);
        data.image_url = imageBase64;
      } else if (imagePreview === null) {
        // Image was removed
        data.image_url = null;
      }
      
      const updatedEvent = await apiRequest<any>("PUT", `/api/events/${event.id}`, data);
      
      toast({
        title: "Event Updated!",
        description: "Your event has been updated successfully.",
      });
      
      navigate(`/events/${event.slug}`);
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading event...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-xl font-bold mb-2">Event not found</h1>
            <p className="text-gray-400 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/my-events")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Events
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>
      
      <main className="flex-1 w-full animate-fade-in pb-32">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/events/${event.slug}`)}
            className="mb-4 p-0 h-auto font-normal text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to event
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Edit Event</h1>
          <p className="text-slate-400">Update your event details</p>
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

              {/* Image Upload Section */}
              <div>
                <Label className="text-white">Event Image</Label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-48 object-cover rounded-lg border border-slate-600"
                      />
                      <Button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 h-8 w-8"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 transition-colors"
                    >
                      <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 mb-1">Click to upload an image</p>
                      <p className="text-slate-500 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {imagePreview && (
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  )}
                </div>
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
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Updating Event..." : "Update Event"}
          </Button>
        </form>
      </main>
    </div>
  );
}