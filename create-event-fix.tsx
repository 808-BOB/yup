// Fixed version of CreateEvent component with proper schema validation
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Create a schema directly using zod instead of relying on insertEventSchema.extend
const formSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  date: z.string().min(1, "Event date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEvent() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [, navigate] = useLocation();

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
      imageUrl: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // This would normally send data to the API
      console.log("Form submitted successfully:", data);
      setTimeout(() => {
        setIsSubmitting(false);
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const nextStep = async () => {
    // Get fields for the current step
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'date', 'startTime', 'endTime'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['location'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const submitButtonText = isEditMode ? "Update Event" : "Create Event";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <main>
          <h1 className="text-3xl font-bold mb-8">
            {isEditMode ? "Edit Event" : "Create New Event"}
          </h1>

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
              {/* Step 1: Basic Information */}
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

              {/* Step 2: Location Information */}
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

              {/* Step 3: Review and Submit */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-semibold">Review Your Event</h3>
                  
                  <div className="rounded-md border border-gray-800 p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="font-medium">{form.watch("title")}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Date</p>
                        <p className="font-medium">{form.watch("date")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Time</p>
                        <p className="font-medium">{form.watch("startTime")} - {form.watch("endTime")}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="font-medium">{form.watch("location")}</p>
                      {form.watch("address") && (
                        <p className="text-sm text-gray-400">{form.watch("address")}</p>
                      )}
                    </div>
                    
                    {form.watch("description") && (
                      <div>
                        <p className="text-sm text-gray-400">Description</p>
                        <p>{form.watch("description")}</p>
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
                    className="flex-1 border-gray-700 hover:bg-gray-800 rounded-none h-12 uppercase tracking-wider"
                    onClick={prevStep}
                  >
                    Previous
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
                    onClick={nextStep}
                  >
                    Continue
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