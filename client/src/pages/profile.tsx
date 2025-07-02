import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// LinkedIn integration temporarily hidden
// import LinkedInConnectButton from "@/components/linkedin-connect-button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define the schema for form validation
const profileSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters"),
    username: z
      .string()
      .min(2, "Username must be at least 2 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  });

type ProfileFormValues = z.infer<typeof profileSchema> & { profileImageFile?: File | null };

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
      displayName: user?.display_name || "",
      username: user?.username || "",
      password: "",
      profileImageFile: null,
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Verify current password by signing in again
      if (!user.email) throw new Error("Email missing on user account");

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.password,
      });
      if (verifyErr) throw new Error("Incorrect password");

      // Handle profile image upload (optional)
      let profileImageUrl: string | undefined;
      const file = (data as any).profileImageFile as File | null | undefined;
      if (file) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        profileImageUrl = publicUrlData.publicUrl;
      }

      // Prepare updates
      const updates: Record<string, any> = {};
      if (data.displayName && data.displayName !== user.display_name) {
        updates.display_name = data.displayName;
      }
      if (data.username && data.username !== user.username) {
        updates.username = data.username;
      }
      if (profileImageUrl) {
        updates.profile_image_url = profileImageUrl;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id);
        if (updateErr) throw updateErr;

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: {
            display_name: data.displayName,
            username: data.username,
            profile_image_url: profileImageUrl,
          },
        });
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      // Refresh page to pick up new changes
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error?.message || "Something went wrong. Please try again.";
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
                  {user?.profile_image_url ? (
                    <AvatarImage src={user.profile_image_url} alt={user.display_name} />
                  ) : null}
                  <AvatarFallback className="bg-gray-900 text-primary text-xl">
                    {getInitials(user?.display_name || "")}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <CardTitle>{user?.display_name}</CardTitle>
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

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">Username</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400">
                            Confirm Password
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
                            Required to update profile details
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-gray-400">Profile Picture</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        className={inputClasses}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          form.setValue("profileImageFile", file as any);
                        }}
                      />
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
                    <p>{user?.display_name}</p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent border-gray-700 hover:bg-gray-800"
                      onClick={() => setLocation("/change-password")}
                    >
                      Change Password
                    </Button>
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
                  {user?.is_premium ? (
                    <p className="flex items-center">
                      <span className="flex h-2 w-2 bg-primary rounded-full mr-2"></span>
                      Premium Plan
                    </p>
                  ) : user?.is_pro ? (
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
                    {user?.is_premium ? (
                      <>
                        <li>• Unlimited events</li>
                        <li>• Advanced analytics</li>
                        <li>• Custom branding</li>
                        <li>• White-label events</li>
                      </>
                    ) : user?.is_pro ? (
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
                  {(user?.is_pro || user?.is_premium) && user?.stripe_customer_id ? (
                    <Button
                      onClick={async () => {
                        try {
                          const data = await apiRequest<{ url: string }>("POST", "/api/create-customer-portal", {});
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

          {/* LinkedIn section temporarily hidden
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
          */}
        </div>
      </main>
    </div>
  );
}
