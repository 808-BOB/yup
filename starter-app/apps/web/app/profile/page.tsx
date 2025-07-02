"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/utils/use-toast";
import { supabase } from "@/lib/supabase";
import Header from "@/dash/header";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Separator } from "@/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { ImageUpload } from "@/ui/image-upload";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { uploadProfilePicture } from "@/utils/image-upload";

// Define separate schemas for different updates
const displayNameSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

const usernameSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

type DisplayNameFormValues = z.infer<typeof displayNameSchema>;
type UsernameFormValues = z.infer<typeof usernameSchema>;
type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function ProfilePage() {
  // Redirect unauthenticated users
  useRequireAuth();

  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmittingDisplayName, setIsSubmittingDisplayName] = useState(false);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [accountStats, setAccountStats] = useState({
    createdEvents: 0,
    totalResponses: 0,
    loading: true
  });
  const [subscriptionData, setSubscriptionData] = useState({
    currentPlan: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    loading: true
  });

  // Initialize separate forms for different updates
  const displayNameForm = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      displayName: (user as any)?.display_name || "",
    },
  });

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: (user as any)?.username || "",
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  // Fetch account stats from Supabase
  const fetchAccountStats = async () => {
    if (!user?.id) return;

    try {
      // Get count of events created by user
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id);

      if (eventsError) throw eventsError;

      // Get user's event IDs first, then count responses
      const { data: userEvents, error: userEventsError } = await supabase
        .from('events')
        .select('id')
        .eq('host_id', user.id);

      if (userEventsError) throw userEventsError;

      let responsesCount = 0;
      if (userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(event => event.id);
        const { count, error: responsesError } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds);

        if (responsesError) throw responsesError;
        responsesCount = count || 0;
      }

      setAccountStats({
        createdEvents: eventsCount || 0,
        totalResponses: responsesCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching account stats:', error);
      setAccountStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch subscription data from Supabase
  const fetchSubscriptionData = async () => {
    if (!user?.id) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_pro, is_premium, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      let currentPlan = 'free';
      if (userData?.is_premium) currentPlan = 'premium';
      else if (userData?.is_pro) currentPlan = 'pro';

      setSubscriptionData({
        currentPlan,
        stripeCustomerId: userData?.stripe_customer_id || null,
        stripeSubscriptionId: userData?.stripe_subscription_id || null,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchAccountStats();
      fetchSubscriptionData();
    }
  }, [user?.id]);

  // Handle display name update
  const onUpdateDisplayName = async (data: DisplayNameFormValues) => {
    if (!user) return;

    setIsSubmittingDisplayName(true);

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ display_name: data.displayName })
        .eq("id", user.id);
      
      if (updateErr) throw updateErr;

      await supabase.auth.updateUser({
        data: { display_name: data.displayName },
      });

      toast({
        title: "Display Name Updated",
        description: "Your display name has been updated successfully.",
      });

      setIsEditingDisplayName(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update display name.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDisplayName(false);
    }
  };

  // Handle username update
  const onUpdateUsername = async (data: UsernameFormValues) => {
    if (!user) return;

    setIsSubmittingUsername(true);

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ username: data.username })
        .eq("id", user.id);
      
      if (updateErr) throw updateErr;

      await supabase.auth.updateUser({
        data: { username: data.username },
      });

      toast({
        title: "Username Updated",
        description: "Your username has been updated successfully.",
      });

      setIsEditingUsername(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update username.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  // Handle profile image upload (using base64 instead of storage)
  const onUpdateProfileImage = async (file: File) => {
    console.log("onUpdateProfileImage called with file:", file);
    console.log("User:", user);
    
    if (!user) {
      console.error("No user found");
      return;
    }

    setIsUploadingImage(true);
    console.log("Starting upload...");

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Convert to base64
      console.log("Converting file to base64...");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log("Base64 conversion complete, updating database...");
      const { error: updateErr } = await supabase
        .from("users")
        .update({ profile_image_url: base64 })
        .eq("id", user.id);
      
      if (updateErr) {
        console.error("Database update error:", updateErr);
        throw updateErr;
      }

      console.log("Updating auth user metadata...");
      await supabase.auth.updateUser({
        data: { profile_image_url: base64 },
      });

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });

      setSelectedProfileFile(null);
      window.location.reload();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle password change
  const onChangePassword = async (data: PasswordChangeFormValues) => {
    if (!user) return;

    setIsSubmittingPassword(true);

    try {
      // Verify current password
      if (!user.email) throw new Error("Email missing on user account");

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });
      if (verifyErr) throw new Error("Current password is incorrect");

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (updateErr) throw updateErr;

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });

      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error?.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPassword(false);
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

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
        <div className="sticky top-0 z-50 bg-gray-950 pt-8">
          <Header />
        </div>
        <main className="flex-1 overflow-auto mb-6">
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  const displayName = (user as any)?.display_name ?? (user as any)?.user_metadata?.display_name ?? user?.email ?? "";
  const username = (user as any)?.username ?? (user as any)?.user_metadata?.username ?? "";
  const profileImageUrl = (user as any)?.profile_image_url ?? (user as any)?.user_metadata?.profile_image_url;
  
  // Use subscription data from Supabase instead of user metadata
  const isPremium = subscriptionData.currentPlan === 'premium';
  const isPro = subscriptionData.currentPlan === 'pro';

  return (
    <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col bg-gray-950">
      <div className="sticky top-0 z-50 bg-gray-950 pt-8">
        <Header />
      </div>

      <main className="flex-1 overflow-auto mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <Card className="bg-gray-900 border border-gray-800 mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border border-primary bg-gray-900">
                {profileImageUrl ? (
                  <AvatarImage src={profileImageUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-gray-900 text-primary text-xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription className="text-gray-400">
                  {username ? `@${username}` : user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <Separator className="bg-gray-800" />

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Profile Picture
                </h3>
                <div className="flex items-start gap-4">
                  <ImageUpload
                    value={profileImageUrl}
                    onChange={(file) => {
                      console.log("File selected:", file);
                      setSelectedProfileFile(file);
                    }}
                    placeholder="Upload a profile picture"
                    rounded={true}
                    size="lg"
                    maxSize={5}
                    className="flex-shrink-0"
                  />
                  {selectedProfileFile && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="text-xs text-gray-500 mb-1">
                        File: {selectedProfileFile.name} ({(selectedProfileFile.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                      <Button
                        onClick={() => {
                          console.log("Save button clicked, file:", selectedProfileFile);
                          onUpdateProfileImage(selectedProfileFile);
                        }}
                        disabled={isUploadingImage}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {isUploadingImage ? "Saving..." : "Save Picture"}
                      </Button>
                      <Button
                        onClick={() => {
                          console.log("Cancel button clicked");
                          setSelectedProfileFile(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-gray-700 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {!selectedProfileFile && (
                    <div className="text-xs text-gray-500 mt-2">
                      No file selected
                    </div>
                  )}
                </div>
              </div>

              {/* Display Name Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Display Name
                </h3>
                {isEditingDisplayName ? (
                  <Form {...displayNameForm}>
                    <form
                      onSubmit={displayNameForm.handleSubmit(onUpdateDisplayName)}
                      className="space-y-3"
                    >
                      <FormField
                        control={displayNameForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
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
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmittingDisplayName}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {isSubmittingDisplayName ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingDisplayName(false)}
                          className="bg-transparent border-gray-700 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="flex items-center justify-between">
                    <p>{displayName}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingDisplayName(true)}
                      className="bg-transparent border-gray-700 hover:bg-gray-800"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Username Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Username
                </h3>
                {isEditingUsername ? (
                  <Form {...usernameForm}>
                    <form
                      onSubmit={usernameForm.handleSubmit(onUpdateUsername)}
                      className="space-y-3"
                    >
                      <FormField
                        control={usernameForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Your username"
                                className={inputClasses}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-primary" />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmittingUsername}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {isSubmittingUsername ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingUsername(false)}
                          className="bg-transparent border-gray-700 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="flex items-center justify-between">
                    <p>{username ? `@${username}` : "No username set"}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUsername(true)}
                      className="bg-transparent border-gray-700 hover:bg-gray-800"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Password Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Password
                </h3>
                {isChangingPassword ? (
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onChangePassword)}
                      className="space-y-3"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
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
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
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
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmittingPassword}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {isSubmittingPassword ? "Changing..." : "Change Password"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingPassword(false)}
                          className="bg-transparent border-gray-700 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="flex items-center justify-between">
                    <p>••••••••</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="bg-transparent border-gray-700 hover:bg-gray-800"
                    >
                      Change Password
                    </Button>
                  </div>
                )}
              </div>
            </div>
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
                <p className="text-2xl font-bold">
                  {accountStats.loading ? "..." : accountStats.createdEvents}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-sm text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wider">
                  Total Responses
                </p>
                <p className="text-2xl font-bold">
                  {accountStats.loading ? "..." : accountStats.totalResponses}
                </p>
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
                {subscriptionData.loading ? (
                  <p className="flex items-center">
                    <span className="flex h-2 w-2 bg-gray-400 rounded-full mr-2"></span>
                    Loading...
                  </p>
                ) : isPremium ? (
                  <p className="flex items-center">
                    <span className="flex h-2 w-2 bg-primary rounded-full mr-2"></span>
                    Premium Plan
                  </p>
                ) : isPro ? (
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
                  {isPremium ? (
                    <>
                      <li>• Unlimited events</li>
                      <li>• Advanced analytics</li>
                      <li>• Custom branding</li>
                      <li>• White-label events</li>
                    </>
                  ) : isPro ? (
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
                {subscriptionData.loading ? (
                  <Button
                    disabled
                    className="w-full bg-gray-700 text-gray-400"
                  >
                    Loading...
                  </Button>
                ) : (isPro || isPremium) && subscriptionData.stripeCustomerId ? (
                  <Button
                    onClick={async () => {
                      try {
                        // This would require implementing a Stripe customer portal API endpoint
                        toast({
                          title: "Feature Coming Soon",
                          description: "Subscription management portal is coming soon.",
                        });
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
                    onClick={() => router.push("/upgrade")}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Upgrade Your Plan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 