"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Image, Upload, Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth-context";
import { insertEventSchema } from "@/utils/validators/event";
import { useAccessibleColors } from "@/hooks/use-accessible-colors";
import { ImageUpload } from "@/ui/image-upload";
import { uploadEventImage } from "@/utils/image-upload";
import dynamic from "next/dynamic";

// Dynamically import Header to avoid SSR issues
const Header = dynamic(() => import("@/dash/header"), { ssr: false });

import { z } from "zod";

type FormValues = z.infer<typeof insertEventSchema>;

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { accessibleTextColor, primaryColor } = useAccessibleColors();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  const totalSteps = 3;

  const form = useForm<FormValues>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "",
      description: "",
      imageUrl: "",
      hostId: user?.id || "",
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

  // Handle image upload will be managed by ImageUpload component

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate slug from title
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      // Handle image upload if a file was selected
      let imageUrl = data.imageUrl || "";
      if (selectedImageFile) {
        console.log("Converting event image to base64...");
        // Convert to base64 for now (avoiding storage bucket issues)
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImageFile);
        });
      }

      const eventPayload = {
        ...data,
        imageUrl,
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
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await response.json();
      console.log('Event created successfully:', result);
      
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
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto px-4 w-full">
        <Header />
        
        <main className="flex-1 pb-32">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="mb-4 p-0 h-auto font-normal text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel and go back
            </Button>
            
            <h1 className="text-3xl font-bold text-white mb-2">Create Event</h1>
            <p className="text-gray-400">Step {currentStep} of {totalSteps}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-800 mb-8 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          <div className="space-y-6">
            {/* Step 1: Image & Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <Label className="text-gray-400 uppercase text-xs tracking-wider">
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
                  />
                  
                  <div className="text-sm text-gray-400 text-center">
                    <p>PNG, JPEG, JPG, or GIF • Max 10MB • 16:9 recommended</p>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-400 uppercase text-xs tracking-wider">
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                    placeholder="Enter title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-primary text-sm">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-400 uppercase text-xs tracking-wider">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200"
                  />
                  {form.formState.errors.date && (
                    <p className="text-primary text-sm">{form.formState.errors.date.message}</p>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-gray-400 uppercase text-xs tracking-wider">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...form.register("startTime")}
                      className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200"
                    />
                    {form.formState.errors.startTime && (
                      <p className="text-primary text-sm">{form.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-gray-400 uppercase text-xs tracking-wider">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...form.register("endTime")}
                      className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200"
                    />
                    {form.formState.errors.endTime && (
                      <p className="text-primary text-sm">{form.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Description */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-400 uppercase text-xs tracking-wider">
                    Location
                  </Label>
                  <Input
                    id="location"
                    {...form.register("location")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                    placeholder="Enter event location"
                  />
                  {form.formState.errors.location && (
                    <p className="text-primary text-sm">{form.formState.errors.location.message}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-400 uppercase text-xs tracking-wider">
                    Address (Optional)
                  </Label>
                  <Input
                    id="address"
                    {...form.register("address")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                    placeholder="Enter full address"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-400 uppercase text-xs tracking-wider">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    className="bg-transparent border border-gray-700 focus:border-primary rounded-none min-h-[120px] resize-none"
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
                      <p className="text-sm text-gray-400">Let invitees RSVP without an account</p>
                    </div>
                    <Switch
                      checked={form.watch("allowGuestRsvp")}
                      onCheckedChange={(checked) => form.setValue("allowGuestRsvp", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Allow plus ones</Label>
                      <p className="text-sm text-gray-400">Let invitees bring additional guests</p>
                    </div>
                    <Switch
                      checked={form.watch("allowPlusOne")}
                      onCheckedChange={(checked) => form.setValue("allowPlusOne", checked)}
                    />
                  </div>

                  {form.watch("allowPlusOne") && (
                    <div className="space-y-2">
                      <Label htmlFor="maxGuestsPerRsvp" className="text-gray-400 uppercase text-xs tracking-wider">
                        Max guests per RSVP
                      </Label>
                      <Input
                        id="maxGuestsPerRsvp"
                        type="number"
                        min="1"
                        max="10"
                        {...form.register("maxGuestsPerRsvp", { valueAsNumber: true })}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
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
                  className="flex-1 bg-black border-gray-700 text-gray-300 hover:text-white uppercase tracking-wider rounded-none h-12"
                  onClick={prevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
                  onClick={nextStep}
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
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
            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4 text-gray-400 hover:text-white"
              onClick={handleCancel}
            >
              Cancel and go back
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
} 