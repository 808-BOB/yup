import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LinkedInConnectButton from "@/components/linkedin-connect-button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

// Define the schema for form validation
const profileSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters"),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set new password",
      path: ["currentPassword"],
    },
  )
  .refine(
    (data) => {
      if (
        data.newPassword &&
        data.confirmPassword &&
        data.newPassword !== data.confirmPassword
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (!isLoading && !user) {
    setLocation("/login");
    return null;
  }

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // Only include password fields if user wants to update password
      const updateData: any = { displayName: data.displayName };
      if (data.newPassword && data.currentPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      await apiRequest("PUT", `/api/users/${user?.id}`, updateData);

      // Invalidate user data cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);

      // Reset password fields
      form.setValue("currentPassword", "");
      form.setValue("newPassword", "");
      form.setValue("confirmPassword", "");
    } catch (error: any) {
      const errorMessage =
        error?.message || "Something went wrong. Please try again.";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate user's initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Common classes for form inputs
  const inputClasses =
    "bg-transparent border border-gray-700 rounded-none h-10";

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
        <Header />
        <main className="flex-1 overflow-auto mb-6">
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
      <Header />

      <main className="flex-1 overflow-auto mb-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>

          <Card className="bg-gray-900 border border-gray-800 mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border border-primary bg-gray-900">
                  <AvatarFallback className="bg-gray-900 text-primary text-xl">
                    {getInitials(user?.displayName || "")}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <CardTitle>{user?.displayName}</CardTitle>
                  <CardDescription className="text-gray-400">
                    @{user?.username}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-gray-800" />

            <CardContent className="pt-6">
              {isEditing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your display name"
                              className={inputClasses}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-primary" />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-3">
                        Change Password
                      </h3>
                      <Separator className="bg-gray-800 mb-4" />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-400">
                                Current Password
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className={inputClasses}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-primary" />
                              <FormDescription className="text-xs text-gray-500">
                                Required to change your password
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-400">
                                New Password
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className={inputClasses}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-primary" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-400">
                                Confirm New Password
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className={inputClasses}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-primary" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-transparent border-gray-700 hover:bg-gray-800"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Display Name
                    </h3>
                    <p>{user?.displayName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Username
                    </h3>
                    <p>@{user?.username}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Password
                    </h3>
                    <p>••••••••</p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-base">Account Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-sm text-center">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">
                    Created Events
                  </p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-sm text-center">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">
                    Responses
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Current Plan</h3>
                  {user?.isPremium ? (
                    <p className="flex items-center">
                      <span className="flex h-2 w-2 bg-primary rounded-full mr-2"></span>
                      Premium Plan
                    </p>
                  ) : user?.isPro ? (
                    <p className="flex items-center">
                      <span className="flex h-2 w-2 bg-primary rounded-full mr-2"></span>
                      Pro Plan
                    </p>
                  ) : (
                    <p className="flex items-center">
                      <span className="flex h-2 w-2 bg-gray-400 rounded-full mr-2"></span>
                      Free Plan
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Features</h3>
                  <ul className="space-y-1 text-sm">
                    {user?.isPremium ? (
                      <>
                        <li>• Unlimited events</li>
                        <li>• Advanced analytics</li>
                        <li>• Custom branding</li>
                        <li>• White-label events</li>
                      </>
                    ) : user?.isPro ? (
                      <>
                        <li>• Unlimited events</li>
                        <li>• Advanced analytics</li>
                        <li className="text-gray-500">• Custom branding (Premium only)</li>
                        <li className="text-gray-500">• White-label events (Premium only)</li>
                      </>
                    ) : (
                      <>
                        <li>• Up to 3 events</li>
                        <li className="text-gray-500">• Advanced analytics (Pro & Premium)</li>
                        <li className="text-gray-500">• Custom branding (Premium only)</li>
                        <li className="text-gray-500">• White-label events (Premium only)</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <div className="pt-2">
                  {(user?.isPro || user?.isPremium) && user?.stripeCustomerId ? (
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/create-customer-portal", {});
                          const data = await response.json();
                          window.location.href = data.url;
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Could not open subscription management portal.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation("/upgrade")}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Upgrade Your Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-base">LinkedIn Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Connect your LinkedIn profile to see your connections at events you attend.
                </p>
                
                <div className="pt-2">
                  <LinkedInConnectButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
