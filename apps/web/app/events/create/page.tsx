"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Image from "lucide-react/dist/esm/icons/image";
import Upload from "lucide-react/dist/esm/icons/upload";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { InputWithIcon } from "@/ui/input-with-icon";
import { LocationAutocomplete } from "@/ui/location-autocomplete";
import { DateTimeInput } from "@/ui/date-time-input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { MapPin, Edit } from "lucide-react";
import Home from "lucide-react/dist/esm/icons/home";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import { Switch } from "@/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { insertEventSchema } from "@/utils/validators/event";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import { ImageUpload } from "@/ui/image-upload";
import { TimezoneSelector } from "@/ui/timezone-selector";
import dynamic from "next/dynamic";

// Dynamically import Header to avoid SSR issues
const Header = dynamic(() => import("@/dash/header"), { ssr: false });
import PageLayout from "@/ui/page-layout";

import { z } from "zod";

// Define FormValues to match the schema
interface FormValues {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  hostId: string;
  status: string;
  slug?: string;
  allowGuestRsvp: boolean;
  allowPlusOne: boolean;
  maxGuestsPerRsvp: number;
  customYesText?: string;
  customNoText?: string;
  useCustomRsvpText: boolean;
}

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageSettings, setImageSettings] = useState({
    scale: 100,
    position: { x: 50, y: 50 },
    fit: 'contain' as 'contain' | 'cover'
  });
  const [addressValue, setAddressValue] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  
  const totalSteps = 3;

  const form = useForm<FormValues>({
    // resolver: zodResolver(insertEventSchema), // Temporarily disabled to avoid type issues
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "",
      description: "",
      imageUrl: "",
      hostId: "",
      status: "open",
      slug: "",
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 1,
      customYesText: "",
      customNoText: "",
      useCustomRsvpText: false,
    },
  });

  // Update hostId when user becomes available
  React.useEffect(() => {
    if (user?.id) {
      form.setValue("hostId", user.id);
    }
  }, [user?.id, form]);

  // Debug form values
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('Form field changed:', { name, type, value });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle image upload will be managed by ImageUpload component

  const onSubmit = async (data: FormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create an event.",
        variant: "destructive",
      });
      return;
    }
    
    // Manual validation for required fields
    console.log('Form data for validation:', {
      title: data.title,
      date: data.date,
      location: data.location,
      titleLength: data.title?.length,
      dateLength: data.date?.length,
      locationLength: data.location?.length
    });
    
    if (!data.title || !data.date || !data.location) {
      console.log('Validation failed:', {
        title: !!data.title,
        date: !!data.date,
        location: !!data.location
      });
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: title, date, and location.",
        variant: "destructive",
      });
      return;
    }
    
    // Handle time fields - if either start or end time is missing, set both to "TBD"
    if (!data.startTime || !data.endTime) {
      data.startTime = "TBD";
      data.endTime = "TBD";
    }
    
    // Ensure hostId is set
    if (!data.hostId) {
      data.hostId = user.id;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate slug from title
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      // Create event first without image
      const eventPayload = {
        ...data,
        imageUrl: "", // Will be updated after image upload
        imageScale: imageSettings.scale,
        imagePositionX: imageSettings.position.x,
        imagePositionY: imageSettings.position.y,
        imageFit: imageSettings.fit,
        timezone: timezone,
        hostId: user.id,
        slug,
        status: "open",
      };

      console.log("Submitting event:", eventPayload);

      // Call the API to create the event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific event limit error for free users
        if (response.status === 403 && errorData.upgradeRequired) {
          toast({
            title: "Event Limit Reached",
            description: errorData.details || "Free accounts are limited to 3 events. Upgrade to Pro or Premium for unlimited events.",
            variant: "destructive",
          });
          
          // Redirect to upgrade page after a short delay
          setTimeout(() => {
            window.location.href = "/upgrade";
          }, 2000);
          
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await response.json();
      console.log('Full API response:', JSON.stringify(result, null, 2));
      
      // Try different ways to get the event ID
      let eventId = result.event?.id;
      if (!eventId && result.event) {
        // Check if the event object has an id field with different casing
        eventId = result.event.ID || result.event.Id || result.event.event_id;
      }
      if (!eventId && result.id) {
        // Check if the ID is at the top level
        eventId = result.id;
      }
      
      console.log('Event created successfully:', result);
      console.log('Event ID found:', eventId);
      console.log('Event object keys:', result.event ? Object.keys(result.event) : 'No event object');
      console.log('Result keys:', Object.keys(result));
      console.log('Selected image file:', selectedImageFile ? selectedImageFile.name : 'None');
      
      if (!eventId) {
        console.error('No event ID returned from API');
        throw new Error('Event was created but no ID was returned');
      }

      // Handle image upload after event creation if a file was selected
      if (selectedImageFile && eventId) {
        console.log("Uploading event image via server-side endpoint...");
        console.log('Event ID for upload:', eventId);
        console.log('Selected file:', selectedImageFile.name, selectedImageFile.size, 'bytes');
        
        try {
          // Use server-side upload endpoint instead of client-side upload
          const formData = new FormData();
          formData.append('file', selectedImageFile);
          
          const uploadResponse = await fetch(`/api/events/${eventId}/upload-image`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('Server-side upload failed:', errorData);
            
            // Don't fail the entire event creation for image upload failure
            toast({
              title: "Image Upload Failed",
              description: errorData.error || "Failed to upload event image, but event was created successfully.",
              variant: "destructive",
            });
          } else {
            const uploadResult = await uploadResponse.json();
            console.log('Server-side upload successful:', uploadResult);
            
            toast({
              title: "Image Uploaded!",
              description: "Event image was uploaded successfully.",
            });
          }
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          toast({
            title: "Image Upload Failed", 
            description: "Failed to upload event image, but event was created successfully.",
            variant: "destructive",
          });
        }
      } else {
        console.log('No image upload needed:', { hasFile: !!selectedImageFile, hasEventId: !!eventId });
      }
      
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      
      router.push("/my-events");
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

  const nextStep = async () => {
    // Get fields for the current step
    let fieldsToValidate: string[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'date', 'startTime', 'endTime'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['location'];
    }
    
    // Validate the fields for the current step
    const fieldsValid = await form.trigger(fieldsToValidate as any);
    
    if (fieldsValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    router.push("/my-events");
  };

  return (
    <PageLayout maxWidth="xl" className="min-h-screen flex flex-col bg-gray-950">
      <main className="flex-1 pb-32">
        {/* Header with back button and title */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm hover:bg-gray-700/50 px-3 py-2 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Create Event</h1>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <p className="text-gray-300 mb-2">Step {currentStep} of {totalSteps}</p>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Debug form values */}
        <div className="mb-4 p-4 bg-gray-800 rounded text-xs text-gray-300">
          <p><strong>Form Values Debug:</strong></p>
          <p>Title: "{form.watch("title")}"</p>
          <p>Date: "{form.watch("date")}"</p>
          <p>Start Time: "{form.watch("startTime")}"</p>
          <p>End Time: "{form.watch("endTime")}"</p>
          <p>Location: "{form.watch("location")}"</p>
        </div>

        {/* Form content */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Image & Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <Label className="text-white uppercase text-xs tracking-wider font-medium">
                    Event Image (Optional)
                  </Label>
                  
                  <ImageUpload
                    value={form.watch("imageUrl")}
                    onChange={(file) => {
                      setSelectedImageFile(file);
                      if (file) {
                        // Create a temporary preview URL for the form
                        const url = URL.createObjectURL(file);
                        form.setValue("imageUrl", url);
                      } else {
                        form.setValue("imageUrl", "");
                      }
                    }}
                    placeholder="Upload an event image"
                    aspectRatio="rectangle"
                    maxSize={10}
                    className="w-full"
                    showPositioningControls={true}
                    onImageSettingsChange={(settings) => {
                      setImageSettings(settings);
                    }}
                  />
                  
                  <div className="text-sm text-gray-300 text-center">
                    <p>PNG, JPEG, JPG, or GIF • Max 10MB • 16:9 recommended</p>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white uppercase text-xs tracking-wider font-medium">
                    Event Title
                  </Label>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        id="title"
                        {...field}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                        placeholder="Enter title"
                      />
                    )}
                  />
                  {form.formState.errors.title && (
                    <p className="text-primary text-sm">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white uppercase text-xs tracking-wider font-medium">
                    Date
                  </Label>
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field }) => (
                      <DateTimeInput
                        id="date"
                        type="date"
                        {...field}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                      />
                    )}
                  />
                  {form.formState.errors.date && (
                    <p className="text-primary text-sm">{form.formState.errors.date.message}</p>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-white uppercase text-xs tracking-wider font-medium">
                      Start Time (Optional)
                    </Label>
                    <Controller
                      name="startTime"
                      control={form.control}
                      render={({ field }) => (
                        <DateTimeInput
                          id="startTime"
                          type="time"
                          {...field}
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                        />
                      )}
                    />
                    {form.formState.errors.startTime && (
                      <p className="text-primary text-sm">{form.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-white uppercase text-xs tracking-wider font-medium">
                      End Time (Optional)
                    </Label>
                    <Controller
                      name="endTime"
                      control={form.control}
                      render={({ field }) => (
                        <DateTimeInput
                          id="endTime"
                          type="time"
                          {...field}
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                        />
                      )}
                    />
                    {form.formState.errors.endTime && (
                      <p className="text-primary text-sm">{form.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 text-center">
                  <p>Leave time fields empty to show "TBD"</p>
                </div>
                
                {/* Timezone Selector */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Timezone: {timezone}</p>
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
              </div>
            )}

            {/* Step 2: Location & Description */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white uppercase text-xs tracking-wider font-medium">
                    Location
                  </Label>
                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field }) => (
                      <LocationAutocomplete
                        id="location"
                        {...field}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                        placeholder="Enter event location"
                        onLocationSelect={(location) => {
                          form.setValue('location', location.mainText || location.text);
                        }}
                        onAddressChange={(address) => {
                          setAddressValue(address);
                          form.setValue('address', address);
                        }}
                      />
                    )}
                  />
                  {form.formState.errors.location && (
                    <p className="text-primary text-sm">{form.formState.errors.location.message}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white uppercase text-xs tracking-wider font-medium">
                    Address (Optional)
                  </Label>
                  <InputWithIcon
                    id="address"
                    {...form.register("address")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                    placeholder="Enter full address (auto-filled from location)"
                    icon={<Home className="h-4 w-4 text-white" />}
                    value={addressValue}
                    onChange={(e) => {
                      setAddressValue(e.target.value);
                      form.setValue('address', e.target.value);
                    }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white uppercase text-xs tracking-wider font-medium">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none min-h-[120px] resize-none text-white placeholder:text-gray-400"
                    placeholder="Describe your event..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Event Settings</h2>
                
                {/* RSVP Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Allow guest RSVPs</Label>
                      <p className="text-sm text-gray-300">Let invitees RSVP without an account</p>
                    </div>
                    <Switch
                      checked={form.watch("allowGuestRsvp")}
                      onCheckedChange={(checked) => form.setValue("allowGuestRsvp", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Allow plus ones</Label>
                      <p className="text-sm text-gray-300">Let invitees bring additional guests</p>
                    </div>
                    <Switch
                      checked={form.watch("allowPlusOne")}
                      onCheckedChange={(checked) => form.setValue("allowPlusOne", checked)}
                    />
                  </div>

                  {form.watch("allowPlusOne") && (
                    <div className="space-y-2">
                      <Label htmlFor="maxGuestsPerRsvp" className="text-white uppercase text-xs tracking-wider font-medium">
                        Max guests per RSVP
                      </Label>
                      <Input
                        id="maxGuestsPerRsvp"
                        type="number"
                        min="1"
                        max="10"
                        {...form.register("maxGuestsPerRsvp", { valueAsNumber: true })}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-white placeholder:text-gray-400"
                      />
                    </div>
                  )}


                </div>
              </div>
            )}

            {/* Step navigation buttons */}
            <div className="pt-6 flex space-x-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 uppercase tracking-wider rounded-none h-12"
                  onClick={prevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  className="flex-1 rounded-none h-12 uppercase tracking-wider"
                  onClick={nextStep}
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 rounded-none h-12 uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              )}
            </div>
            
            {/* Cancel button - always available */}
            <button
              type="button"
              className="w-full mt-4 text-link-hover flex items-center justify-center gap-2"
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </form>
        </main>
      </PageLayout>
    );
  }