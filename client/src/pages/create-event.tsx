import { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import Header from "@/components/header";

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
  maxAttendees: z.number().optional(),
  showRsvpsToInvitees: z.boolean().default(true),

  showRsvpsAfterThreshold: z.boolean().default(false),
  rsvpVisibilityThreshold: z.number().min(1).default(5),
  customYesText: z.string().optional(),
  customNoText: z.string().optional(),
  useCustomRsvpText: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        form.setValue("imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Populate form when editing
  useEffect(() => {
    if (eventData && isEditMode) {
      form.reset({
        title: (eventData as any).title || "",
        date: (eventData as any).date || "",
        startTime: (eventData as any).startTime || "",
        endTime: (eventData as any).endTime || "",
        location: (eventData as any).location || "",
        address: (eventData as any).address || "",
        description: (eventData as any).description || "",
        imageUrl: (eventData as any).imageUrl || "",
        allowGuestRsvp: (eventData as any).allowGuestRsvp ?? true,
        allowPlusOne: (eventData as any).allowPlusOne ?? true,
        maxGuestsPerRsvp: (eventData as any).maxGuestsPerRsvp ?? 3,
        showRsvpsToInvitees: (eventData as any).showRsvpsToInvitees ?? true,
        showRsvpsAfterThreshold: (eventData as any).showRsvpsAfterThreshold ?? false,
        rsvpVisibilityThreshold: (eventData as any).rsvpVisibilityThreshold ?? 5,
        customYesText: (eventData as any).customYesText || "",
        customNoText: (eventData as any).customNoText || "",
        useCustomRsvpText: (eventData as any).useCustomRsvpText ?? false,
      });
    }
  }, [eventData, isEditMode, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate slug for new events
      const slug = isEditMode 
        ? (eventData as any).slug 
        : `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      const eventPayload = {
        ...data,
        hostId: user.id,
        slug,
        status: "active",
      };

      if (isEditMode && eventData) {
        // Update existing event
        const response = await fetch(`/api/events/${(eventData as any).id}`, {
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
        queryClient.invalidateQueries({ queryKey: [`/api/events/${(eventData as any).id}`] });
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
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 w-full animate-fade-in pb-32">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-800 rounded"></div>
              <div className="h-12 bg-slate-800 rounded"></div>
              <div className="h-12 bg-slate-800 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate required fields for step 1
      const title = form.getValues("title");
      const date = form.getValues("date");
      const startTime = form.getValues("startTime");
      const endTime = form.getValues("endTime");
      const location = form.getValues("location");
      
      if (!title || !date || !startTime || !endTime || !location) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields before continuing.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>
      
      <main className="flex-1 w-full animate-fade-in pb-32">
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
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(currentStep / 3) * 100}%`,
                backgroundColor: primaryColor || 'hsl(308, 100%, 66%)'
              }}
            />
          </div>
        </div>

        <Card className="w-full bg-gray-900 border border-gray-800">
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
                    <div className="space-y-2">
                      <Label htmlFor="eventImage" className="text-white">Event Image (Optional)</Label>
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-md bg-slate-700">
                        {form.watch("imageUrl") ? (
                          <div className="mb-4">
                            <img
                              src={form.watch("imageUrl")}
                              alt="Event Preview"
                              className="max-h-32 object-contain rounded"
                            />
                          </div>
                        ) : (
                          <div className="mb-4 text-center text-slate-400">
                            <Upload className="mx-auto h-12 w-12 text-slate-500" />
                            <p className="mt-2">Upload event photo</p>
                          </div>
                        )}
                        
                        <Label
                          htmlFor="eventImage"
                          className="relative cursor-pointer font-medium rounded-md py-2 px-4"
                          style={{
                            backgroundColor: primaryColor || 'hsl(308, 100%, 66%)',
                            color: accessibleTextColor,
                            borderColor: primaryColor || 'hsl(308, 100%, 66%)'
                          }}
                        >
                          Choose Photo
                          <Input
                            id="eventImage"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                          />
                        </Label>
                        
                        {form.watch("imageUrl") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => form.setValue("imageUrl", "")}
                          >
                            Remove Image
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-400">
                        <p>Recommended specifications:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>File formats: PNG, JPEG, JPG, or GIF</li>
                          <li>Maximum file size: 5MB</li>
                          <li>Aspect ratio: 16:9 recommended</li>
                        </ul>
                      </div>
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
                      
                      <div className="space-y-3">
                        <p className="text-gray-300 text-sm">Control what your invitees can see:</p>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="showRsvpsToInvitees"
                            checked={form.watch("showRsvpsToInvitees")}
                            onCheckedChange={(checked) => form.setValue("showRsvpsToInvitees", !!checked)}
                          />
                          <Label htmlFor="showRsvpsToInvitees" className="text-white">
                            Show RSVP "Yup" responses to invitees?
                          </Label>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="showRsvpsAfterThreshold"
                              checked={form.watch("showRsvpsAfterThreshold")}
                              onCheckedChange={(checked) => form.setValue("showRsvpsAfterThreshold", !!checked)}
                            />
                            <Label htmlFor="showRsvpsAfterThreshold" className="text-white">
                              Set a minimum positive RSVPs to show the guest list to invitees
                            </Label>
                          </div>
                          
                          {form.watch("showRsvpsAfterThreshold") && (
                            <div className="ml-6 space-y-2">
                              <Label className="text-white text-sm">
                                Minimum "Yup" responses needed: {form.watch("rsvpVisibilityThreshold") || 5}
                              </Label>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                value={form.watch("rsvpVisibilityThreshold") || 5}
                                onChange={(e) => form.setValue("rsvpVisibilityThreshold", parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>1</span>
                                <span>20</span>
                              </div>
                              <p className="text-gray-400 text-xs">
                                Guest list will be hidden until this many people respond "Yup"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Review Your Event</h3>
                    
                    <div className="bg-slate-700 rounded-lg p-6 space-y-4">
                      {form.watch("imageUrl") && (
                        <img 
                          src={form.watch("imageUrl")} 
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
                      style={{
                        backgroundColor: primaryColor || 'hsl(308, 100%, 66%)',
                        color: accessibleTextColor,
                        borderColor: primaryColor || 'hsl(308, 100%, 66%)'
                      }}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: primaryColor || 'hsl(308, 100%, 66%)',
                        color: accessibleTextColor,
                        borderColor: primaryColor || 'hsl(308, 100%, 66%)'
                      }}
                    >
                      {isSubmitting ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
                    </Button>
                  )}
            </div>
          </CardContent>
        </Card>

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
      </main>
    </div>
  );
}