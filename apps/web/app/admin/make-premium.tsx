"use client";

import { Button } from "@/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/utils/auth-context";

export default function MakePremium() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const makePremium = async () => {
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!authUser) {
        toast({
          title: "Error",
          description: "You must be logged in to upgrade.",
          variant: "destructive",
        });
        return;
      }

      console.log('Making user premium:', authUser.id);

      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", authUser.id);
      if (updateError) throw updateError;

      // Refresh user data to pick up the premium status
      if (refreshUser) {
        await refreshUser();
      }

      toast({
        title: "Success!",
        description: "Your account is now premium. You can now access branding settings.",
      });

      // Redirect to branding page after a short delay
      setTimeout(() => {
        router.push("/branding");
      }, 1500);
    } catch (err) {
      console.error("Error upgrading to premium:", err);
      toast({
        title: "Error",
        description: "Failed to set premium status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isPremium = user && (user as any)?.is_premium;

  return (
    <div className="space-y-4">
      {isPremium ? (
        <div className="text-center space-y-2">
          <p className="text-green-500">✓ You already have premium access!</p>
          <Button
            onClick={() => router.push("/branding")}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Go to Branding Settings
          </Button>
        </div>
      ) : (
        <Button onClick={makePremium} className="w-full bg-primary hover:bg-primary/90 text-white">
          Upgrade to Premium
        </Button>
      )}
    </div>
  );
}
