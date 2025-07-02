import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);
    try {
      if (!user.email) throw new Error("Email missing on user");

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });
      if (verifyErr) throw new Error("Current password is incorrect");

      const { error: pwdErr } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (pwdErr) throw pwdErr;

      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setLocation("/profile");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update password", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col bg-gray-950">
      <Header />
      <main className="flex-1 overflow-auto mb-6">
        <h1 className="text-2xl font-bold mb-6">Change Password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-400">Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage className="text-primary" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-400">New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                  <FormLabel className="text-gray-400">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage className="text-primary" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white w-full">
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
} 