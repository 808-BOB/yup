import { useState, useRef, useEffect } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Loader2, Image, Upload, Link as LinkIcon, ArrowRight, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { type Event } from "@shared/schema";
// We're using our own schema definition instead of the imported one
// import { insertEventSchema } from "@shared/schema";

// Create a new schema for client-side validation
const formSchema = z.object({
  imageUrl: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.string().default("open"),
  hostId: z.number(),
  hostDisplayText: z.string().optional(),
  slug: z.string().optional(), // Will be generated server-side
  allowGuestRsvp: z.boolean().default(true),
  allowPlusOne: z.boolean().default(true),
  maxGuestsPerRsvp: z.number().min(0).max(10).default(3),
  showRsvpsToInvitees: z.boolean().default(true),
  showRsvpsAfterThreshold: z.boolean().default(false),
  rsvpVisibilityThreshold: z.number().min(1).max(20).default(5),
  // Custom RSVP button text options (for premium users)
  useCustomRsvpText: z.boolean().default(false),
  customYesText: z.string().max(10, "Max 10 characters").optional(),
  customNoText: z.string().max(10, "Max 10 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoading: authLoading } = useAuth();
  const [pageTitle, setPageTitle] = useState<string>("Create Event");
  const [submitButtonText, setSubmitButtonText] = useState<string>("Create Event");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Check if we're in edit mode by looking at the URL
  const [, params] = useRoute("/events/:slug/edit");
  const isEditMode = params && params.slug;

  // Redirect to login if not authenticated - but only when creating a new event
  // For editing, we'll check permission after loading the event
  if (!authLoading && !user && !isEditMode) {
    setLocation("/login");
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: "",
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "", // Handle as empty string rather than null
      description: "", // Handle as empty string rather than null
      status: "open",
      hostId: user?.id || 0,
      allowGuestRsvp: true,
      allowPlusOne: true,
      maxGuestsPerRsvp: 3,
      showRsvpsToInvitees: true,
      showRsvpsAfterThreshold: false,
      rsvpVisibilityThreshold: 5,
      // Custom RSVP text options
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
      // Update page title
      setPageTitle("Edit Event");
      setSubmitButtonText("Save Changes");

      // Check if user is logged in
      if (!user) {
        // If not logged in, redirect to view the event instead of editing
        toast({
          title: "Login Required",
          description: "Please log in to edit this event.",
          variant: "destructive",
        });
        // Redirect to event view page instead of login page
        setLocation(`/events/${eventData.slug}`);
        return;
      }

      // Check if this user is allowed to edit this event
      if (eventData.hostId !== user.id) {
        toast({
          title: "Permission Denied",
          description: "You can only edit events that you've created.",
          variant: "destructive",
        });
        setLocation(`/events/${eventData.slug}`);
        return;
      }

      // Update form with event data
      form.reset({
        ...eventData,
        // Ensure nullable fields are handled properly
        address: eventData.address || "",
        description: eventData.description || "",
        imageUrl: eventData.imageUrl || "",
        hostId: eventData.hostId,
      });

      // Handle image URLs based on type (URL vs base64)
      if (eventData.imageUrl) {
        if (eventData.imageUrl.startsWith("data:")) {
          // For base64 images, clear the URL field and set the preview URL
          form.setValue("imageUrl", ""); // Clear the URL field
          setPreviewUrl(eventData.imageUrl); // Set the preview
          // Automatically switch to upload tab
          setTimeout(() => {
            const uploadTab = document.querySelector('[data-value="upload"]');
            if (uploadTab) {
              (uploadTab as HTMLElement).click();
            }
          }, 100);
        } else {
          // For regular URLs, set the URL field
          form.setValue("imageUrl", eventData.imageUrl);
        }
      }
    }
  }, [isEditMode, eventData, form, user, setLocation, toast]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create a preview URL for the selected image
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const base64Data = fileReader.result as string;
      console.log(
        "File converted to base64:",
        base64Data.substring(0, 50) + "...",
      );

      setPreviewUrl(base64Data);
      // Set the image URL in the form
      form.setValue("imageUrl", base64Data);
    };
    fileReader.readAsDataURL(file);
  };

  // Clear the selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    form.setValue("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      if (isEditMode && eventData) {
        // Update existing event
        await apiRequest("PUT", `/api/events/${eventData.id}`, data);

        toast({
          title: "Event Updated",
          description: "Your event has been updated successfully.",
        });
      } else {
        // Create new event
        await apiRequest("POST", "/api/events", data);

        toast({
          title: "Event Created",
          description: "Your event has been created successfully.",
        });
      }

      // Invalidate the cache for events queries
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (user) {
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${user.id}/events`],
        });
      }
      // Also invalidate the specific event if we're editing
      if (isEditMode && params?.slug) {
        queryClient.invalidateQueries({
          queryKey: [`/api/events/slug/${params.slug}`],
        });
      }

      // Redirect based on context
      if (isEditMode && eventData) {
        // After editing, go back to the event page
        setLocation(`/events/${eventData.slug}`);
      } else {
        // After creating, go to the user's events page
        setLocation("/my-events");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode
          ? "Failed to update event. Please try again."
          : "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && eventData) {
      // If we're editing, go back to the event page
      setLocation(`/events/${eventData.slug}`);
    } else {
      // Otherwise, go back to the user's events page
      setLocation("/my-events");
    }
  };

  // Function to move to the next step
  const nextStep = async () => {
    // Get fields for the current step
    let fieldsToValidate: string[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['imageUrl', 'title', 'date', 'startTime', 'endTime'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['location', 'address', 'description'];
    }
    
    // Validate the fields for the current step
    const fieldsValid = await form.trigger(fieldsToValidate as any);
    
    if (fieldsValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Function to go back to the previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto px-4 w-full">
        <Header />

        {/* Main Form Content */}
        <main className="animate-fade-in py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <div className="text-sm text-gray-400">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 h-2 mb-6 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                      Event Image (Optional)
                    </FormLabel>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                        <TabsTrigger
                          value="upload"
                          className="data-[state=active]:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span>Upload</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="url"
                          className="data-[state=active]:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <span>URL</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-2">
                        <FormControl>
                          <Input
                            placeholder="Enter image URL"
                            className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setPreviewUrl(null);
                              setSelectedFile(null);
                            }}
                          />
                        </FormControl>
                        {field.value && !previewUrl && (
                          <div className="mt-2 h-32 w-full bg-gray-800 flex items-center justify-center relative">
                            <img
                              key={`preview-${Date.now()}`}
                              src={field.value}
                              alt="Preview"
                              className="max-h-full max-w-full object-contain"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                console.error("Error loading image:", e);
                                e.currentTarget.style.display = "none";
                                toast({
                                  title: "Error",
                                  description: "Invalid image URL",
                                  variant: "destructive",
                                });
                              }}
                            />
                            {/* Fallback placeholder */}
                            <span className="text-gray-400">Image preview</span>
                          </div>
                        )}
                        <FormDescription className="text-xs text-gray-500 mt-1">
                          Add an image URL for your event. Recommended dimensions: 1200x600px (2:1 ratio) for best display.
                        </FormDescription>
                      </TabsContent>

                      <TabsContent value="upload" className="mt-2">
                        <div className="border border-dashed border-gray-700 rounded-sm p-4 text-center">
                          {previewUrl ? (
                            <div className="relative">
                              <img
                                key={`upload-preview-${Date.now()}`}
                                src={previewUrl}
                                alt="Selected file"
                                className="max-h-32 mx-auto object-contain"
                                onError={(e) => {
                                  console.error(
                                    "Error loading uploaded image:",
                                    e,
                                  );
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={clearSelectedFile}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Image
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">
                                JPG, PNG, or GIF. Max 2MB. Recommended dimensions: 1200x600px (2:1 ratio) for best display.
                              </p>
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    <FormMessage className="text-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                      Event Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter title"
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-primary" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                        Start Time
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200 w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-primary" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                        End Time
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200 w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-primary" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location"
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => {
                  // Ensure field.value is a string
                  const value =
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value;

                  return (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                        Address (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter address"
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                          value={value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage className="text-primary" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="hostDisplayText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                      Custom Host Text (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={user?.displayName || ""}
                        className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Customize how the host is displayed (e.g. "Hosted by ABC Corp" or "John & Jane")
                    </FormDescription>
                    <FormMessage className="text-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  // Ensure field.value is a string
                  const value =
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value;

                  return (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell people about your event"
                          rows={3}
                          className="bg-transparent border border-gray-700 focus:border-primary resize-none min-h-[100px] rounded-none"
                          value={value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage className="text-primary" />
                    </FormItem>
                  );
                }}
              />

              {/* Premium Customization Section */}
              {user?.isPremium && (
                <div className="mt-8 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-5 text-amber-400">✨</span>
                    <h3 className="text-gray-300 text-sm font-medium">
                      Premium RSVP Customization
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="useCustomRsvpText"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-4 mb-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Custom RSVP Button Text
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-500">
                            Change "YUP/NOPE" to custom text like "YES/NO"
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("useCustomRsvpText") && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <FormField
                        control={form.control}
                        name="customYesText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 text-xs tracking-wider">
                              "YES" Text (max 10 chars)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="YES"
                                className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                                maxLength={10}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-primary" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customNoText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 text-xs tracking-wider">
                              "NO" Text (max 10 chars)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="NO"
                                className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                                maxLength={10}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-primary" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-500" />
                  <h3 className="text-gray-300 text-sm font-medium">
                    Guest RSVP Options
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="allowGuestRsvp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-4 mb-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Guest RSVP
                        </FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          When enabled, non-registered users can respond to your
                          event
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("allowGuestRsvp") && (
                  <>
                    <FormField
                      control={form.control}
                      name="allowPlusOne"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-4 mb-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Plus-Ones
                            </FormLabel>
                            <FormDescription className="text-xs text-gray-500">
                              When enabled, guests can bring additional
                              attendees
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                              disabled={!form.watch("allowGuestRsvp")}
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
                          <FormItem className="rounded-lg border border-gray-800 p-4">
                            <FormLabel>Maximum Additional Guests</FormLabel>
                            <FormDescription className="text-xs text-gray-500 mb-4">
                              Maximum number of additional guests per RSVP
                            </FormDescription>
                            <FormControl>
                              <div className="flex flex-col space-y-2">
                                <Slider
                                  defaultValue={[field.value]}
                                  max={10}
                                  step={1}
                                  onValueChange={(vals) =>
                                    field.onChange(vals[0])
                                  }
                                  disabled={
                                    !form.watch("allowGuestRsvp") ||
                                    !form.watch("allowPlusOne")
                                  }
                                  className="w-full"
                                />
                                <div className="text-center text-sm text-primary font-semibold">
                                  {field.value}{" "}
                                  {field.value === 1 ? "guest" : "guests"}
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-gray-800 mt-6 pt-6">
                <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-4">RSVP Visibility Settings</h3>
                
                <FormField
                  control={form.control}
                  name="showRsvpsToInvitees"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-4 mb-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Show RSVPs to Invitees
                        </FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          Allow people invited to this event to see who else is going
                        </FormDescription>
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
                  name="showRsvpsAfterThreshold"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-4 mb-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Show RSVPs after threshold
                        </FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          Only show RSVPs when a minimum number of "YUP" responses are received
                        </FormDescription>
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

                {form.watch("showRsvpsAfterThreshold") && (
                  <FormField
                    control={form.control}
                    name="rsvpVisibilityThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                          Minimum "YUP" responses required
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-4 pt-2">
                            <Slider
                              value={[field.value]}
                              min={1}
                              max={50}
                              step={1}
                              onValueChange={(vals) =>
                                field.onChange(vals[0])
                              }
                              className="w-full"
                            />
                            <div className="text-center text-sm text-primary font-semibold">
                              {field.value} {field.value === 1 ? "response" : "responses"}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500 text-center mt-2">
                          RSVPs will be visible when at least {field.value} people respond with "YUP"
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="pt-6 flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-black border-black text-gray-300 hover:text-white uppercase tracking-wider rounded-none h-12"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
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
              </div>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
}
