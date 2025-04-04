import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  slug: z.string().optional(), // Will be generated server-side
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      address: "", // Handle as empty string rather than null
      description: "", // Handle as empty string rather than null
      status: "open",
      // In a real app, this would come from auth context
      hostId: 1
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/events", data);

      toast({
        title: "Event Created",
        description: "Your event has been created successfully."
      });

      // Invalidate the cache for events queries
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/events"] });

      // Redirect to the user's events page
      setLocation("/my-events");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation("/my-events");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto px-4 w-full">
        {/* Header with Logo and Icons */}
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <div className="text-2xl font-bold tracking-tight font-mono">
              YUP<span className="text-primary font-bold">.RSVP</span>
            </div>
          </Link>
          
          <div className="flex gap-2">
            <Button 
              size="icon" 
              className="bg-primary rounded-none w-10 h-10 flex items-center justify-center"
            >
              <Plus className="h-5 w-5" />
            </Button>
            
            <Button 
              size="icon" 
              variant="outline" 
              className="rounded-none bg-transparent border-gray-700 w-10 h-10"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      
        {/* Main Form Content */}
        <main className="animate-fade-in py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Event Title</FormLabel>
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
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Date</FormLabel>
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
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200" 
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
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">End Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12 text-gray-200" 
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
                    <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Location</FormLabel>
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
                  const value = field.value === null || field.value === undefined ? "" : field.value;
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Address (Optional)</FormLabel>
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
                name="description"
                render={({ field }) => {
                  // Ensure field.value is a string
                  const value = field.value === null || field.value === undefined ? "" : field.value;
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Description (Optional)</FormLabel>
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
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </main>
      </div>
      
      {/* Footer - sticky only on desktop */}
      <div className="mt-8 md:mt-auto pt-6 pb-10 text-center text-gray-500 text-xs">
        <p>© 2025 Yup.RSVP. All rights are relative.</p>
        <p className="mt-1">Imagined, designed, and developed by Former Colleagues™.</p>
      </div>
    </div>
  );
}