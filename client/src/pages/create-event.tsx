import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { insertEventSchema } from "@/lib/validators/event";
import { Event } from "@shared/schema";

export default function CreateEvent() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/events/:slug/edit");
  const isEditMode = !!params?.slug;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageTitle, setPageTitle] = useState(isEditMode ? "Edit Event" : "Create New Event");
  const [submitButtonText, setSubmitButtonText] = useState(isEditMode ? "Save Changes" : "Create Event");

  // Extended form schema from the basic insertion schema
  const formSchema = insertEventSchema.extend({
    // Additional validation rules
    date: z.string().min(1, "Event date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().min(1, "Location is required"),
  });

  type FormValues = z.infer<typeof formSchema>;

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
      status: "active",
      hostId: user?.id || 0,
      hostDisplayText: null,
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 1,
      showRsvpsToInvitees: true,
      showRsvpsAfterThreshold: false,
      rsvpVisibilityThreshold: 5,
      useCustomRsvpText: false,
      customYesText: "Yes",
      customNoText: "No",
    },
  });

  // Fetch event data if in edit mode
  const { data: eventData, isLoading: isEventLoading } = useQuery<Event>({
    queryKey: [`/api/events/slug/${params?.slug}`],
    enabled: !!isEditMode,
  });

  // When editing, set form values from event data
  useEffect(() => {
    if (isEditMode && eventData) {
      setPageTitle("Edit Event");
      setSubmitButtonText("Save Changes");
      form.reset({
        ...eventData,
        hostId: eventData.hostId || user?.id || 0,
      });
    }
  }, [eventData, form, isEditMode, user?.id]);

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the event data
      const eventData = {
        ...data,
        hostId: user.id,
      };

      if (isEditMode && eventData) {
        // Update existing event
        await apiRequest("PUT", `/api/events/${eventData.id}`, eventData);
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        queryClient.invalidateQueries({ queryKey: [`/api/events/${eventData.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/events/slug/${params?.slug}`] });
        navigate(`/events/${params?.slug}`);
      } else {
        // Create new event
        console.log("Making API request to create event...");
        try {
          const response = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
            credentials: "include",
          });
          
          console.log("Raw response status:", response.status);
          console.log("Raw response ok:", response.ok);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error response:", errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }
          
          const newEvent = await response.json();
          console.log("Event created successfully:", newEvent);
          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          navigate(`/events/${newEvent.slug}`);
        } catch (fetchError) {
          console.error("Fetch error details:", fetchError);
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      // Log form errors to help debug
      console.error("Form errors:", form.formState.errors);
      console.error("Form data being submitted:", data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Get fields for the current step
    let fieldsToValidate: string[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['imageUrl', 'title', 'date', 'startTime', 'endTime'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['location', 'address', 'description'];
    }
    
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (isEditMode && isEventLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <main>
          <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>
          
          <div className="mb-8 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          <div className="w-full h-1 bg-gray-800 mb-8">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Step 1: Image through time fields */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Awesome Event"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location through Description fields */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Virtual or Physical Location"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell people about your event"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: RSVP and advanced options */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="allowGuestRsvp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border border-gray-800 rounded">
                        <div>
                          <FormLabel className="text-base">Allow Guest RSVP</FormLabel>
                          <p className="text-sm text-gray-400">
                            Let anyone with the link RSVP without logging in
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowPlusOne"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border border-gray-800 rounded">
                        <div>
                          <FormLabel className="text-base">Allow Plus One</FormLabel>
                          <p className="text-sm text-gray-400">
                            Let attendees bring additional guests
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("allowPlusOne") && (
                    <FormField
                      control={form.control}
                      name="maxGuestsPerRsvp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Guests Per RSVP</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
              
              {/* Step navigation buttons */}
              <div className="pt-6 flex space-x-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-700 hover:bg-gray-800 rounded-none h-12 uppercase tracking-wider"
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
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : submitButtonText}
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
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
}