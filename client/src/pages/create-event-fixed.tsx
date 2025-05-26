import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Upload, X, Image } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  allowGuestRsvp: z.boolean().default(true),
  allowPlusOne: z.boolean().default(true),
  maxGuestsPerRsvp: z.number().min(1).max(10).default(3),
  showRsvpsToInvitees: z.boolean().default(true),
  showRsvpsAfterThreshold: z.boolean().default(false),
  rsvpVisibilityThreshold: z.number().min(1).default(5),
  customYesText: z.string().optional(),
  customNoText: z.string().optional(),
  useCustomRsvpText: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEventFixed() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isEditMode = !!params?.slug;
  
  // Get event data for editing
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: isEditMode,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "",
      description: "",
      imageUrl: "",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 3,
      showRsvpsToInvitees: true,
      showRsvpsAfterThreshold: false,
      rsvpVisibilityThreshold: 5,
      customYesText: "",
      customNoText: "",
      useCustomRsvpText: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (eventData && isEditMode) {
      form.reset({
        title: eventData.title || "",
        date: eventData.date || "",
        startTime: eventData.startTime || "",
        endTime: eventData.endTime || "",
        location: eventData.location || "",
        address: eventData.address || "",
        description: eventData.description || "",
        imageUrl: eventData.imageUrl || "",
        allowGuestRsvp: eventData.allowGuestRsvp ?? true,
        allowPlusOne: eventData.allowPlusOne ?? true,
        maxGuestsPerRsvp: eventData.maxGuestsPerRsvp ?? 3,
        showRsvpsToInvitees: eventData.showRsvpsToInvitees ?? true,
        showRsvpsAfterThreshold: eventData.showRsvpsAfterThreshold ?? false,
        rsvpVisibilityThreshold: eventData.rsvpVisibilityThreshold ?? 5,
        customYesText: eventData.customYesText || "",
        customNoText: eventData.customNoText || "",
        useCustomRsvpText: eventData.useCustomRsvpText ?? false,
      });
      
      if (eventData.imageUrl) {
        setUploadedImage(eventData.imageUrl);
      }
    }
  }, [eventData, isEditMode, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        form.setValue('imageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    form.setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate slug for new events
      const slug = isEditMode 
        ? eventData.slug 
        : `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      const eventPayload = {
        ...data,
        hostId: user.id,
        slug,
        status: "active",
      };

      if (isEditMode && eventData) {
        // Update existing event
        const response = await fetch(`/api/events/${eventData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update event: ${errorText}`);
        }
        
        const updatedEvent = await response.json();
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        queryClient.invalidateQueries({ queryKey: [`/api/events/${eventData.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/events/slug/${slug}`] });
        
        toast({
          title: "Event updated!",
          description: "Your event has been successfully updated.",
        });
        
        // Navigate to dashboard
        navigate("/my-events");
        
      } else {
        // Create new event
        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create event: ${errorText}`);
        }
        
        const newEvent = await response.json();
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        
        toast({
          title: "Event created!",
          description: "Your event has been successfully created.",
        });
        
        // Navigate to dashboard
        navigate("/my-events");
      }
      
    } catch (error) {
      console.error("Error submitting event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingEvent) {
    return (
      <div className="min-h-screen bg-slate-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-800 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-slate-800 rounded"></div>
                <div className="h-12 bg-slate-800 rounded"></div>
                <div className="h-12 bg-slate-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isEditMode ? "Edit Event" : "Create Event"}
            </h1>
            <p className="text-slate-400">
              Step {currentStep} of 3
            </p>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {currentStep === 1 && "Event Details"}
                  {currentStep === 2 && "Event Settings"}
                  {currentStep === 3 && "Review & Publish"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <>
                    {/* Event Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-white">Event Image (Optional)</Label>
                      
                      {uploadedImage ? (
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="Event preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-amber-600 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Image className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-400 mb-2">Click to upload an image</p>
                          <p className="text-sm text-slate-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Event Title</Label>
                      <Input
                        id="title"
                        {...form.register("title")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter event title"
                      />
                      {form.formState.errors.title && (
                        <p className="text-red-400 text-sm">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-white">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      {form.formState.errors.date && (
                        <p className="text-red-400 text-sm">{form.formState.errors.date.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime" className="text-white">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          {...form.register("startTime")}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        {form.formState.errors.startTime && (
                          <p className="text-red-400 text-sm">{form.formState.errors.startTime.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime" className="text-white">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          {...form.register("endTime")}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        {form.formState.errors.endTime && (
                          <p className="text-red-400 text-sm">{form.formState.errors.endTime.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        {...form.register("location")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter event location"
                      />
                      {form.formState.errors.location && (
                        <p className="text-red-400 text-sm">{form.formState.errors.location.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-white">Address (Optional)</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        {...form.register("description")}
                        className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                        placeholder="Describe your event..."
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Settings */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">RSVP Settings</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowGuestRsvp"
                          checked={form.watch("allowGuestRsvp")}
                          onCheckedChange={(checked) => form.setValue("allowGuestRsvp", !!checked)}
                        />
                        <Label htmlFor="allowGuestRsvp" className="text-white">
                          Allow guest RSVPs
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowPlusOne"
                          checked={form.watch("allowPlusOne")}
                          onCheckedChange={(checked) => form.setValue("allowPlusOne", !!checked)}
                        />
                        <Label htmlFor="allowPlusOne" className="text-white">
                          Allow plus-ones
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxGuestsPerRsvp" className="text-white">
                          Max guests per RSVP
                        </Label>
                        <Select
                          value={form.watch("maxGuestsPerRsvp")?.toString()}
                          onValueChange={(value) => form.setValue("maxGuestsPerRsvp", parseInt(value))}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Visibility Settings</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showRsvpsToInvitees"
                          checked={form.watch("showRsvpsToInvitees")}
                          onCheckedChange={(checked) => form.setValue("showRsvpsToInvitees", !!checked)}
                        />
                        <Label htmlFor="showRsvpsToInvitees" className="text-white">
                          Show RSVPs to invitees
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Review Your Event</h3>
                    
                    <div className="bg-slate-700 rounded-lg p-6 space-y-4">
                      {uploadedImage && (
                        <img 
                          src={uploadedImage} 
                          alt="Event preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-white text-xl">{form.watch("title")}</h4>
                        <p className="text-slate-300">
                          {new Date(form.watch("date")).toLocaleDateString()} • {form.watch("startTime")} - {form.watch("endTime")}
                        </p>
                        <p className="text-slate-300">{form.watch("location")}</p>
                        {form.watch("description") && (
                          <p className="text-slate-400 mt-2">{form.watch("description")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isSubmitting ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Cancel link */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-events")}
              className="text-slate-400 hover:text-white"
            >
              Cancel and go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}