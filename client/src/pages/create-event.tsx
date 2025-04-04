import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// We're using our own schema definition instead of the imported one
// import { insertEventSchema } from "@shared/schema";

// Create a new schema for client-side validation
const formSchema = z.object({
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
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gray-950">
      <Header />
      
      <main className="animate-fade-in">
        <Card className="bg-gray-900 border border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">CREATE EVENT</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Event Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter event title" 
                          className="bg-gray-800 border-gray-700 focus:border-primary" 
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
                      <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="bg-gray-800 border-gray-700 focus:border-primary text-gray-200" 
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
                        <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Start Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className="bg-gray-800 border-gray-700 focus:border-primary text-gray-200" 
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
                        <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">End Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className="bg-gray-800 border-gray-700 focus:border-primary text-gray-200" 
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
                      <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter location" 
                          className="bg-gray-800 border-gray-700 focus:border-primary" 
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
                        <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Address (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter address" 
                            className="bg-gray-800 border-gray-700 focus:border-primary" 
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
                        <FormLabel className="text-gray-300 uppercase text-xs tracking-wider">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell people about your event" 
                            rows={3}
                            className="bg-gray-800 border-gray-700 focus:border-primary resize-none"
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
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100 uppercase tracking-wider rounded-sm" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 btn-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "CREATING..." : "CREATE EVENT"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
